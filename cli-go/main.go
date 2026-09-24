// Command hemmelig is the Hemmelig command line client. It encrypts and
// decrypts secrets locally, manages accounts and instances through the API,
// and runs a local MCP server.
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/prompt"
)

const version = "1.1.0"

const banner = ` _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \ '_ ` + "`" + ` _ \| '_ ` + "`" + ` _ \ / _ \ | |/ _` + "`" + ` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\___|_| |_| |_|_| |_| |_|\___|_|_|\__, |
                                         |___/`

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	a := &app{
		ctx:    ctx,
		stdout: os.Stdout,
		stderr: os.Stderr,
		prompt: prompt.New(os.Stdin, os.Stderr),
		getenv: os.Getenv,
	}
	os.Exit(a.run(os.Args[1:]))
}

type subcommand struct {
	name    string
	summary string
	run     func(args []string) error
}

func (a *app) topCommands() []subcommand {
	return []subcommand{
		{"secrets", "Create, read, list and delete secrets", a.secretsCommand},
		{"requests", "Ask for secrets with request links, and fill them in", a.requestsCommand},
		{"account", "Your account, 2FA and API keys", a.accountCommand},
		{"admin", "Users, invites, instance settings and analytics (admins)", a.adminCommand},
		{"login", "Sign in and store a session", a.loginCommand},
		{"logout", "End the session", a.logoutCommand},
		{"whoami", "Show the URL, the credential and its user", a.whoamiCommand},
		{"config", "Store the URL and the API key", a.configCommand},
		{"mcp", "Run the local MCP server on stdio", a.mcpCommand},
		{"health", "Check that the instance is ready", a.healthCommand},
		{"version", "Print the CLI version", a.versionCommand},
		{"help", "Show help for a command", a.helpCommand},
	}
}

// globalWithValue lists the global flags that take a value.
var globalWithValue = map[string]bool{"--url": true, "-u": true, "--api-key": true}

// splitLeadingGlobals moves global flags in front of the command to the end,
// so `hemmelig --json secrets list` works like `hemmelig secrets list --json`.
func splitLeadingGlobals(args []string) (globals, rest []string) {
	i := 0
	for i < len(args) {
		name, _, hasValue := strings.Cut(args[i], "=")
		switch {
		case name == "--json":
			globals = append(globals, args[i])
		case globalWithValue[name]:
			globals = append(globals, args[i])
			if !hasValue && i+1 < len(args) {
				i++
				globals = append(globals, args[i])
			}
		default:
			return globals, args[i:]
		}
		i++
	}
	return globals, nil
}

func (a *app) run(args []string) int {
	globals, rest := splitLeadingGlobals(args)
	if len(rest) == 0 {
		if a.prompt.Terminal() {
			fmt.Fprint(a.stdout, a.usage())
			return exitOK
		}
		// Legacy form: echo "secret" | hemmelig
		return a.exitCode(a.secretsCreate(globals))
	}

	switch rest[0] {
	case "--version":
		return a.exitCode(a.versionCommand(nil))
	case "-h", "--help", "/?":
		fmt.Fprint(a.stdout, a.usage())
		return exitOK
	}
	for _, command := range a.topCommands() {
		if command.name == rest[0] {
			return a.exitCode(command.run(append(rest[1:], globals...)))
		}
	}
	// Legacy form: hemmelig "secret" [flags]. It stays for scripts that use
	// the first version of this CLI.
	return a.exitCode(a.secretsCreate(append(rest, globals...)))
}

func (a *app) usage() string {
	var b strings.Builder
	fmt.Fprintf(&b, "%s\nEncrypted, self-destructing secrets from the command line. Version %s.\n\n", banner, version)
	b.WriteString("Usage:\n  hemmelig <command> [subcommand] [flags]\n  hemmelig \"secret text\" [flags]      Short form of secrets create\n\nCommands:\n")
	for _, command := range a.topCommands() {
		fmt.Fprintf(&b, "  %-10s %s\n", command.name, command.summary)
	}
	b.WriteString(`
Global flags:
  -u, --url <url>      Hemmelig instance URL (env HEMMELIG_URL, default https://hemmelig.app)
      --api-key <key>  API key (env HEMMELIG_API_KEY)
      --json           Print the result as JSON
  -h, --help           Show help

Examples:
  hemmelig "db password: hunter2" -e 1h
  hemmelig secrets get "https://hemmelig.app/s/<id>#<key>"
  hemmelig login --url https://secrets.example.com
  hemmelig admin users list --json

Run hemmelig <command> --help for the flags of a command. Full guide: docs/cli.md.
`)
	return b.String()
}

// group runs a subcommand of a command group.
func (a *app) group(name, summary string, args []string, commands []subcommand) error {
	help := func() string {
		var b strings.Builder
		fmt.Fprintf(&b, "%s\n\nUsage:\n  hemmelig %s <subcommand> [flags]\n\nSubcommands:\n", summary, name)
		for _, command := range commands {
			fmt.Fprintf(&b, "  %-13s %s\n", command.name, command.summary)
		}
		fmt.Fprintf(&b, "\nRun hemmelig %s <subcommand> --help for the flags.\n", name)
		return b.String()
	}
	globals, rest := splitLeadingGlobals(args)
	if len(rest) == 0 || rest[0] == "-h" || rest[0] == "--help" || rest[0] == "help" {
		if len(rest) == 0 {
			fmt.Fprint(a.stderr, help())
			return usagef("hemmelig %s needs a subcommand", name)
		}
		fmt.Fprint(a.stdout, help())
		return nil
	}
	for _, command := range commands {
		if command.name == rest[0] {
			return command.run(append(rest[1:], globals...))
		}
	}
	return usagef("unknown subcommand %q for hemmelig %s", rest[0], name)
}

func (a *app) helpCommand(args []string) error {
	if len(args) == 0 {
		fmt.Fprint(a.stdout, a.usage())
		return nil
	}
	for _, command := range a.topCommands() {
		if command.name == args[0] && command.name != "help" {
			return command.run(append(args[1:], "--help"))
		}
	}
	return usagef("unknown command %q", args[0])
}

func (a *app) versionCommand(args []string) error {
	fs := newFlagSet("hemmelig version", "Print the CLI version.", `hemmelig version`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	return a.output(map[string]string{"version": version}, func() { fmt.Fprintln(a.stdout, version) })
}

func (a *app) healthCommand(args []string) error {
	fs := newFlagSet("hemmelig health", "Check that the instance is ready. The command exits with 1 when the instance is unhealthy.",
		`hemmelig health --url https://secrets.example.com`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, s, err := a.service()
	if err != nil {
		return err
	}
	health, err := svc.GetHealth(a.ctx)
	if health == nil {
		return err
	}
	outErr := a.output(health, func() { fmt.Fprintf(a.stdout, "%s: %s\n", s.URL, health.Status) })
	if err != nil {
		return err
	}
	return outErr
}
