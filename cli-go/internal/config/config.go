// Package config stores the CLI settings, the session and the delete tokens.
//
// Files live in $XDG_CONFIG_HOME/hemmelig (usually ~/.config/hemmelig). The
// CLI creates the directory with mode 0700 and the files with mode 0600,
// because they hold credentials.
package config

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"
)

const (
	configFile = "config.json"
	tokensFile = "tokens.json"
)

// Session is a signed-in session from `hemmelig login`.
type Session struct {
	URL       string    `json:"url"`
	Cookie    string    `json:"cookie"`
	Username  string    `json:"username,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// Config is the content of config.json.
type Config struct {
	URL     string   `json:"url,omitempty"`
	APIKey  string   `json:"apiKey,omitempty"`
	Session *Session `json:"session,omitempty"`
}

// Dir returns the configuration directory. HEMMELIG_CONFIG_DIR overrides it,
// which the tests use.
func Dir() (string, error) {
	if dir := os.Getenv("HEMMELIG_CONFIG_DIR"); dir != "" {
		return dir, nil
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("find the config directory: %w", err)
	}
	return filepath.Join(base, "hemmelig"), nil
}

// Path returns the path of config.json.
func Path() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, configFile), nil
}

func readJSON(name string, out any) error {
	dir, err := Dir()
	if err != nil {
		return err
	}
	data, err := os.ReadFile(filepath.Join(dir, name))
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read %s: %w", name, err)
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("parse %s: %w", name, err)
	}
	return nil
}

func writeJSON(name string, value any) error {
	dir, err := Dir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return fmt.Errorf("create %s: %w", dir, err)
	}
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	path := filepath.Join(dir, name)
	// Write to a temporary file first, so a crash cannot leave a half file.
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, append(data, '\n'), 0o600); err != nil {
		return fmt.Errorf("write %s: %w", name, err)
	}
	return os.Rename(tmp, path)
}

// Load reads config.json. A missing file gives an empty Config.
func Load() (*Config, error) {
	cfg := &Config{}
	if err := readJSON(configFile, cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

// Save writes config.json with mode 0600.
func (c *Config) Save() error { return writeJSON(configFile, c) }

// Token is a delete token for one secret.
type Token struct {
	DeleteToken string    `json:"deleteToken"`
	SavedAt     time.Time `json:"savedAt"`
}

// Tokens maps "<base url>|<secret id>" to a delete token.
type Tokens map[string]Token

func tokenKey(baseURL, id string) string { return baseURL + "|" + id }

// LoadTokens reads tokens.json and drops tokens older than 30 days, because
// no secret lives longer than 28 days.
func LoadTokens() (Tokens, error) {
	tokens := Tokens{}
	if err := readJSON(tokensFile, &tokens); err != nil {
		return nil, err
	}
	cutoff := time.Now().Add(-30 * 24 * time.Hour)
	for key, token := range tokens {
		if token.SavedAt.Before(cutoff) {
			delete(tokens, key)
		}
	}
	return tokens, nil
}

// SaveDeleteToken stores the delete token for a secret.
func SaveDeleteToken(baseURL, id, token string) error {
	if token == "" {
		return nil
	}
	tokens, err := LoadTokens()
	if err != nil {
		return err
	}
	tokens[tokenKey(baseURL, id)] = Token{DeleteToken: token, SavedAt: time.Now()}
	return writeJSON(tokensFile, tokens)
}

// DeleteToken returns the stored delete token for a secret, if any.
func DeleteToken(baseURL, id string) string {
	tokens, err := LoadTokens()
	if err != nil {
		return ""
	}
	return tokens[tokenKey(baseURL, id)].DeleteToken
}

// ForgetDeleteToken removes the stored delete token for a secret.
func ForgetDeleteToken(baseURL, id string) error {
	tokens, err := LoadTokens()
	if err != nil {
		return err
	}
	if _, ok := tokens[tokenKey(baseURL, id)]; !ok {
		return nil
	}
	delete(tokens, tokenKey(baseURL, id))
	return writeJSON(tokensFile, tokens)
}
