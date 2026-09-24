package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/prompt"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func TestFlagParsing(t *testing.T) {
	fs := newFlagSet("x", "x")
	title := fs.String("title", "t", "", "", "")
	views := fs.Int("views", "v", 1, "", "")
	burn := fs.Bool("no-burnable", "", "")
	files := fs.List("file", "f", "", "")
	err := fs.Parse([]string{"secret text", "-t", "Title", "--views=5", "--no-burnable", "-f", "a", "--file", "b", "--", "--literal"})
	if err != nil {
		t.Fatal(err)
	}
	if *title != "Title" || *views != 5 || !*burn || strings.Join(*files, ",") != "a,b" {
		t.Fatalf("parsed %q %d %v %v", *title, *views, *burn, *files)
	}
	if strings.Join(fs.Args(), "|") != "secret text|--literal" {
		t.Fatalf("args %v", fs.Args())
	}
	if !fs.Changed("views") || fs.Changed("title") == false || fs.Changed("help") {
		t.Fatal("Changed is wrong")
	}
}

func TestFlagErrors(t *testing.T) {
	for _, args := range [][]string{{"--nope"}, {"--views", "many"}, {"--title"}, {"--no-burnable=maybe"}} {
		fs := newFlagSet("x", "x")
		fs.String("title", "t", "", "", "")
		fs.Int("views", "v", 1, "", "")
		fs.Bool("no-burnable", "", "")
		err := fs.Parse(args)
		if err == nil || !isUsageError(err) {
			t.Fatalf("%v: expected a usage error, got %v", args, err)
		}
	}
}

func TestSplitLeadingGlobals(t *testing.T) {
	globals, rest := splitLeadingGlobals([]string{"--json", "--url", "https://h.example", "--api-key=hemmelig_x", "secrets", "list"})
	if strings.Join(globals, " ") != "--json --url https://h.example --api-key=hemmelig_x" || strings.Join(rest, " ") != "secrets list" {
		t.Fatalf("globals %v rest %v", globals, rest)
	}
	globals, rest = splitLeadingGlobals([]string{"-t", "title", "text"})
	if len(globals) != 0 || len(rest) != 3 {
		t.Fatalf("legacy flags must stay: %v %v", globals, rest)
	}
}

func TestParseDuration(t *testing.T) {
	cases := map[string]int{"30s": 30, "5m": 300, "12h": 43200, "7d": 604800}
	for input, want := range cases {
		if got, err := parseDuration(input); err != nil || got != want {
			t.Fatalf("%s = %d %v", input, got, err)
		}
	}
	for _, bad := range []string{"", "d", "7w", "-1d", "1.5h"} {
		if _, err := parseDuration(bad); err == nil {
			t.Fatalf("%q must fail", bad)
		}
	}
}

func TestExitCodes(t *testing.T) {
	a := testApp(t, nil)
	cases := []struct {
		err  error
		want int
	}{
		{nil, exitOK},
		{errors.New("boom"), exitError},
		{usagef("bad"), exitUsage},
		{&api.Error{Status: 401}, exitAuth},
		{&api.Error{Status: 403}, exitAuth},
		{fmt.Errorf("wrapped: %w", service.ErrSessionRequired), exitAuth},
		{errors.Join(service.ErrAdminRequired, &api.Error{Status: 403}), exitAuth},
		{&api.Error{Status: 404}, exitNotFound},
		{fmt.Errorf("gone: %w", &api.Error{Status: 410}), exitNotFound},
	}
	for _, c := range cases {
		if got := a.exitCode(c.err); got != c.want {
			t.Fatalf("exitCode(%v) = %d, want %d", c.err, got, c.want)
		}
	}
}

// testApp returns an app with captured output and an isolated config dir.
func testApp(t *testing.T, env map[string]string) *app {
	t.Helper()
	t.Setenv("HEMMELIG_CONFIG_DIR", t.TempDir())
	stdin, err := os.Open(os.DevNull)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { stdin.Close() })
	return &app{
		ctx:    context.Background(),
		stdout: &bytes.Buffer{},
		stderr: &bytes.Buffer{},
		prompt: prompt.New(stdin, io.Discard),
		getenv: func(key string) string { return env[key] },
	}
}

func output(a *app) string { return a.stdout.(*bytes.Buffer).String() }

func TestLegacyFormCreatesSecret(t *testing.T) {
	var got map[string]json.RawMessage
	var auth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &got)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"id":"0b6c1c9e-4f3a-4c4e-9d8e-2b1f3a4c5d6e"}`))
	}))
	defer server.Close()

	a := testApp(t, map[string]string{"HEMMELIG_API_KEY": "hemmelig_env"})
	code := a.run([]string{"my secret", "-t", "Title", "-e", "7d", "-v", "3", "-u", server.URL})
	if code != exitOK {
		t.Fatalf("exit %d: %s", code, a.stderr.(*bytes.Buffer).String())
	}
	if !strings.HasPrefix(output(a), server.URL+"/s/0b6c1c9e-4f3a-4c4e-9d8e-2b1f3a4c5d6e#") {
		t.Fatalf("output %q", output(a))
	}
	if string(got["expiresAt"]) != "604800" || string(got["views"]) != "3" || string(got["isBurnable"]) != "true" {
		t.Fatalf("payload %s %s %s", got["expiresAt"], got["views"], got["isBurnable"])
	}
	if auth != "Bearer hemmelig_env" {
		t.Fatalf("the key from HEMMELIG_API_KEY was not sent: %q", auth)
	}
}

func TestUsageErrors(t *testing.T) {
	a := testApp(t, nil)
	if code := a.run([]string{"secrets", "create", "x", "--expires", "2y"}); code != exitUsage {
		t.Fatalf("bad expiration: exit %d", code)
	}
	if code := a.run([]string{"admin"}); code != exitUsage {
		t.Fatalf("missing subcommand: exit %d", code)
	}
	if code := a.run([]string{"admin", "users", "nope"}); code != exitUsage {
		t.Fatalf("unknown subcommand: exit %d", code)
	}
	if code := a.run([]string{"account", "delete"}); code != exitAuth {
		t.Fatalf("delete without a session: exit %d", code)
	}
}

func TestHelpForEveryCommand(t *testing.T) {
	commands := [][]string{
		{"secrets", "create"}, {"secrets", "get"}, {"secrets", "list"}, {"secrets", "delete"},
		{"requests", "create"}, {"requests", "list"}, {"requests", "show"}, {"requests", "cancel"}, {"requests", "open"}, {"requests", "submit"},
		{"account", "show"}, {"account", "update"}, {"account", "password"}, {"account", "delete"},
		{"account", "2fa", "status"}, {"account", "2fa", "enable"}, {"account", "2fa", "verify"}, {"account", "2fa", "disable"},
		{"account", "api-keys", "list"}, {"account", "api-keys", "create"}, {"account", "api-keys", "revoke"},
		{"admin", "users", "list"}, {"admin", "users", "create"}, {"admin", "users", "update"}, {"admin", "users", "ban"},
		{"admin", "users", "unban"}, {"admin", "users", "set-password"}, {"admin", "users", "delete"},
		{"admin", "invites", "list"}, {"admin", "invites", "create"}, {"admin", "invites", "deactivate"},
		{"admin", "instance", "get"}, {"admin", "instance", "set"}, {"admin", "analytics", "show"},
		{"config", "set"}, {"config", "get"}, {"config", "unset"}, {"config", "path"},
		{"login"}, {"logout"}, {"whoami"}, {"mcp"}, {"health"}, {"version"},
	}
	for _, command := range commands {
		a := testApp(t, nil)
		if code := a.run(append(command, "--help")); code != exitOK {
			t.Fatalf("%v --help: exit %d", command, code)
		}
		if !strings.Contains(output(a), "Usage:") {
			t.Fatalf("%v --help has no usage: %q", command, output(a))
		}
	}
}

func TestStoredKeyStaysOnItsHost(t *testing.T) {
	a := testApp(t, nil)
	if code := a.run([]string{"config", "set", "url", "https://one.example"}); code != exitOK {
		t.Fatal("config set url failed")
	}
	if code := a.run([]string{"config", "set", "api-key", "hemmelig_stored"}); code != exitOK {
		t.Fatal("config set api-key failed")
	}
	s, err := a.settings()
	if err != nil || s.APIKey != "hemmelig_stored" {
		t.Fatalf("stored key not used: %+v %v", s, err)
	}
	other := "https://two.example"
	a.url = &other
	s, err = a.settings()
	if err != nil || s.APIKey != "" {
		t.Fatalf("the stored key must not go to another host: %+v", s)
	}
}
