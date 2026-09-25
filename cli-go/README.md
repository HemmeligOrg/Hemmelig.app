# Hemmelig CLI (Go)

The `hemmelig` binary gives you the full Hemmelig app in the terminal and a local MCP server for AI assistants. It encrypts and decrypts on your machine, so the server gets only ciphertext.

- [CLI documentation](../docs/cli.md): install, authentication, every command, JSON output and exit codes.
- [MCP server](../docs/mcp.md): setup for Claude Desktop and Claude Code, the tools and the security model.

## Build

Use Go 1.25 or later:

```bash
go build -o hemmelig .
./hemmelig --help
```

## Test

To run the unit tests, run this command. The tests include crypto vectors from the web code, argument parsing and the MCP tools on an in-memory transport:

```bash
go test ./...
```

To make new crypto vectors from `src/lib/crypto.ts`, run this command from the repository root:

```bash
npx tsx cli-go/testdata/crypto-vectors.mts generate > cli-go/testdata/vectors.json
```

To check that the web code decrypts data from the Go code, run these commands from the repository root:

```bash
(cd cli-go && HEMMELIG_WRITE_GO_VECTORS=$PWD/go-vectors.json go test ./internal/hcrypto -run TestWriteGoVectors)
npx tsx cli-go/testdata/crypto-vectors.mts verify cli-go/go-vectors.json
rm cli-go/go-vectors.json
```

The end-to-end test runs every command and the MCP server against a real server. The top of `e2e/run.sh` shows how to start a test server:

```bash
HEMMELIG_E2E_URL=http://localhost:5194 ./e2e/run.sh
```

## Layout

| Path                 | Content                                                   |
| -------------------- | --------------------------------------------------------- |
| `*.go`               | The commands, the flag parser and the output              |
| `internal/hcrypto`   | AES-256-GCM and PBKDF2, the same format as the web app    |
| `internal/api`       | The HTTP client                                           |
| `internal/service`   | The operations that the commands and the MCP server share |
| `internal/mcpserver` | The MCP tools                                             |
| `internal/config`    | The config file, the session and the delete tokens        |
| `internal/links`     | Secret and request links                                  |
| `internal/prompt`    | Prompts without echo                                      |
| `internal/htmltext`  | Converts web app HTML to plain text                       |
| `testdata`           | Crypto vectors and the script that makes them             |
| `e2e`                | The end-to-end test and its helpers                       |

## License

MIT
