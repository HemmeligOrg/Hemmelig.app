// Command mcpcheck starts `hemmelig mcp` as a subprocess and calls every
// tool against a real server. The e2e test runs it twice: with an admin key,
// and with the key of a normal user, where the admin tools must fail.
//
//	HEMMELIG_URL=http://localhost:5194 HEMMELIG_API_KEY=hemmelig_... go run ./e2e/mcpcheck ./hemmelig admin
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "FAIL: mcp "+format+"\n", args...)
	os.Exit(1)
}

type caller struct {
	ctx     context.Context
	session *mcp.ClientSession
}

// call runs a tool and returns its structured result. wantError inverts the check.
func (c caller) call(name string, args map[string]any, wantError bool) map[string]any {
	result, err := c.session.CallTool(c.ctx, &mcp.CallToolParams{Name: name, Arguments: args})
	if err != nil {
		fail("%s: %v", name, err)
	}
	text := ""
	if len(result.Content) > 0 {
		if content, ok := result.Content[0].(*mcp.TextContent); ok {
			text = content.Text
		}
	}
	if result.IsError != wantError {
		fail("%s: isError=%v, want %v: %s", name, result.IsError, wantError, text)
	}
	if wantError {
		fmt.Printf("PASS: mcp %s fails as expected: %s\n", name, text)
		return map[string]any{"error": text}
	}
	data, _ := json.Marshal(result.StructuredContent)
	out := map[string]any{}
	_ = json.Unmarshal(data, &out)
	fmt.Printf("PASS: mcp %s\n", name)
	return out
}

func main() {
	if len(os.Args) != 3 || (os.Args[2] != "admin" && os.Args[2] != "user") {
		fmt.Fprintln(os.Stderr, "usage: mcpcheck <hemmelig binary> admin|user")
		os.Exit(2)
	}
	admin := os.Args[2] == "admin"
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	cmd := exec.Command(os.Args[1], "mcp")
	cmd.Stderr = os.Stderr
	client := mcp.NewClient(&mcp.Implementation{Name: "hemmelig-e2e", Version: "1"}, nil)
	session, err := client.Connect(ctx, &mcp.CommandTransport{Command: cmd}, nil)
	if err != nil {
		fail("connect: %v", err)
	}
	defer session.Close()
	c := caller{ctx: ctx, session: session}

	tools, err := session.ListTools(ctx, nil)
	if err != nil {
		fail("list tools: %v", err)
	}
	if len(tools.Tools) != 12 {
		fail("got %d tools, want 12", len(tools.Tools))
	}
	fmt.Println("PASS: mcp tools/list returns 12 tools")

	created := c.call("create_secret", map[string]any{"text": "mcp e2e secret", "title": "mcp title", "expires": "1h", "views": 2}, false)
	link, _ := created["link"].(string)
	if !strings.Contains(link, "/s/") || !strings.Contains(link, "#") {
		fail("create_secret link %q", link)
	}
	read := c.call("read_secret", map[string]any{"link": link}, false)
	if read["content"] != "mcp e2e secret" || read["title"] != "mcp title" {
		fail("read_secret returned %v", read)
	}
	if !strings.Contains(fmt.Sprint(read["notice"]), "untrusted") {
		fail("read_secret has no untrusted notice")
	}
	c.call("read_secret", map[string]any{"link": link, "key": "wrongkeywrongkeywrongkeywrongkey"}, true)
	list := c.call("list_secrets", map[string]any{"limit": 5}, false)
	if data, ok := list["data"].([]any); !ok || len(data) == 0 {
		fail("list_secrets returned no secrets")
	}
	c.call("delete_secret", map[string]any{"secret": created["id"]}, false)

	request := c.call("create_request", map[string]any{"title": "mcp e2e request", "valid_for": "1d"}, false)
	if !strings.Contains(fmt.Sprint(request["link"]), "/request/") {
		fail("create_request link %v", request["link"])
	}
	c.call("list_requests", map[string]any{"status": "pending"}, false)
	c.call("cancel_request", map[string]any{"id": request["id"]}, false)

	admins := []string{"list_users", "list_invites", "create_invite", "get_instance_settings", "get_analytics"}
	for _, name := range admins {
		args := map[string]any{}
		switch name {
		case "create_invite":
			args = map[string]any{"max_uses": 1, "expires_in_days": 1}
		case "get_instance_settings":
			args = map[string]any{"section": "webhook"}
		case "get_analytics":
			args = map[string]any{"range": "7d"}
		}
		out := c.call(name, args, !admin)
		if !admin && !strings.Contains(fmt.Sprint(out["error"]), "admin API key") {
			fail("%s: the error does not name the admin key: %v", name, out["error"])
		}
		if admin && name == "get_instance_settings" {
			settings, _ := out["settings"].(map[string]any)
			if secret, ok := settings["webhookSecret"].(string); ok && secret != "" && secret != "(set)" {
				fail("get_instance_settings shows the webhook secret")
			}
		}
	}
}
