package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/config"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
	"github.com/HemmeligOrg/hemmelig-cli/internal/prompt"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

const defaultURL = "https://hemmelig.app"

// Exit codes. The docs list them in docs/cli.md.
const (
	exitOK       = 0
	exitError    = 1
	exitUsage    = 2
	exitAuth     = 3
	exitNotFound = 4
)

// app holds the state of one CLI run.
type app struct {
	ctx    context.Context
	stdout io.Writer
	stderr io.Writer
	prompt *prompt.Prompter
	getenv func(string) string

	// Global flags.
	url    *string
	apiKey *string
	json   *bool
}

// globalFlags adds the flags that every command accepts.
func (a *app) globalFlags(fs *flagSet) {
	a.url = fs.String("url", "u", "", "url", "Hemmelig instance URL (env HEMMELIG_URL)")
	a.apiKey = fs.String("api-key", "", "", "key", "API key (env HEMMELIG_API_KEY)")
	a.json = fs.Bool("json", "", "Print the result as JSON")
}

// parse parses the flags of a command. It returns done=true when the command
// must stop, for example after --help.
func (a *app) parse(fs *flagSet, args []string) (bool, error) {
	a.globalFlags(fs)
	if err := fs.Parse(args); err != nil {
		return true, err
	}
	if fs.help {
		fmt.Fprint(a.stdout, fs.Help())
		return true, nil
	}
	return false, nil
}

func (a *app) jsonMode() bool { return a.json != nil && *a.json }

// settings are the resolved URL and credentials.
type settings struct {
	URL string
	// APIKey is the key to send, or empty.
	APIKey string
	// APIKeySource names where the key came from.
	APIKeySource string
	// Explicit is true when the key came from a flag or the environment.
	Explicit bool
	Session  *config.Session
	Config   *config.Config
}

func (a *app) settings() (*settings, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}
	s := &settings{Config: cfg}

	raw := defaultURL
	switch {
	case a.url != nil && *a.url != "":
		raw = *a.url
	case a.getenv("HEMMELIG_URL") != "":
		raw = a.getenv("HEMMELIG_URL")
	case cfg.URL != "":
		raw = cfg.URL
	}
	s.URL, err = links.NormalizeBaseURL(raw)
	if err != nil {
		return nil, usageError{err}
	}

	switch {
	case a.apiKey != nil && *a.apiKey != "":
		s.APIKey, s.APIKeySource, s.Explicit = *a.apiKey, "--api-key flag", true
	case a.getenv("HEMMELIG_API_KEY") != "":
		s.APIKey, s.APIKeySource, s.Explicit = a.getenv("HEMMELIG_API_KEY"), "HEMMELIG_API_KEY", true
	case cfg.APIKey != "" && (cfg.URL == "" || sameURL(cfg.URL, s.URL)):
		// The stored key belongs to the stored URL. It never goes to another host.
		s.APIKey, s.APIKeySource = cfg.APIKey, "config file"
	}

	if cfg.Session != nil && sameURL(cfg.Session.URL, s.URL) {
		s.Session = cfg.Session
	}
	return s, nil
}

func sameURL(a, b string) bool {
	na, errA := links.NormalizeBaseURL(a)
	nb, errB := links.NormalizeBaseURL(b)
	return errA == nil && errB == nil && strings.EqualFold(na, nb)
}

func userAgent() string { return "hemmelig-cli/" + version }

// fileTokens stores delete tokens in the config directory.
type fileTokens struct{}

func (fileTokens) Save(baseURL, id, token string) error {
	return config.SaveDeleteToken(baseURL, id, token)
}
func (fileTokens) Get(baseURL, id string) string   { return config.DeleteToken(baseURL, id) }
func (fileTokens) Forget(baseURL, id string) error { return config.ForgetDeleteToken(baseURL, id) }

// service returns a service with one credential. A key from a flag or the
// environment wins. Otherwise the session from `hemmelig login` wins over a
// key in the config file.
func (a *app) service() (*service.Service, *settings, error) {
	s, err := a.settings()
	if err != nil {
		return nil, nil, err
	}
	client := &api.Client{BaseURL: s.URL, UserAgent: userAgent()}
	switch {
	case s.Explicit:
		client.APIKey = s.APIKey
	case s.Session != nil:
		a.bindSession(client, s)
	default:
		client.APIKey = s.APIKey
	}
	return &service.Service{API: client, Tokens: fileTokens{}}, s, nil
}

// sessionService returns a service that uses only the session. Credential
// changes need it.
func (a *app) sessionService() (*service.Service, *settings, error) {
	s, err := a.settings()
	if err != nil {
		return nil, nil, err
	}
	if s.Session == nil {
		return nil, nil, fmt.Errorf("%w (no session for %s)", service.ErrSessionRequired, s.URL)
	}
	client := &api.Client{BaseURL: s.URL, UserAgent: userAgent()}
	a.bindSession(client, s)
	return &service.Service{API: client, Tokens: fileTokens{}}, s, nil
}

// bindSession sends the stored session and stores the new cookie when the
// server replaces the session.
func (a *app) bindSession(client *api.Client, s *settings) {
	client.Cookie = s.Session.Cookie
	client.OnCookie = func(cookie string) {
		if cookie == "" {
			s.Config.Session = nil
		} else {
			s.Session.Cookie = cookie
		}
		if err := s.Config.Save(); err != nil {
			a.info("Could not store the new session: %v", err)
		}
	}
}

// printJSON writes a value as indented JSON.
func (a *app) printJSON(value any) error {
	encoder := json.NewEncoder(a.stdout)
	encoder.SetIndent("", "  ")
	encoder.SetEscapeHTML(false)
	return encoder.Encode(value)
}

// output prints JSON in --json mode, and calls text otherwise.
func (a *app) output(value any, text func()) error {
	if a.jsonMode() {
		return a.printJSON(value)
	}
	text()
	return nil
}

// table prints rows with aligned columns.
func (a *app) table(headers []string, rows [][]string) {
	w := tabwriter.NewWriter(a.stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, strings.Join(headers, "\t"))
	for _, row := range rows {
		fmt.Fprintln(w, strings.Join(row, "\t"))
	}
	_ = w.Flush()
}

// info writes a line to stderr, so that stdout stays clean for scripts.
func (a *app) info(format string, args ...any) {
	fmt.Fprintf(a.stderr, format+"\n", args...)
}

func (a *app) done(message string, value any) error {
	return a.output(value, func() { fmt.Fprintln(a.stdout, message) })
}

// exitCode prints the error and returns the exit code for it.
func (a *app) exitCode(err error) int {
	if err == nil {
		return exitOK
	}
	code := exitError
	status := api.StatusOf(err)
	switch {
	case isUsageError(err):
		code = exitUsage
	case status == http.StatusUnauthorized || status == http.StatusForbidden,
		errors.Is(err, service.ErrSessionRequired), errors.Is(err, service.ErrAdminRequired):
		code = exitAuth
	case status == http.StatusNotFound || status == http.StatusGone:
		code = exitNotFound
	}

	message := strings.ReplaceAll(err.Error(), "\n", ": ")
	if a.jsonMode() {
		encoder := json.NewEncoder(a.stderr)
		encoder.SetEscapeHTML(false)
		_ = encoder.Encode(map[string]any{"error": message, "status": status, "exitCode": code})
	} else {
		fmt.Fprintf(a.stderr, "Error: %s\n", message)
		if code == exitUsage {
			fmt.Fprintln(a.stderr, "Run hemmelig help for usage.")
		}
	}
	return code
}

// value returns the text of a pointer, or "-" for nil.
func value[T any](v *T) string {
	if v == nil {
		return "-"
	}
	text := fmt.Sprint(*v)
	if text == "" {
		return "-"
	}
	return text
}

// shortTime cuts an ISO 8601 time to minutes.
func shortTime(value string) string {
	if len(value) >= 16 {
		return strings.Replace(value[:16], "T", " ", 1)
	}
	if value == "" {
		return "-"
	}
	return value
}

// readInput returns the argument, or stdin when the argument is "-" or
// missing and stdin is not a terminal.
func (a *app) readInput(args []string) (string, bool, error) {
	if len(args) > 0 && args[0] != "-" {
		return args[0], true, nil
	}
	if a.prompt.Terminal() && (len(args) == 0 || args[0] != "-") {
		return "", false, nil
	}
	data, err := io.ReadAll(a.prompt.Reader())
	if err != nil {
		return "", false, fmt.Errorf("read stdin: %w", err)
	}
	text := strings.TrimRight(string(data), "\r\n")
	return text, text != "", nil
}

// secretAnswer returns a flag value, or asks for it without echo.
func (a *app) secretAnswer(flagValue, label string) (string, error) {
	if flagValue != "" {
		return flagValue, nil
	}
	answer, err := a.prompt.Secret(label)
	if err != nil {
		return "", err
	}
	return answer, nil
}

// confirm asks the user to type a word. --yes skips the question.
func (a *app) confirm(yes bool, word, question string) error {
	if yes {
		return nil
	}
	if !a.prompt.Terminal() {
		return usagef("this action cannot be undone: add --yes to confirm it")
	}
	answer, err := a.prompt.Line(fmt.Sprintf("%s Type %q to confirm: ", question, word))
	if err != nil {
		return err
	}
	if strings.TrimSpace(answer) != word {
		return errors.New("not confirmed")
	}
	return nil
}

func writeFileNew(path string, data []byte, overwrite bool) error {
	flags := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	if !overwrite {
		flags |= os.O_EXCL
	}
	file, err := os.OpenFile(path, flags, 0o600)
	if err != nil {
		if errors.Is(err, os.ErrExist) {
			return fmt.Errorf("%s exists: use --force to overwrite it or --output-dir for another folder", path)
		}
		return err
	}
	if _, err := file.Write(data); err != nil {
		file.Close()
		return err
	}
	return file.Close()
}
