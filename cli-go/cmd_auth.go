package main

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/config"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

var configKeys = []string{"url", "api-key"}

func (a *app) configCommand(args []string) error {
	return a.group("config", "Store the instance URL and the API key in the config file. The file has mode 0600.", args, []subcommand{
		{"set", "Set url or api-key", a.configSet},
		{"get", "Show the settings, or one of them", a.configGet},
		{"unset", "Remove url or api-key", a.configUnset},
		{"path", "Print the path of the config file", a.configPath},
	})
}

func (a *app) configSet(args []string) error {
	fs := newFlagSet("hemmelig config set <url|api-key> [value]",
		"Store a setting. Without a value for api-key, the CLI asks for it without echo.",
		`hemmelig config set url https://secrets.example.com`, `hemmelig config set api-key`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) < 1 || len(fs.Args()) > 2 {
		return usagef("give a key and a value")
	}
	key := fs.Args()[0]
	val := ""
	if len(fs.Args()) == 2 {
		val = fs.Args()[1]
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	switch key {
	case "url":
		if val == "" {
			return usagef("give the URL, for example https://secrets.example.com")
		}
		normalized, err := links.NormalizeBaseURL(val)
		if err != nil {
			return usageError{err}
		}
		if cfg.APIKey != "" && cfg.URL != "" && !sameURL(cfg.URL, normalized) {
			a.info("The stored API key belongs to %s. Set a new key for %s.", cfg.URL, normalized)
			cfg.APIKey = ""
		}
		cfg.URL = normalized
	case "api-key":
		if val == "" {
			if val, err = a.prompt.Secret("API key: "); err != nil {
				return err
			}
		}
		if !strings.HasPrefix(val, "hemmelig_") {
			return usagef("an API key starts with hemmelig_")
		}
		cfg.APIKey = val
		if cfg.URL == "" {
			// Bind the key to the instance it belongs to.
			s, err := a.settings()
			if err != nil {
				return err
			}
			cfg.URL = s.URL
		}
	default:
		return usagef("unknown key %q: use %s", key, strings.Join(configKeys, " or "))
	}
	if err := cfg.Save(); err != nil {
		return err
	}
	return a.done("Saved "+key+".", map[string]string{"saved": key})
}

func maskKey(key string) string {
	if key == "" {
		return ""
	}
	if len(key) <= 16 {
		return "hemmelig_..."
	}
	return key[:16] + "..."
}

func (a *app) configGet(args []string) error {
	fs := newFlagSet("hemmelig config get [key]", "Show the stored settings. The API key shows only its prefix.", `hemmelig config get`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	values := map[string]string{"url": cfg.URL, "api-key": maskKey(cfg.APIKey)}
	if cfg.Session != nil {
		values["session"] = cfg.Session.Username + " on " + cfg.Session.URL
	}
	if len(fs.Args()) == 1 {
		val, ok := values[fs.Args()[0]]
		if !ok {
			return usagef("unknown key %q: use url, api-key or session", fs.Args()[0])
		}
		return a.output(map[string]string{fs.Args()[0]: val}, func() { fmt.Fprintln(a.stdout, val) })
	}
	return a.output(values, func() {
		a.table([]string{"KEY", "VALUE"}, [][]string{
			{"url", value(ptr(values["url"]))}, {"api-key", value(ptr(values["api-key"]))}, {"session", value(ptr(values["session"]))},
		})
	})
}

func ptr[T any](v T) *T { return &v }

func (a *app) configUnset(args []string) error {
	fs := newFlagSet("hemmelig config unset <url|api-key>", "Remove a stored setting.", `hemmelig config unset api-key`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give url or api-key")
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	switch fs.Args()[0] {
	case "url":
		cfg.URL = ""
	case "api-key":
		cfg.APIKey = ""
	default:
		return usagef("unknown key %q: use url or api-key", fs.Args()[0])
	}
	if err := cfg.Save(); err != nil {
		return err
	}
	return a.done("Removed "+fs.Args()[0]+".", map[string]string{"removed": fs.Args()[0]})
}

func (a *app) configPath(args []string) error {
	fs := newFlagSet("hemmelig config path", "Print the path of the config file.", `hemmelig config path`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	path, err := config.Path()
	if err != nil {
		return err
	}
	return a.output(map[string]string{"path": path}, func() { fmt.Fprintln(a.stdout, path) })
}

func (a *app) loginCommand(args []string) error {
	fs := newFlagSet("hemmelig login [flags]",
		"Sign in with a username and a password. The CLI stores the session in the config file. Credential changes need this session. When stdin is not a terminal, the CLI reads the password and the 2FA code as lines from stdin.",
		`hemmelig login --username jane_doe`,
		`hemmelig login --url https://secrets.example.com --username jane_doe --code 123456`,
		`printf '%s\n' "$HEMMELIG_PASSWORD" | hemmelig login --username jane_doe`)
	username := fs.String("username", "", "", "name", "Username")
	code := fs.String("code", "", "", "code", "2FA code from the authenticator app")
	backupCode := fs.Bool("backup-code", "", "Ask for a 2FA backup code instead of an app code")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	s, err := a.settings()
	if err != nil {
		return err
	}
	name := *username
	if name == "" {
		if name, err = a.prompt.Line("Username: "); err != nil {
			return err
		}
	}
	password, err := a.prompt.Secret("Password: ")
	if err != nil {
		return err
	}

	secondFactor := func() (string, bool, error) {
		if *code != "" {
			return *code, *backupCode, nil
		}
		label := "2FA code: "
		if *backupCode {
			label = "2FA backup code: "
		}
		answer, err := a.prompt.Line(label)
		return answer, *backupCode, err
	}
	result, err := service.Login(a.ctx, s.URL, userAgent(), strings.TrimSpace(name), password, secondFactor)
	if err != nil {
		return err
	}

	s.Config.Session = &config.Session{URL: s.URL, Cookie: result.Cookie, Username: result.User.Username, CreatedAt: time.Now().UTC()}
	if s.Config.URL == "" {
		s.Config.URL = s.URL
	}
	if err := s.Config.Save(); err != nil {
		return err
	}
	return a.output(result.User, func() {
		fmt.Fprintf(a.stdout, "Signed in as %s on %s.\n", result.User.Username, s.URL)
	})
}

func (a *app) logoutCommand(args []string) error {
	fs := newFlagSet("hemmelig logout", "End the session and remove it from the config file. A stored API key stays.", `hemmelig logout`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	if cfg.Session == nil {
		return a.done("No session to end.", map[string]bool{"signedOut": false})
	}
	svc, _, err := a.sessionService()
	if err == nil {
		// The local session goes away also when the server call fails.
		if err := svc.Logout(a.ctx); err != nil {
			a.info("The server did not end the session: %v", err)
		}
	}
	cfg.Session = nil
	if err := cfg.Save(); err != nil {
		return err
	}
	return a.done("Signed out.", map[string]bool{"signedOut": true})
}

type whoami struct {
	URL        string        `json:"url"`
	AuthMethod string        `json:"authMethod"`
	Source     string        `json:"source,omitempty"`
	User       *service.User `json:"user,omitempty"`
}

func (a *app) whoamiCommand(args []string) error {
	fs := newFlagSet("hemmelig whoami", "Show the instance URL, the credential that the CLI uses and its user.", `hemmelig whoami --json`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, s, err := a.service()
	if err != nil {
		return err
	}
	result := whoami{URL: s.URL, AuthMethod: "none"}
	switch {
	case svc.API.APIKey != "":
		result.AuthMethod, result.Source = "apiKey", s.APIKeySource
	case svc.API.Cookie != "":
		result.AuthMethod, result.Source = "session", "hemmelig login"
	}
	if result.AuthMethod != "none" {
		user, err := svc.Account(a.ctx)
		if err != nil {
			if result.AuthMethod == "session" && api.StatusOf(err) == http.StatusUnauthorized {
				return fmt.Errorf("the session does not work, run hemmelig login again: %w", err)
			}
			return err
		}
		result.User = user
	}
	return a.output(result, func() {
		rows := [][]string{{"URL", result.URL}, {"Auth", result.AuthMethod}}
		if result.Source != "" {
			rows = append(rows, []string{"Source", result.Source})
		}
		if result.User == nil {
			a.table([]string{"FIELD", "VALUE"}, rows)
			a.info("Not signed in. Run hemmelig login, or set HEMMELIG_API_KEY.")
			return
		}
		a.printUser(result.User, rows)
	})
}
