// Package api is a small HTTP client for the Hemmelig API.
package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client calls one Hemmelig instance.
type Client struct {
	// BaseURL is the instance URL without a trailing slash, for example
	// https://hemmelig.app.
	BaseURL string
	// APIKey authenticates with `Authorization: Bearer <key>` when it is set.
	APIKey string
	// Cookie is the session cookie header from `hemmelig login`.
	Cookie string
	// OnCookie runs when the server replaces the session cookie, for
	// example after 2FA changes. The CLI stores the new value.
	OnCookie func(cookie string)
	// UserAgent identifies the CLI.
	UserAgent string
	HTTP      *http.Client
}

// Error is an HTTP error from the API.
type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string {
	if e.Message == "" {
		return fmt.Sprintf("request failed with status %d", e.Status)
	}
	return fmt.Sprintf("%s (status %d)", e.Message, e.Status)
}

// StatusOf returns the HTTP status of an API error, or 0 for other errors.
func StatusOf(err error) int {
	var apiErr *Error
	if errors.As(err, &apiErr) {
		return apiErr.Status
	}
	return 0
}

// Request describes one API call.
type Request struct {
	Method string
	// Path is relative to BaseURL, for example /api/secrets.
	Path    string
	Query   url.Values
	Headers map[string]string
	// JSON is marshaled as the request body when it is not nil.
	JSON any
	// Body is sent as-is when JSON is nil.
	Body          io.Reader
	ContentLength int64
	ContentType   string
	// NoAuth sends the request without the API key or the session cookie.
	NoAuth bool
}

// Response is a raw API response. Close Body when you are done.
type Response struct {
	Status  int
	Headers http.Header
	Body    io.ReadCloser
}

func (c *Client) httpClient() *http.Client {
	if c.HTTP != nil {
		return c.HTTP
	}
	return &http.Client{Timeout: 5 * time.Minute}
}

// Raw sends the request and returns the response for any status.
func (c *Client) Raw(ctx context.Context, r Request) (*Response, error) {
	target := c.BaseURL + r.Path
	if len(r.Query) > 0 {
		target += "?" + r.Query.Encode()
	}

	// The CSRF check of the API treats an unsafe request without a content
	// type as a form post. Browsers pass the check with Sec-Fetch-Site. The
	// CLI sends an empty JSON object, which a cross-site form cannot send.
	if r.JSON == nil && r.Body == nil && r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
		r.JSON = struct{}{}
	}

	body := r.Body
	contentType := r.ContentType
	if r.JSON != nil {
		encoded, err := json.Marshal(r.JSON)
		if err != nil {
			return nil, fmt.Errorf("encode request: %w", err)
		}
		body = bytes.NewReader(encoded)
		contentType = "application/json"
	}

	req, err := http.NewRequestWithContext(ctx, r.Method, target, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	if r.ContentLength > 0 {
		req.ContentLength = r.ContentLength
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("Accept", "application/json")
	// The API checks the Origin of cookie-based requests, and it builds
	// request links from it.
	req.Header.Set("Origin", c.BaseURL)
	if c.UserAgent != "" {
		req.Header.Set("User-Agent", c.UserAgent)
	}
	if !r.NoAuth {
		if c.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+c.APIKey)
		}
		if c.Cookie != "" {
			req.Header.Set("Cookie", c.Cookie)
		}
	}
	for name, value := range r.Headers {
		req.Header.Set(name, value)
	}

	resp, err := c.httpClient().Do(req)
	if err != nil {
		return nil, fmt.Errorf("connect to %s: %w", c.BaseURL, err)
	}
	if !r.NoAuth && c.Cookie != "" {
		c.updateCookie(resp.Cookies())
	}
	return &Response{Status: resp.StatusCode, Headers: resp.Header, Body: resp.Body}, nil
}

// Do sends the request, fails for a status outside 2xx, and decodes a JSON
// response into out when out is not nil.
func (c *Client) Do(ctx context.Context, r Request, out any) error {
	resp, err := c.Raw(ctx, r)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	if resp.Status < 200 || resp.Status > 299 {
		return &Error{Status: resp.Status, Message: errorMessage(data)}
	}

	if out != nil && len(bytes.TrimSpace(data)) > 0 {
		if err := json.Unmarshal(data, out); err != nil {
			return fmt.Errorf("decode response: %w", err)
		}
	}
	return nil
}

// Get is a shortcut for a GET request.
func (c *Client) Get(ctx context.Context, path string, query url.Values, out any) error {
	return c.Do(ctx, Request{Method: http.MethodGet, Path: path, Query: query}, out)
}

// Send is a shortcut for a request with a JSON body.
func (c *Client) Send(ctx context.Context, method, path string, body, out any) error {
	return c.Do(ctx, Request{Method: method, Path: path, JSON: body}, out)
}

// errorMessage reads the error text of an API error body. The API returns
// {"error": "..."} or a Zod error object.
func errorMessage(data []byte) string {
	var payload struct {
		Error   json.RawMessage `json:"error"`
		Message string          `json:"message"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return strings.TrimSpace(string(data))
	}

	var text string
	if err := json.Unmarshal(payload.Error, &text); err == nil && text != "" {
		return text
	}

	var zod struct {
		Name    string `json:"name"`
		Message string `json:"message"`
		Issues  []struct {
			Message string   `json:"message"`
			Path    []string `json:"path"`
		} `json:"issues"`
	}
	if err := json.Unmarshal(payload.Error, &zod); err == nil {
		if len(zod.Issues) > 0 {
			parts := make([]string, 0, len(zod.Issues))
			for _, issue := range zod.Issues {
				parts = append(parts, issue.Message)
			}
			return strings.Join(parts, "; ")
		}
		// Zod 4 serializes the issues as a JSON string in the message.
		var issues []struct {
			Message string `json:"message"`
		}
		if json.Unmarshal([]byte(zod.Message), &issues) == nil && len(issues) > 0 {
			parts := make([]string, 0, len(issues))
			for _, issue := range issues {
				parts = append(parts, issue.Message)
			}
			return strings.Join(parts, "; ")
		}
		if zod.Message != "" {
			return zod.Message
		}
	}

	if payload.Message != "" {
		return payload.Message
	}
	return strings.TrimSpace(string(data))
}

// updateCookie applies Set-Cookie headers to the session cookie. Better Auth
// replaces the session when 2FA or the password changes.
func (c *Client) updateCookie(set []*http.Cookie) {
	if len(set) == 0 {
		return
	}
	names := []string{}
	values := map[string]string{}
	for _, part := range strings.Split(c.Cookie, ";") {
		name, value, found := strings.Cut(strings.TrimSpace(part), "=")
		if !found || name == "" {
			continue
		}
		if _, seen := values[name]; !seen {
			names = append(names, name)
		}
		values[name] = value
	}
	for _, cookie := range set {
		if _, seen := values[cookie.Name]; !seen {
			names = append(names, cookie.Name)
		}
		values[cookie.Name] = cookie.Value
		if cookie.MaxAge < 0 || cookie.Value == "" {
			delete(values, cookie.Name)
		}
	}
	parts := []string{}
	for _, name := range names {
		if value, ok := values[name]; ok {
			parts = append(parts, name+"="+value)
		}
	}
	updated := strings.Join(parts, "; ")
	if updated == c.Cookie {
		return
	}
	c.Cookie = updated
	if c.OnCookie != nil {
		c.OnCookie(updated)
	}
}
