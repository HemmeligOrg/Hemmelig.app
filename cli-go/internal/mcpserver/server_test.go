package mcpserver

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

const secretID = "0b6c1c9e-4f3a-4c4e-9d8e-2b1f3a4c5d6e"

// connect starts the server on an in-memory transport and returns a client
// session. The fake API accepts secret creation and rejects admin routes
// with 403, as the API does for a key of a normal user.
func connect(t *testing.T) (*mcp.ClientSession, *[]string) {
	t.Helper()
	bodies := []string{}
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		bodies = append(bodies, string(body))
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.Header.Get("Authorization") != "Bearer hemmelig_test":
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"Unauthorized"}`))
		case r.Method == http.MethodPost && r.URL.Path == "/api/secrets":
			w.WriteHeader(http.StatusCreated)
			_, _ = w.Write([]byte(`{"id":"` + secretID + `","deleteToken":"t"}`))
		default:
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"error":"Forbidden"}`))
		}
	}))
	t.Cleanup(fake.Close)

	svc := &service.Service{API: newClient(fake.URL)}
	server := New(svc, "test")
	serverTransport, clientTransport := mcp.NewInMemoryTransports()
	ctx := context.Background()
	if _, err := server.Connect(ctx, serverTransport, nil); err != nil {
		t.Fatal(err)
	}
	session, err := mcp.NewClient(&mcp.Implementation{Name: "test", Version: "1"}, nil).Connect(ctx, clientTransport, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = session.Close() })
	return session, &bodies
}

func newClient(baseURL string) *api.Client {
	return &api.Client{BaseURL: baseURL, APIKey: "hemmelig_test"}
}

func TestToolsAreRegistered(t *testing.T) {
	session, _ := connect(t)
	result, err := session.ListTools(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	names := map[string]*mcp.Tool{}
	for _, tool := range result.Tools {
		names[tool.Name] = tool
	}
	if len(result.Tools) != len(ToolNames) {
		t.Fatalf("got %d tools, want %d", len(result.Tools), len(ToolNames))
	}
	for _, name := range ToolNames {
		if names[name] == nil {
			t.Fatalf("tool %s is missing", name)
		}
	}
	for _, forbidden := range []string{"password", "api_key", "login", "2fa", "ban", "delete_user"} {
		for name := range names {
			if strings.Contains(name, forbidden) {
				t.Fatalf("tool %s must not exist: the MCP server has no credential or user tools", name)
			}
		}
	}
	if !strings.Contains(names["read_secret"].Description, "untrusted") ||
		!strings.Contains(names["read_secret"].Description, "prompt injection") {
		t.Fatal("read_secret must mark its output as untrusted")
	}
	if names["list_secrets"].Annotations == nil || !names["list_secrets"].Annotations.ReadOnlyHint {
		t.Fatal("list_secrets must be read-only")
	}
}

func TestCreateSecretEncryptsLocally(t *testing.T) {
	session, bodies := connect(t)
	result, err := session.CallTool(context.Background(), &mcp.CallToolParams{
		Name:      "create_secret",
		Arguments: map[string]any{"text": "plaintext for mcp", "expires": "1h"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.IsError {
		t.Fatalf("tool error: %+v", result.Content)
	}
	data, _ := json.Marshal(result.StructuredContent)
	var out service.CreateSecretResult
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.Link, "/s/"+secretID+"#") {
		t.Fatalf("unexpected link %q", out.Link)
	}
	for _, body := range *bodies {
		if strings.Contains(body, "plaintext for mcp") {
			t.Fatal("the plaintext reached the server")
		}
	}
}

func TestAdminToolWithUserKey(t *testing.T) {
	session, _ := connect(t)
	result, err := session.CallTool(context.Background(), &mcp.CallToolParams{Name: "list_users", Arguments: map[string]any{}})
	if err != nil {
		t.Fatal(err)
	}
	if !result.IsError {
		t.Fatal("list_users must fail for a key of a normal user")
	}
	text := result.Content[0].(*mcp.TextContent).Text
	if !strings.Contains(text, "admin API key") {
		t.Fatalf("the error must name the admin key: %q", text)
	}
}

func TestInvalidInput(t *testing.T) {
	session, _ := connect(t)
	result, err := session.CallTool(context.Background(), &mcp.CallToolParams{
		Name:      "create_secret",
		Arguments: map[string]any{"text": "x", "expires": "2y"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if !result.IsError {
		t.Fatal("an invalid expiration must fail")
	}
}
