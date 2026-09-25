package service

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/hcrypto"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
)

// CreateRequestInput describes a secret request. Someone else fills it in.
type CreateRequestInput struct {
	Title       string
	Description string
	// MaxViews is the view limit of the secret that the request creates.
	MaxViews int
	// ExpiresIn is the lifetime of that secret in seconds.
	ExpiresIn int
	// ValidFor is how long the request link works, in seconds.
	ValidFor    int
	AllowedIP   string
	PreventBurn bool
	WebhookURL  string
}

// CreateRequestResult is a new secret request.
type CreateRequestResult struct {
	ID            string `json:"id"`
	Link          string `json:"link"`
	ExpiresAt     string `json:"expiresAt"`
	WebhookSecret string `json:"webhookSecret,omitempty"`
}

// CreateRequest creates a secret request and returns the link to send.
func (s *Service) CreateRequest(ctx context.Context, in CreateRequestInput) (*CreateRequestResult, error) {
	payload := map[string]any{
		"title":       in.Title,
		"maxViews":    in.MaxViews,
		"expiresIn":   in.ExpiresIn,
		"validFor":    in.ValidFor,
		"preventBurn": in.PreventBurn,
	}
	if in.Description != "" {
		payload["description"] = in.Description
	}
	if in.AllowedIP != "" {
		payload["allowedIp"] = in.AllowedIP
	}
	if in.WebhookURL != "" {
		payload["webhookUrl"] = in.WebhookURL
	}

	var created struct {
		ID            string  `json:"id"`
		CreatorLink   string  `json:"creatorLink"`
		WebhookSecret *string `json:"webhookSecret"`
		ExpiresAt     string  `json:"expiresAt"`
	}
	if err := s.API.Send(ctx, http.MethodPost, "/api/secret-requests", payload, &created); err != nil {
		return nil, err
	}

	result := &CreateRequestResult{
		ID:        created.ID,
		Link:      requestLink(s.API.BaseURL, created.CreatorLink),
		ExpiresAt: created.ExpiresAt,
	}
	if created.WebhookSecret != nil {
		result.WebhookSecret = *created.WebhookSecret
	}
	return result, nil
}

// requestLink rebuilds the link on the configured base URL. The API builds
// it from the Origin header or HEMMELIG_BASE_URL. Without both, the API
// returns a relative path.
func requestLink(baseURL, creatorLink string) string {
	if strings.HasPrefix(creatorLink, "/") {
		creatorLink = strings.TrimRight(baseURL, "/") + creatorLink
	}
	parsed, err := links.ParseRequest(creatorLink)
	if err != nil || parsed.Token == "" {
		return creatorLink
	}
	return links.RequestLink(baseURL, parsed.ID, parsed.Token)
}

// SecretRequest is a secret request as the owner sees it.
type SecretRequest struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
	Status      string  `json:"status"`
	MaxViews    int     `json:"maxViews"`
	ExpiresIn   int     `json:"expiresIn"`
	PreventBurn *bool   `json:"preventBurn,omitempty"`
	AllowedIP   *string `json:"allowedIp,omitempty"`
	WebhookURL  *string `json:"webhookUrl"`
	CreatedAt   string  `json:"createdAt"`
	ExpiresAt   string  `json:"expiresAt"`
	FulfilledAt *string `json:"fulfilledAt"`
	SecretID    *string `json:"secretId"`
	Link        string  `json:"link,omitempty"`
}

// RequestList is one page of secret requests.
type RequestList struct {
	Data []SecretRequest `json:"data"`
	Meta Page            `json:"meta"`
}

// RequestStatuses are the values that the status filter accepts.
var RequestStatuses = []string{"all", "pending", "fulfilled", "expired", "cancelled"}

// ListRequests lists the secret requests of the signed-in user.
func (s *Service) ListRequests(ctx context.Context, status string, page, limit int) (*RequestList, error) {
	query := url.Values{}
	if status != "" {
		valid := false
		for _, value := range RequestStatuses {
			valid = valid || value == status
		}
		if !valid {
			return nil, fmt.Errorf("invalid status %q: use all, pending, fulfilled, expired or cancelled", status)
		}
		query.Set("status", status)
	}
	if page > 0 {
		query.Set("page", strconv.Itoa(page))
	}
	if limit > 0 {
		query.Set("limit", strconv.Itoa(limit))
	}
	var list RequestList
	if err := s.API.Get(ctx, "/api/secret-requests", query, &list); err != nil {
		return nil, err
	}
	if list.Data == nil {
		list.Data = []SecretRequest{}
	}
	return &list, nil
}

// requestID accepts a request ID or a request link.
func requestID(ref string) (string, error) {
	if links.IsID(ref) {
		return ref, nil
	}
	parsed, err := links.ParseRequest(ref)
	if err != nil {
		return "", fmt.Errorf("%q: %w", ref, err)
	}
	return parsed.ID, nil
}

// ShowRequest returns one secret request with its link.
func (s *Service) ShowRequest(ctx context.Context, ref string) (*SecretRequest, error) {
	id, err := requestID(ref)
	if err != nil {
		return nil, err
	}
	var request struct {
		SecretRequest
		CreatorLink string `json:"creatorLink"`
	}
	if err := s.API.Get(ctx, "/api/secret-requests/"+url.PathEscape(id), nil, &request); err != nil {
		return nil, err
	}
	result := request.SecretRequest
	result.Link = requestLink(s.API.BaseURL, request.CreatorLink)
	return &result, nil
}

// CancelRequest cancels a pending secret request.
func (s *Service) CancelRequest(ctx context.Context, ref string) error {
	id, err := requestID(ref)
	if err != nil {
		return err
	}
	return s.API.Do(ctx, api.Request{Method: http.MethodDelete, Path: "/api/secret-requests/" + url.PathEscape(id)}, nil)
}

// RequestInfo is what the person who fills in a request sees.
type RequestInfo struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
}

func (s *Service) requestTarget(ref string) (links.Request, *api.Client, error) {
	parsed, err := links.ParseRequest(ref)
	if err != nil {
		return links.Request{}, nil, fmt.Errorf("%q: %w", ref, err)
	}
	return parsed, s.clientFor(parsed.BaseURL), nil
}

// OpenRequest shows the title and description of a request link. It does
// not need an account.
func (s *Service) OpenRequest(ctx context.Context, ref string) (*RequestInfo, error) {
	parsed, client, err := s.requestTarget(ref)
	if err != nil {
		return nil, err
	}
	var info RequestInfo
	err = client.Do(ctx, api.Request{
		Method:  http.MethodGet,
		Path:    "/api/secret-requests/" + url.PathEscape(parsed.ID) + "/info",
		Headers: map[string]string{"X-Secret-Request-Token": parsed.Token},
		NoAuth:  true,
	}, &info)
	if err != nil {
		return nil, requestGone(err)
	}
	return &info, nil
}

// SubmitRequestResult is the secret created for a request.
type SubmitRequestResult struct {
	SecretID string `json:"secretId"`
	Key      string `json:"key"`
	Link     string `json:"link"`
}

// SubmitRequest encrypts the text locally and fills in a request link. Send
// the key back to the person who asked. The server never gets the key.
func (s *Service) SubmitRequest(ctx context.Context, ref, text, title string) (*SubmitRequestResult, error) {
	parsed, client, err := s.requestTarget(ref)
	if err != nil {
		return nil, err
	}

	key, err := hcrypto.GenerateKey()
	if err != nil {
		return nil, err
	}
	salt, err := hcrypto.GenerateSalt()
	if err != nil {
		return nil, err
	}
	cipher, err := hcrypto.NewCipher(key, salt)
	if err != nil {
		return nil, err
	}
	encrypted, err := cipher.EncryptString(text)
	if err != nil {
		return nil, err
	}
	payload := map[string]any{"secret": api.Bytes(encrypted), "salt": salt, "title": nil}
	if title != "" {
		encryptedTitle, err := cipher.EncryptString(title)
		if err != nil {
			return nil, err
		}
		payload["title"] = api.Bytes(encryptedTitle)
	}

	var created struct {
		SecretID string `json:"secretId"`
	}
	err = client.Do(ctx, api.Request{
		Method:  http.MethodPost,
		Path:    "/api/secret-requests/" + url.PathEscape(parsed.ID) + "/submit",
		Headers: map[string]string{"X-Secret-Request-Token": parsed.Token},
		JSON:    payload,
		NoAuth:  true,
	}, &created)
	if err != nil {
		return nil, requestGone(err)
	}
	return &SubmitRequestResult{
		SecretID: created.SecretID,
		Key:      key,
		Link:     links.SecretLink(client.BaseURL, created.SecretID, key),
	}, nil
}

func requestGone(err error) error {
	switch api.StatusOf(err) {
	case http.StatusNotFound:
		return fmt.Errorf("request not found: check the link (%w)", err)
	case http.StatusGone:
		return fmt.Errorf("the request is already fulfilled or expired (%w)", err)
	}
	return err
}
