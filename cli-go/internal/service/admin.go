package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
)

// ErrAdminRequired means that the credential does not belong to an admin.
var ErrAdminRequired = errors.New("this action needs an admin account: the API key or the session does not belong to an admin")

func adminError(err error) error {
	if api.StatusOf(err) == http.StatusForbidden {
		return errors.Join(ErrAdminRequired, err)
	}
	return err
}

// AdminUser is a user as an admin sees it.
type AdminUser struct {
	ID         string  `json:"id"`
	Username   string  `json:"username"`
	Email      string  `json:"email"`
	Name       *string `json:"name,omitempty"`
	Role       *string `json:"role"`
	Banned     *bool   `json:"banned"`
	BanReason  *string `json:"banReason,omitempty"`
	BanExpires *string `json:"banExpires,omitempty"`
	CreatedAt  string  `json:"createdAt"`
}

// UserList is one page of users.
type UserList struct {
	Users      []AdminUser `json:"users"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// ListUsers lists the users. Search matches the username, the email and the name.
func (s *Service) ListUsers(ctx context.Context, search string, page, pageSize int) (*UserList, error) {
	query := url.Values{}
	if search != "" {
		query.Set("search", search)
	}
	if page > 0 {
		query.Set("page", strconv.Itoa(page))
	}
	if pageSize > 0 {
		query.Set("pageSize", strconv.Itoa(pageSize))
	}
	var list UserList
	if err := s.API.Get(ctx, "/api/user", query, &list); err != nil {
		return nil, adminError(err)
	}
	if list.Users == nil {
		list.Users = []AdminUser{}
	}
	return &list, nil
}

// ResolveUser finds the ID of a user from an ID, a username or an email.
func (s *Service) ResolveUser(ctx context.Context, ref string) (string, error) {
	list, err := s.ListUsers(ctx, ref, 1, 100)
	if err != nil {
		return "", err
	}
	for _, user := range list.Users {
		if user.ID == ref || strings.EqualFold(user.Username, ref) || strings.EqualFold(user.Email, ref) {
			return user.ID, nil
		}
	}
	// The search does not match IDs, so an unknown value can still be an ID.
	return ref, nil
}

// CreateUserInput describes a new user.
type CreateUserInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
	Role     string `json:"role,omitempty"`
}

// CreateUser creates a user.
func (s *Service) CreateUser(ctx context.Context, in CreateUserInput) (*AdminUser, error) {
	var user AdminUser
	if err := s.API.Send(ctx, http.MethodPost, "/api/user", in, &user); err != nil {
		return nil, adminError(err)
	}
	return &user, nil
}

// UpdateUserInput changes a user. Empty fields keep their value.
type UpdateUserInput struct {
	Username string `json:"username,omitempty"`
	Email    string `json:"email,omitempty"`
	Role     string `json:"role,omitempty"`
}

func (s *Service) userPath(ctx context.Context, ref string) (string, error) {
	id, err := s.ResolveUser(ctx, ref)
	if err != nil {
		return "", err
	}
	return "/api/user/" + url.PathEscape(id), nil
}

// UpdateUser changes the username, the email or the role of a user.
func (s *Service) UpdateUser(ctx context.Context, ref string, in UpdateUserInput) (*AdminUser, error) {
	if in.Username == "" && in.Email == "" && in.Role == "" {
		return nil, errors.New("give at least one of --username, --email and --role")
	}
	if in.Role != "" && in.Role != "user" && in.Role != "admin" {
		return nil, fmt.Errorf("invalid role %q: use user or admin", in.Role)
	}
	path, err := s.userPath(ctx, ref)
	if err != nil {
		return nil, err
	}
	var user AdminUser
	if err := s.API.Send(ctx, http.MethodPut, path, in, &user); err != nil {
		return nil, adminError(err)
	}
	return &user, nil
}

// BanUser bans a user. Zero seconds bans the user until an admin unbans them.
func (s *Service) BanUser(ctx context.Context, ref, reason string, expiresInSeconds int) (*AdminUser, error) {
	path, err := s.userPath(ctx, ref)
	if err != nil {
		return nil, err
	}
	body := map[string]any{}
	if reason != "" {
		body["reason"] = reason
	}
	if expiresInSeconds > 0 {
		body["expiresInSeconds"] = expiresInSeconds
	}
	var user AdminUser
	if err := s.API.Send(ctx, http.MethodPost, path+"/ban", body, &user); err != nil {
		return nil, adminError(err)
	}
	return &user, nil
}

// UnbanUser removes the ban of a user.
func (s *Service) UnbanUser(ctx context.Context, ref string) (*AdminUser, error) {
	path, err := s.userPath(ctx, ref)
	if err != nil {
		return nil, err
	}
	var user AdminUser
	if err := s.API.Send(ctx, http.MethodPost, path+"/unban", map[string]string{}, &user); err != nil {
		return nil, adminError(err)
	}
	return &user, nil
}

// SetUserPassword sets a new password for a user.
func (s *Service) SetUserPassword(ctx context.Context, ref, password string) error {
	path, err := s.userPath(ctx, ref)
	if err != nil {
		return err
	}
	return adminError(s.API.Send(ctx, http.MethodPut, path+"/password", map[string]string{"password": password}, nil))
}

// DeleteUser deletes a user and the data of the user.
func (s *Service) DeleteUser(ctx context.Context, ref string) error {
	path, err := s.userPath(ctx, ref)
	if err != nil {
		return err
	}
	return adminError(s.API.Do(ctx, api.Request{Method: http.MethodDelete, Path: path}, nil))
}

// Invite is an invite code.
type Invite struct {
	ID        string  `json:"id"`
	Code      string  `json:"code"`
	Uses      int     `json:"uses"`
	MaxUses   *int    `json:"maxUses"`
	ExpiresAt *string `json:"expiresAt"`
	CreatedBy string  `json:"createdBy"`
	CreatedAt string  `json:"createdAt"`
	IsActive  bool    `json:"isActive"`
}

// ListInvites lists the invite codes.
func (s *Service) ListInvites(ctx context.Context) ([]Invite, error) {
	invites := []Invite{}
	if err := s.API.Get(ctx, "/api/invites", nil, &invites); err != nil {
		return nil, adminError(err)
	}
	return invites, nil
}

// CreateInvite creates an invite code. Zero days means no expiry.
func (s *Service) CreateInvite(ctx context.Context, maxUses, expiresInDays int) (*Invite, error) {
	body := map[string]int{}
	if maxUses > 0 {
		body["maxUses"] = maxUses
	}
	if expiresInDays > 0 {
		body["expiresInDays"] = expiresInDays
	}
	var invite Invite
	if err := s.API.Send(ctx, http.MethodPost, "/api/invites", body, &invite); err != nil {
		return nil, adminError(err)
	}
	return &invite, nil
}

// DeactivateInvite stops an invite code. It accepts the ID or the code.
func (s *Service) DeactivateInvite(ctx context.Context, ref string) error {
	id := ref
	invites, err := s.ListInvites(ctx)
	if err != nil {
		return err
	}
	for _, invite := range invites {
		if strings.EqualFold(invite.Code, ref) {
			id = invite.ID
		}
	}
	return adminError(s.API.Do(ctx, api.Request{Method: http.MethodDelete, Path: "/api/invites/" + url.PathEscape(id)}, nil))
}

// SettingKind is the JSON type of an instance setting.
type SettingKind int

// The kinds of instance settings.
const (
	KindString SettingKind = iota
	KindBool
	KindInt
)

// SettingSections groups the instance settings as the admin dashboard does.
var SettingSections = map[string]map[string]SettingKind{
	"general": {
		"instanceName": KindString, "instanceDescription": KindString,
		"instanceLogo": KindString, "instanceLogoDark": KindString, "defaultTheme": KindString,
		"allowRegistration": KindBool, "requireEmailVerification": KindBool,
		"maxSecretsPerUser": KindInt, "defaultSecretExpiration": KindInt,
		"defaultMaxViews": KindInt, "maxSecretSize": KindInt, "importantMessage": KindString,
	},
	"security": {
		"allowPasswordProtection": KindBool, "allowIpRestriction": KindBool,
		"allowFileUploads": KindBool, "maxPasswordAttempts": KindInt, "sessionTimeout": KindInt,
		"enableRateLimiting": KindBool, "rateLimitRequests": KindInt, "rateLimitWindow": KindInt,
	},
	"organization": {
		"requireInviteCode": KindBool, "allowedEmailDomains": KindString,
		"requireRegisteredUser": KindBool, "disableEmailPasswordSignup": KindBool,
	},
	"webhook": {
		"webhookEnabled": KindBool, "webhookUrl": KindString, "webhookSecret": KindString,
		"webhookOnView": KindBool, "webhookOnBurn": KindBool,
	},
	"metrics": {
		"metricsEnabled": KindBool, "metricsSecret": KindString,
	},
}

// SectionNames returns the section names in dashboard order.
func SectionNames() []string {
	return []string{"general", "security", "organization", "webhook", "metrics"}
}

// SectionKeys returns the keys of a section in alphabetical order.
func SectionKeys(section string) []string {
	keys := make([]string, 0, len(SettingSections[section]))
	for key := range SettingSections[section] {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

// InstanceSettings returns the instance settings, or one section of them.
func (s *Service) InstanceSettings(ctx context.Context, section string) (map[string]any, error) {
	var settings map[string]any
	if err := s.API.Get(ctx, "/api/instance/settings", nil, &settings); err != nil {
		return nil, adminError(err)
	}
	if section == "" {
		return settings, nil
	}
	keys, ok := SettingSections[section]
	if !ok {
		return nil, fmt.Errorf("unknown section %q: use %s", section, strings.Join(SectionNames(), ", "))
	}
	filtered := map[string]any{}
	for key := range keys {
		if value, found := settings[key]; found {
			filtered[key] = value
		}
	}
	return filtered, nil
}

// ParseSettings converts key=value pairs of a section to typed values.
func ParseSettings(section string, pairs []string) (map[string]any, error) {
	keys, ok := SettingSections[section]
	if !ok {
		return nil, fmt.Errorf("unknown section %q: use %s", section, strings.Join(SectionNames(), ", "))
	}
	if len(pairs) == 0 {
		return nil, errors.New("give at least one key=value pair")
	}
	values := map[string]any{}
	for _, pair := range pairs {
		key, raw, found := strings.Cut(pair, "=")
		if !found {
			return nil, fmt.Errorf("%q is not key=value", pair)
		}
		kind, known := keys[key]
		if !known {
			return nil, fmt.Errorf("unknown key %q in section %s: use %s", key, section, strings.Join(SectionKeys(section), ", "))
		}
		switch kind {
		case KindBool:
			value, err := strconv.ParseBool(raw)
			if err != nil {
				return nil, fmt.Errorf("%s must be true or false", key)
			}
			values[key] = value
		case KindInt:
			value, err := strconv.Atoi(raw)
			if err != nil {
				return nil, fmt.Errorf("%s must be a whole number", key)
			}
			values[key] = value
		default:
			values[key] = raw
		}
	}
	return values, nil
}

// UpdateInstanceSettings changes instance settings and returns the result.
func (s *Service) UpdateInstanceSettings(ctx context.Context, values map[string]any) (map[string]any, error) {
	var settings map[string]any
	if err := s.API.Send(ctx, http.MethodPut, "/api/instance/settings", values, &settings); err != nil {
		return nil, adminError(err)
	}
	return settings, nil
}

// AnalyticsRanges are the time ranges that the analytics API accepts.
var AnalyticsRanges = []string{"7d", "14d", "30d"}

// Analytics holds the secret statistics and the daily visitor statistics.
type Analytics struct {
	Range    string         `json:"range"`
	Secrets  map[string]any `json:"secrets"`
	Visitors []any          `json:"visitors"`
}

// GetAnalytics returns the analytics for a time range.
func (s *Service) GetAnalytics(ctx context.Context, timeRange string) (*Analytics, error) {
	if timeRange == "" {
		timeRange = "30d"
	}
	valid := false
	for _, value := range AnalyticsRanges {
		valid = valid || value == timeRange
	}
	if !valid {
		return nil, fmt.Errorf("invalid range %q: use 7d, 14d or 30d", timeRange)
	}
	query := url.Values{"timeRange": {timeRange}}
	result := &Analytics{Range: timeRange, Visitors: []any{}}
	if err := s.API.Get(ctx, "/api/analytics", query, &result.Secrets); err != nil {
		return nil, adminError(err)
	}
	if err := s.API.Get(ctx, "/api/analytics/visitors/daily", query, &result.Visitors); err != nil {
		return nil, adminError(err)
	}
	return result, nil
}

// Health is the readiness report of the instance.
type Health struct {
	Status string         `json:"status"`
	Checks map[string]any `json:"checks,omitempty"`
}

// GetHealth calls the readiness probe. It returns the report also when the
// instance is unhealthy.
func (s *Service) GetHealth(ctx context.Context) (*Health, error) {
	var health Health
	err := s.API.Do(ctx, api.Request{Method: http.MethodGet, Path: "/api/health/ready", NoAuth: true}, &health)
	if err != nil && api.StatusOf(err) != http.StatusServiceUnavailable {
		return nil, err
	}
	if err != nil {
		return &Health{Status: "unhealthy"}, err
	}
	return &health, nil
}
