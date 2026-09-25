// Package links builds and parses Hemmelig secret links and request links.
package links

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// ErrInvalidLink means that the value is not a Hemmelig link or ID.
var ErrInvalidLink = errors.New("not a Hemmelig link or secret ID")

// Secret is a parsed secret link.
type Secret struct {
	// BaseURL is the scheme and host of the link, or empty for a bare ID.
	BaseURL string
	ID      string
	// Key is empty for password-protected secrets and for bare IDs.
	Key string
}

// Request is a parsed secret request link.
type Request struct {
	BaseURL string
	ID      string
	Token   string
}

// NormalizeBaseURL removes a trailing slash and checks the scheme.
func NormalizeBaseURL(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	parsed, err := url.Parse(raw)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		return "", fmt.Errorf("invalid URL %q: use http:// or https:// with a host", raw)
	}
	return strings.TrimRight(parsed.Scheme+"://"+parsed.Host+parsed.Path, "/"), nil
}

// IsID reports whether value has the form of a secret or request ID.
func IsID(value string) bool { return uuidPattern.MatchString(value) }

// SecretLink returns the short link /s/<id>#<key>. Without a key, the link
// has no fragment, which is the form for password-protected secrets.
func SecretLink(baseURL, id, key string) string {
	link := strings.TrimRight(baseURL, "/") + "/s/" + id
	if key != "" {
		link += "#" + key
	}
	return link
}

// RequestLink returns the link that the person who fulfils a request opens.
func RequestLink(baseURL, id, token string) string {
	return strings.TrimRight(baseURL, "/") + "/request/" + id + "#token=" + token
}

// ParseSecret accepts these forms:
//
//	https://host/s/<id>#<key>
//	https://host/secret/<id>#decryptionKey=<key>
//	https://host/s/<id> or https://host/secret/<id> (no key)
//	<id>
func ParseSecret(value string) (Secret, error) {
	value = strings.TrimSpace(value)
	if IsID(value) {
		return Secret{ID: value}, nil
	}

	parsed, err := url.Parse(value)
	if err != nil || parsed.Host == "" {
		return Secret{}, ErrInvalidLink
	}

	segments := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(segments) < 2 {
		return Secret{}, ErrInvalidLink
	}
	route, id := segments[len(segments)-2], segments[len(segments)-1]
	if (route != "s" && route != "secret") || !IsID(id) {
		return Secret{}, ErrInvalidLink
	}

	prefix := strings.Join(segments[:len(segments)-2], "/")
	base := parsed.Scheme + "://" + parsed.Host
	if prefix != "" {
		base += "/" + prefix
	}

	key := parsed.Fragment
	if strings.HasPrefix(key, "decryptionKey=") {
		key = strings.TrimPrefix(key, "decryptionKey=")
	}
	return Secret{BaseURL: base, ID: id, Key: key}, nil
}

// ParseRequest accepts https://host/request/<id>#token=<token> and the legacy
// form with ?token=<token>.
func ParseRequest(value string) (Request, error) {
	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil || parsed.Host == "" {
		return Request{}, errors.New("not a Hemmelig request link")
	}

	segments := strings.Split(strings.Trim(parsed.Path, "/"), "/")
	if len(segments) < 2 || segments[len(segments)-2] != "request" || !IsID(segments[len(segments)-1]) {
		return Request{}, errors.New("not a Hemmelig request link")
	}

	token := strings.TrimPrefix(parsed.Fragment, "token=")
	if token == "" {
		token = parsed.Query().Get("token")
	}
	if token == "" {
		return Request{}, errors.New("the request link has no token")
	}

	prefix := strings.Join(segments[:len(segments)-2], "/")
	base := parsed.Scheme + "://" + parsed.Host
	if prefix != "" {
		base += "/" + prefix
	}
	return Request{BaseURL: base, ID: segments[len(segments)-1], Token: token}, nil
}
