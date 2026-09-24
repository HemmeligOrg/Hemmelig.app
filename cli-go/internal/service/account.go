package service

import (
	"context"
	"errors"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
)

// ErrSessionRequired means that the action changes credentials. API keys
// cannot do that, so that a leaked key cannot take over the account.
var ErrSessionRequired = errors.New("this action needs a signed-in session: run hemmelig login first")

// User is the signed-in user.
type User struct {
	ID               string `json:"id,omitempty"`
	Username         string `json:"username"`
	Email            string `json:"email"`
	Name             string `json:"name,omitempty"`
	Role             string `json:"role,omitempty"`
	TwoFactorEnabled *bool  `json:"twoFactorEnabled,omitempty"`
}

type sessionResponse struct {
	User *User `json:"user"`
}

// Session returns the user of the session cookie, or nil when the session
// is missing or expired.
func (s *Service) Session(ctx context.Context) (*User, error) {
	if s.API.Cookie == "" {
		return nil, nil
	}
	var session sessionResponse
	err := s.API.Do(ctx, api.Request{Method: http.MethodGet, Path: "/api/auth/get-session"}, &session)
	if err != nil {
		return nil, err
	}
	return session.User, nil
}

// Account returns the account of the current credential. /api/account
// returns the role and the 2FA state for a session and for an API key. A
// session also adds the display name.
func (s *Service) Account(ctx context.Context) (*User, error) {
	var account User
	if err := s.API.Get(ctx, "/api/account", nil, &account); err != nil {
		return nil, err
	}
	if s.API.Cookie != "" {
		if session, err := s.Session(ctx); err == nil && session != nil {
			account.ID = session.ID
			account.Name = session.Name
			account.Role = session.Role
			account.TwoFactorEnabled = session.TwoFactorEnabled
		}
	}
	return &account, nil
}

// UpdateAccount changes the username and the email. The API needs both, so
// an empty value keeps the current one.
func (s *Service) UpdateAccount(ctx context.Context, username, email string) (*User, error) {
	if username == "" || email == "" {
		current, err := s.Account(ctx)
		if err != nil {
			return nil, err
		}
		if username == "" {
			username = current.Username
		}
		if email == "" {
			email = current.Email
		}
	}
	var updated User
	err := s.API.Send(ctx, http.MethodPut, "/api/account", map[string]string{"username": username, "email": email}, &updated)
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

func (s *Service) requireSession() error {
	if s.API.Cookie == "" {
		return ErrSessionRequired
	}
	return nil
}

func sessionError(err error) error {
	if api.StatusOf(err) == http.StatusUnauthorized {
		return errors.Join(ErrSessionRequired, err)
	}
	return err
}

// ChangePassword changes the password of the signed-in user.
func (s *Service) ChangePassword(ctx context.Context, current, next string) error {
	if err := s.requireSession(); err != nil {
		return err
	}
	body := map[string]string{"currentPassword": current, "newPassword": next, "confirmPassword": next}
	return sessionError(s.API.Send(ctx, http.MethodPut, "/api/account/password", body, nil))
}

// DeleteAccount deletes the signed-in user and all of their data.
func (s *Service) DeleteAccount(ctx context.Context) error {
	if err := s.requireSession(); err != nil {
		return err
	}
	return sessionError(s.API.Do(ctx, api.Request{Method: http.MethodDelete, Path: "/api/account"}, nil))
}

// TwoFactorSetup is the data to add the account to an authenticator app.
type TwoFactorSetup struct {
	TOTPURI     string   `json:"totpURI"`
	BackupCodes []string `json:"backupCodes"`
}

// EnableTwoFactor starts the 2FA setup. Call VerifyTwoFactor with a code
// from the authenticator app to finish it.
func (s *Service) EnableTwoFactor(ctx context.Context, password string) (*TwoFactorSetup, error) {
	if err := s.requireSession(); err != nil {
		return nil, err
	}
	var setup TwoFactorSetup
	err := s.API.Send(ctx, http.MethodPost, "/api/auth/two-factor/enable", map[string]string{"password": password}, &setup)
	if err != nil {
		return nil, sessionError(err)
	}
	return &setup, nil
}

// VerifyTwoFactor checks a TOTP code for the signed-in user. It finishes
// the 2FA setup.
func (s *Service) VerifyTwoFactor(ctx context.Context, code string) error {
	if err := s.requireSession(); err != nil {
		return err
	}
	body := map[string]string{"code": strings.TrimSpace(code)}
	return sessionError(s.API.Send(ctx, http.MethodPost, "/api/auth/two-factor/verify-totp", body, nil))
}

// DisableTwoFactor turns off 2FA for the signed-in user.
func (s *Service) DisableTwoFactor(ctx context.Context, password string) error {
	if err := s.requireSession(); err != nil {
		return err
	}
	return sessionError(s.API.Send(ctx, http.MethodPost, "/api/auth/two-factor/disable", map[string]string{"password": password}, nil))
}

// TwoFactorStatus reports whether 2FA is on for the signed-in user.
func (s *Service) TwoFactorStatus(ctx context.Context) (bool, error) {
	account, err := s.Account(ctx)
	if err != nil {
		return false, err
	}
	if account.TwoFactorEnabled == nil {
		return false, ErrSessionRequired
	}
	return *account.TwoFactorEnabled, nil
}

// APIKey is an API key without its secret value.
type APIKey struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	KeyPrefix  string  `json:"keyPrefix"`
	LastUsedAt *string `json:"lastUsedAt"`
	ExpiresAt  *string `json:"expiresAt"`
	CreatedAt  string  `json:"createdAt"`
	// Key is the full key. The API returns it only once, at creation.
	Key string `json:"key,omitempty"`
}

// ListAPIKeys lists the API keys of the current user.
func (s *Service) ListAPIKeys(ctx context.Context) ([]APIKey, error) {
	keys := []APIKey{}
	if err := s.API.Get(ctx, "/api/api-keys", nil, &keys); err != nil {
		return nil, err
	}
	return keys, nil
}

// CreateAPIKey creates an API key. It needs a session. Zero days means that
// the key does not expire.
func (s *Service) CreateAPIKey(ctx context.Context, name string, expiresInDays int) (*APIKey, error) {
	if err := s.requireSession(); err != nil {
		return nil, err
	}
	body := map[string]any{"name": name}
	if expiresInDays > 0 {
		body["expiresInDays"] = expiresInDays
	}
	var key APIKey
	if err := s.API.Send(ctx, http.MethodPost, "/api/api-keys", body, &key); err != nil {
		return nil, sessionError(err)
	}
	return &key, nil
}

// RevokeAPIKey deletes an API key.
func (s *Service) RevokeAPIKey(ctx context.Context, id string) error {
	return s.API.Do(ctx, api.Request{Method: http.MethodDelete, Path: "/api/api-keys/" + url.PathEscape(id)}, nil)
}

// SecondFactor asks for a 2FA code during sign-in. It returns the code and
// true when the code is a backup code.
type SecondFactor func() (code string, backup bool, err error)

// LoginResult is a new session.
type LoginResult struct {
	Cookie string
	User   *User
}

// Login signs in with a username and a password and returns the session
// cookie. When the account has 2FA, it calls secondFactor for a code.
func Login(ctx context.Context, baseURL, userAgent, username, password string, secondFactor SecondFactor) (*LoginResult, error) {
	jar, err := cookiejar.New(nil)
	if err != nil {
		return nil, err
	}
	client := &api.Client{
		BaseURL:   baseURL,
		UserAgent: userAgent,
		HTTP:      &http.Client{Timeout: time.Minute, Jar: jar},
	}

	var signIn struct {
		TwoFactorRedirect bool `json:"twoFactorRedirect"`
	}
	body := map[string]string{"username": username, "password": password}
	if err := client.Send(ctx, http.MethodPost, "/api/auth/sign-in/username", body, &signIn); err != nil {
		return nil, err
	}

	if signIn.TwoFactorRedirect {
		if secondFactor == nil {
			return nil, errors.New("this account uses 2FA: give a code with --code")
		}
		code, backup, err := secondFactor()
		if err != nil {
			return nil, err
		}
		path := "/api/auth/two-factor/verify-totp"
		if backup {
			path = "/api/auth/two-factor/verify-backup-code"
		}
		if err := client.Send(ctx, http.MethodPost, path, map[string]string{"code": strings.TrimSpace(code)}, nil); err != nil {
			return nil, err
		}
	}

	target, err := url.Parse(baseURL + "/api/auth/get-session")
	if err != nil {
		return nil, err
	}
	parts := []string{}
	for _, cookie := range jar.Cookies(target) {
		parts = append(parts, cookie.Name+"="+cookie.Value)
	}
	if len(parts) == 0 {
		return nil, errors.New("the server did not return a session cookie")
	}

	result := &LoginResult{Cookie: strings.Join(parts, "; ")}
	session := &Service{API: &api.Client{BaseURL: baseURL, UserAgent: userAgent, Cookie: result.Cookie}}
	user, err := session.Session(ctx)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("sign-in did not create a session")
	}
	result.User = user
	return result, nil
}

// Logout ends the session on the server.
func (s *Service) Logout(ctx context.Context) error {
	if s.API.Cookie == "" {
		return nil
	}
	return s.API.Send(ctx, http.MethodPost, "/api/auth/sign-out", map[string]string{}, nil)
}
