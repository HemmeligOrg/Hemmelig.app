package service

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
)

const testID = "0b6c1c9e-4f3a-4c4e-9d8e-2b1f3a4c5d6e"

// fakeServer imitates the secret and file routes. It stores what it gets,
// so the tests can check that no plaintext reaches it.
type fakeServer struct {
	mu        sync.Mutex
	created   map[string]json.RawMessage
	fileBody  []byte
	fileName  string
	deleted   bool
	deleteHdr string
	authHdr   string
	bodies    []string
}

func newFake(t *testing.T) (*fakeServer, *Service) {
	t.Helper()
	fake := &fakeServer{}
	server := httptest.NewServer(http.HandlerFunc(fake.serve))
	t.Cleanup(server.Close)
	return fake, &Service{API: &api.Client{BaseURL: server.URL, APIKey: "hemmelig_test"}, Tokens: &memoryTokens{}}
}

func (f *fakeServer) serve(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	body, _ := io.ReadAll(r.Body)
	f.bodies = append(f.bodies, string(body))
	f.authHdr = r.Header.Get("Authorization")
	w.Header().Set("Content-Type", "application/json")

	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/api/files":
		f.fileBody = body
		f.fileName = r.Header.Get("X-Hemmelig-File-Name")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"file-1","token":"upload-token"}`))
	case r.Method == http.MethodPost && r.URL.Path == "/api/secrets":
		_ = json.Unmarshal(body, &f.created)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"` + testID + `","deleteToken":"creator-token"}`))
	case r.Method == http.MethodGet && r.URL.Path == "/api/secrets/"+testID+"/check":
		var salt string
		_ = json.Unmarshal(f.created["salt"], &salt)
		protected := f.created["passwordVerifier"] != nil
		scheme := "null"
		if protected {
			scheme = `"derived"`
		}
		_, _ = w.Write([]byte(`{"views":1,"isPasswordProtected":` + boolText(protected) + `,"passwordScheme":` + scheme + `,"salt":"` + salt + `"}`))
	case r.Method == http.MethodPost && r.URL.Path == "/api/secrets/"+testID:
		var sent map[string]string
		_ = json.Unmarshal(body, &sent)
		var verifier string
		_ = json.Unmarshal(f.created["passwordVerifier"], &verifier)
		if verifier != "" && sent["passwordVerifier"] != verifier {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"Invalid password"}`))
			return
		}
		title := f.created["title"]
		if title == nil {
			title = json.RawMessage(`{}`)
		}
		reveal := `{"id":"` + testID + `","secret":` + string(f.created["secret"]) + `,"title":` + string(title) +
			`,"salt":` + string(f.created["salt"]) + `,"views":0,"expiresAt":"2030-01-01T00:00:00.000Z","deleteToken":"reveal-token","files":[`
		if f.fileBody != nil {
			reveal += `{"id":"file-1","filename":"` + f.fileName + `","token":"download-token"}`
		}
		_, _ = w.Write([]byte(reveal + `]}`))
	case r.Method == http.MethodGet && r.URL.Path == "/api/files/file-1":
		if r.Header.Get("X-Hemmelig-File-Token") != "download-token" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/octet-stream")
		_, _ = w.Write(f.fileBody)
	case r.Method == http.MethodDelete && r.URL.Path == "/api/secrets/"+testID:
		f.deleted = true
		f.deleteHdr = r.Header.Get("X-Hemmelig-Delete-Token")
		_, _ = w.Write([]byte(`{"success":true}`))
	default:
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error":"not found"}`))
	}
}

func boolText(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

type memoryTokens struct{ tokens map[string]string }

func (m *memoryTokens) Save(base, id, token string) error {
	if m.tokens == nil {
		m.tokens = map[string]string{}
	}
	m.tokens[base+"|"+id] = token
	return nil
}
func (m *memoryTokens) Get(base, id string) string { return m.tokens[base+"|"+id] }
func (m *memoryTokens) Forget(base, id string) error {
	delete(m.tokens, base+"|"+id)
	return nil
}

func TestSecretRoundTrip(t *testing.T) {
	fake, svc := newFake(t)
	ctx := context.Background()

	created, err := svc.CreateSecret(ctx, CreateSecretInput{
		Text: "plaintext body", Title: "plaintext title", ExpiresIn: 3600, Views: 1, Burnable: true,
		Files: []FileInput{{Name: "notes.txt", Data: []byte("plaintext file")}},
	})
	if err != nil {
		t.Fatal(err)
	}
	link, err := links.ParseSecret(created.Link)
	if err != nil || link.Key == "" || link.ID != testID {
		t.Fatalf("link %q: %+v %v", created.Link, link, err)
	}
	if !strings.Contains(created.Link, "/s/"+testID+"#") {
		t.Fatalf("expected the short link form, got %s", created.Link)
	}
	for _, body := range fake.bodies {
		for _, plain := range []string{"plaintext", "notes.txt", link.Key} {
			if strings.Contains(body, plain) {
				t.Fatalf("the server got %q in a request body", plain)
			}
		}
	}
	if fake.authHdr != "Bearer hemmelig_test" {
		t.Fatalf("missing API key header: %q", fake.authHdr)
	}

	read, err := svc.ReadSecret(ctx, ReadSecretInput{Ref: created.Link})
	if err != nil {
		t.Fatal(err)
	}
	if read.Content != "plaintext body" || read.Title != "plaintext title" {
		t.Fatalf("read %+v", read)
	}
	if len(read.Files) != 1 || read.Files[0].Name != "notes.txt" || string(read.Files[0].Data) != "plaintext file" {
		t.Fatalf("files %+v", read.Files)
	}

	if err := svc.DeleteSecret(ctx, testID); err != nil {
		t.Fatal(err)
	}
	if !fake.deleted || fake.deleteHdr != "reveal-token" {
		t.Fatalf("delete used token %q", fake.deleteHdr)
	}
}

func TestPasswordSecret(t *testing.T) {
	fake, svc := newFake(t)
	ctx := context.Background()

	created, err := svc.CreateSecret(ctx, CreateSecretInput{Text: "hidden", ExpiresIn: 300, NoViewLimit: true, Password: "correct horse"})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(created.Link, "#") {
		t.Fatalf("a password link must not carry a key: %s", created.Link)
	}
	if string(fake.created["views"]) != "null" || string(fake.created["isBurnable"]) != "false" {
		t.Fatalf("burn after time must send views null: %s %s", fake.created["views"], fake.created["isBurnable"])
	}
	if fake.created["password"] != nil {
		t.Fatal("the raw password must not reach the server")
	}

	if _, err := svc.ReadSecret(ctx, ReadSecretInput{Ref: created.Link}); err != ErrPasswordRequired {
		t.Fatalf("expected ErrPasswordRequired, got %v", err)
	}
	if _, err := svc.ReadSecret(ctx, ReadSecretInput{Ref: created.Link, Password: "wrong password"}); err == nil {
		t.Fatal("a wrong password must fail")
	}
	read, err := svc.ReadSecret(ctx, ReadSecretInput{Ref: created.Link, Password: "correct horse"})
	if err != nil || read.Content != "hidden" {
		t.Fatalf("read %+v %v", read, err)
	}
}

func TestOtherHostGetsNoCredentials(t *testing.T) {
	_, svc := newFake(t)
	other := svc.clientFor("https://other.example")
	if other.APIKey != "" || other.Cookie != "" {
		t.Fatal("credentials must not go to another host")
	}
	if svc.clientFor(svc.API.BaseURL) != svc.API {
		t.Fatal("the configured host must use the configured client")
	}
}

func TestParseSettings(t *testing.T) {
	values, err := ParseSettings("security", []string{"allowFileUploads=false", "rateLimitRequests=50"})
	if err != nil {
		t.Fatal(err)
	}
	if values["allowFileUploads"] != false || values["rateLimitRequests"] != 50 {
		t.Fatalf("values %+v", values)
	}
	if _, err := ParseSettings("security", []string{"instanceName=x"}); err == nil {
		t.Fatal("a key from another section must fail")
	}
	if _, err := ParseSettings("general", []string{"allowRegistration=maybe"}); err == nil {
		t.Fatal("a bad boolean must fail")
	}
	if _, err := ParseSettings("nope", []string{"a=b"}); err == nil {
		t.Fatal("an unknown section must fail")
	}
}

func TestDurations(t *testing.T) {
	if seconds, err := ParseExpiration("1d"); err != nil || seconds != 86400 {
		t.Fatalf("1d = %d %v", seconds, err)
	}
	if _, err := ParseExpiration("2d"); err == nil || !strings.Contains(err.Error(), "5m, 30m, 1h") {
		t.Fatalf("expected the sorted choices, got %v", err)
	}
	if seconds, err := ParseValidity("30d"); err != nil || seconds != 2592000 {
		t.Fatalf("30d = %d %v", seconds, err)
	}
}

func TestRequestLinkRelative(t *testing.T) {
	token := strings.Repeat("a", 64)
	got := requestLink("https://h.example", "/request/"+testID+"#token="+token)
	if got != "https://h.example/request/"+testID+"#token="+token {
		t.Fatalf("relative link: %s", got)
	}
	got = requestLink("https://h.example", "http://internal:3000/request/"+testID+"#token="+token)
	if got != "https://h.example/request/"+testID+"#token="+token {
		t.Fatalf("absolute link: %s", got)
	}
}
