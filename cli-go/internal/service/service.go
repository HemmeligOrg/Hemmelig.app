// Package service holds the Hemmelig operations that the CLI commands and
// the MCP server share. All encryption and decryption happen here, on the
// client, so plaintext never reaches the server.
package service

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
)

// TokenStore keeps delete tokens so that a later delete works.
type TokenStore interface {
	Save(baseURL, id, token string) error
	Get(baseURL, id string) string
	Forget(baseURL, id string) error
}

// Service runs operations against one Hemmelig instance.
type Service struct {
	API    *api.Client
	Tokens TokenStore
}

// ErrPasswordRequired means that the secret needs a password.
var ErrPasswordRequired = errors.New("this secret is password protected: give the password with --password")

// ErrNoKey means that the link has no decryption key.
var ErrNoKey = errors.New("the link has no decryption key: give the key with --key")

// Expirations are the secret lifetimes that the API accepts, in seconds.
var Expirations = map[string]int{
	"5m": 300, "30m": 1800, "1h": 3600, "4h": 14400, "12h": 43200,
	"1d": 86400, "3d": 259200, "7d": 604800, "14d": 1209600, "28d": 2419200,
}

// Validities are the request link lifetimes that the API accepts, in seconds.
var Validities = map[string]int{
	"1h": 3600, "12h": 43200, "1d": 86400, "3d": 259200, "7d": 604800, "14d": 1209600, "30d": 2592000,
}

func choices(values map[string]int) string {
	names := make([]string, 0, len(values))
	for name := range values {
		names = append(names, name)
	}
	sort.Slice(names, func(i, j int) bool { return values[names[i]] < values[names[j]] })
	return strings.Join(names, ", ")
}

// ParseExpiration converts a name such as "1d" to seconds.
func ParseExpiration(name string) (int, error) {
	if seconds, ok := Expirations[name]; ok {
		return seconds, nil
	}
	return 0, fmt.Errorf("invalid expiration %q: use one of %s", name, choices(Expirations))
}

// ParseValidity converts a request link lifetime such as "7d" to seconds.
func ParseValidity(name string) (int, error) {
	if seconds, ok := Validities[name]; ok {
		return seconds, nil
	}
	return 0, fmt.Errorf("invalid validity %q: use one of %s", name, choices(Validities))
}

// ExpirationName converts seconds back to a name, or returns the seconds.
func ExpirationName(seconds int) string {
	for name, value := range Expirations {
		if value == seconds {
			return name
		}
	}
	return fmt.Sprintf("%ds", seconds)
}

// clientFor returns a client for the host of a link. A link to another
// instance gets a client without credentials, so that the API key and the
// session never go to a host that the user did not configure.
func (s *Service) clientFor(linkBase string) *api.Client {
	if linkBase == "" || strings.EqualFold(strings.TrimRight(linkBase, "/"), s.API.BaseURL) {
		return s.API
	}
	return &api.Client{BaseURL: strings.TrimRight(linkBase, "/"), UserAgent: s.API.UserAgent, HTTP: s.API.HTTP}
}

func (s *Service) saveToken(baseURL, id, token string) {
	if s.Tokens != nil && token != "" {
		_ = s.Tokens.Save(baseURL, id, token)
	}
}

// parseSecretRef accepts a link or a bare secret ID.
func parseSecretRef(ref string) (links.Secret, error) {
	parsed, err := links.ParseSecret(ref)
	if err != nil {
		return links.Secret{}, fmt.Errorf("%q: %w", ref, err)
	}
	return parsed, nil
}
