package main

import (
	"errors"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
	"github.com/HemmeligOrg/hemmelig-cli/internal/mcpserver"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func (a *app) mcpCommand(args []string) error {
	fs := newFlagSet("hemmelig mcp",
		"Run a local MCP server on stdio. It reads HEMMELIG_API_KEY and HEMMELIG_URL from the environment only. It does not use the config file or a session. See docs/mcp.md.",
		`HEMMELIG_URL=https://secrets.example.com HEMMELIG_API_KEY=hemmelig_... hemmelig mcp`)
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.help {
		_, err := a.stdout.Write([]byte(fs.Help()))
		return err
	}

	key := strings.TrimSpace(a.getenv("HEMMELIG_API_KEY"))
	if key == "" {
		return errors.New("set HEMMELIG_API_KEY to an API key: create one with hemmelig account api-keys create")
	}
	raw := a.getenv("HEMMELIG_URL")
	if raw == "" {
		raw = defaultURL
	}
	baseURL, err := links.NormalizeBaseURL(raw)
	if err != nil {
		return usageError{err}
	}

	svc := &service.Service{
		API:    &api.Client{BaseURL: baseURL, APIKey: key, UserAgent: userAgent() + " mcp"},
		Tokens: fileTokens{},
	}
	a.info("%s", mcpserver.Describe(baseURL))
	return mcpserver.New(svc, version).Run(a.ctx, &mcp.StdioTransport{})
}
