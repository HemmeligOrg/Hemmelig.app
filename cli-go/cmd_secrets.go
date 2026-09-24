package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/htmltext"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func (a *app) secretsCommand(args []string) error {
	return a.group("secrets", "Create, read, list and delete secrets.", args, []subcommand{
		{"create", "Encrypt text and files locally and create a secret link", a.secretsCreate},
		{"get", "Open a secret link, decrypt it and save its files", a.secretsGet},
		{"read", "Same as get", a.secretsGet},
		{"list", "List your secrets (metadata only)", a.secretsList},
		{"delete", "Delete a secret before it expires", a.secretsDelete},
	})
}

// secretsCreate also runs the legacy form: hemmelig "text" [flags].
func (a *app) secretsCreate(args []string) error {
	fs := newFlagSet("hemmelig secrets create [text|-] [flags]",
		"Encrypt a secret locally and print the link. Without text, the CLI reads stdin.",
		`hemmelig secrets create "db password: hunter2" --expires 1h`,
		`cat .env | hemmelig secrets create --title "Staging env" --views 3`,
		`hemmelig secrets create "see file" --file ./id_ed25519 --password-prompt`,
		`hemmelig "legacy form still works" -e 7d`)
	title := fs.String("title", "t", "", "title", "Title, encrypted like the secret")
	password := fs.String("password", "p", "", "password", "Protect the secret with a password. The link then has no key")
	passwordPrompt := fs.Bool("password-prompt", "", "Ask for the password without echo")
	expires := fs.String("expires", "e", "1d", "time", "Lifetime: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d or 28d")
	views := fs.Int("views", "v", 1, "number", "Views before the secret burns, 1 to 9999")
	fs.Bool("burnable", "b", "Send the burned webhook event after the last view. This is the default")
	noBurnable := fs.Bool("no-burnable", "", "Send the viewed webhook event after the last view. The view limit still applies")
	noViewLimit := fs.Bool("no-view-limit", "", "Keep the secret until it expires, however many views")
	burnAfterTime := fs.Bool("burn-after-time", "", "Same as --no-view-limit. The web app uses this name")
	ipRange := fs.String("ip", "", "", "cidr", "Allow only this IP address or CIDR range to open the secret")
	files := fs.List("file", "f", "path", "Attach a file. Files need an API key or a session")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}

	expiresIn, err := service.ParseExpiration(*expires)
	if err != nil {
		return usageError{err}
	}
	unlimited := *noViewLimit || *burnAfterTime
	// Refuse the combination, so that an explicit view limit is never dropped.
	if unlimited && fs.Changed("views") {
		return usagef("use --views or --no-view-limit, not both")
	}
	if len(fs.Args()) > 1 {
		return usagef("give the secret as one argument, in quotes")
	}

	pass := *password
	if *passwordPrompt {
		if pass, err = a.prompt.Secret("Secret password: "); err != nil {
			return err
		}
	}

	text, _, err := a.readInput(fs.Args())
	if err != nil {
		return err
	}
	inputs := make([]service.FileInput, 0, len(*files))
	for _, path := range *files {
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		inputs = append(inputs, service.FileInput{Name: filepath.Base(path), Data: data})
	}
	if text == "" && len(inputs) == 0 {
		return usagef("no secret given: pass the text as an argument, pipe it to stdin or attach a file")
	}

	svc, _, err := a.service()
	if err != nil {
		return err
	}
	result, err := svc.CreateSecret(a.ctx, service.CreateSecretInput{
		Text:        text,
		Title:       *title,
		ExpiresIn:   expiresIn,
		Views:       *views,
		NoViewLimit: unlimited,
		Burnable:    !*noBurnable,
		Password:    pass,
		IPRange:     *ipRange,
		Files:       inputs,
	})
	if err != nil {
		return err
	}
	return a.output(result, func() {
		fmt.Fprintln(a.stdout, result.Link)
		if result.PasswordProtected {
			a.info("The link has no key. Send the password on another channel.")
		}
	})
}

type readOutput struct {
	*service.ReadSecretResult
	HTML  bool       `json:"html"`
	Files []fileInfo `json:"files"`
}

type fileInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Size int    `json:"size"`
	Path string `json:"path,omitempty"`
}

func (a *app) secretsGet(args []string) error {
	fs := newFlagSet("hemmelig secrets get <link|id> [flags]",
		"Open a secret, decrypt it locally and print it. Opening a secret uses one view, also when the key is wrong.",
		`hemmelig secrets get "https://hemmelig.app/s/<id>#<key>"`,
		`hemmelig secrets get https://hemmelig.app/s/<id> --password-prompt`,
		`hemmelig secrets get <id> --key <key> --output-dir ./downloads`)
	key := fs.String("key", "k", "", "key", "Decryption key, when the link has none")
	password := fs.String("password", "p", "", "password", "Password of a protected secret")
	passwordPrompt := fs.Bool("password-prompt", "", "Ask for the password without echo")
	outputDir := fs.String("output-dir", "o", ".", "dir", "Folder for the attached files")
	noFiles := fs.Bool("no-files", "", "Do not download the attached files")
	force := fs.Bool("force", "", "Overwrite files that exist")
	raw := fs.Bool("raw", "", "Print the secret as stored. Secrets from the web app are HTML")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one secret link or ID")
	}

	pass := *password
	if *passwordPrompt {
		var err error
		if pass, err = a.prompt.Secret("Secret password: "); err != nil {
			return err
		}
	}

	svc, _, err := a.service()
	if err != nil {
		return err
	}
	result, err := svc.ReadSecret(a.ctx, service.ReadSecretInput{Ref: fs.Args()[0], Key: *key, Password: pass, SkipFiles: *noFiles})
	if errors.Is(err, service.ErrPasswordRequired) && a.prompt.Terminal() && pass == "" {
		if pass, err = a.prompt.Secret("Secret password: "); err != nil {
			return err
		}
		result, err = svc.ReadSecret(a.ctx, service.ReadSecretInput{Ref: fs.Args()[0], Key: *key, Password: pass, SkipFiles: *noFiles})
	}
	if err != nil {
		if errors.Is(err, service.ErrPasswordRequired) || errors.Is(err, service.ErrNoKey) {
			return usageError{err}
		}
		return err
	}

	out := readOutput{ReadSecretResult: result, Files: []fileInfo{}}
	if !*raw && htmltext.LooksLikeHTML(result.Content) {
		out.HTML = true
		result.Content = htmltext.ToText(result.Content)
	}
	if !*noFiles && len(result.Files) > 0 {
		if err := os.MkdirAll(*outputDir, 0o700); err != nil {
			return err
		}
	}
	for _, file := range result.Files {
		info := fileInfo{ID: file.ID, Name: file.Name, Size: file.Size}
		if !*noFiles {
			// The name comes from the sender. Keep only the base name, so it
			// cannot write outside the folder.
			name := filepath.Base(filepath.Clean("/" + strings.ReplaceAll(file.Name, "\\", "/")))
			if name == "/" || name == "." || name == "" {
				name = file.ID
			}
			info.Path = filepath.Join(*outputDir, name)
			if err := writeFileNew(info.Path, file.Data, *force); err != nil {
				return err
			}
		}
		out.Files = append(out.Files, info)
	}

	return a.output(out, func() {
		if result.Title != "" {
			a.info("Title: %s", result.Title)
		}
		fmt.Fprintln(a.stdout, result.Content)
		for _, file := range out.Files {
			if file.Path != "" {
				a.info("Saved %s (%d bytes)", file.Path, file.Size)
			} else {
				a.info("Attached file not downloaded: %s", file.Name)
			}
		}
		if result.ViewsRemaining != nil {
			a.info("Views left: %d", *result.ViewsRemaining)
		}
	})
}

func (a *app) secretsList(args []string) error {
	fs := newFlagSet("hemmelig secrets list [flags]",
		"List your secrets. The server knows only metadata, so the list has no content or titles.",
		`hemmelig secrets list`, `hemmelig secrets list --page 2 --limit 50 --json`)
	page := fs.Int("page", "", 1, "number", "Page number")
	limit := fs.Int("limit", "", 20, "number", "Secrets per page, up to 100")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	list, err := svc.ListSecrets(a.ctx, *page, *limit)
	if err != nil {
		return err
	}
	return a.output(list, func() {
		rows := [][]string{}
		for _, secret := range list.Data {
			flags := []string{}
			if secret.IsPasswordProtected {
				flags = append(flags, "password")
			}
			if secret.IPRange != "" {
				flags = append(flags, "ip:"+secret.IPRange)
			}
			if secret.FileCount > 0 {
				flags = append(flags, fmt.Sprintf("files:%d", secret.FileCount))
			}
			if len(flags) == 0 {
				flags = append(flags, "-")
			}
			views := "no limit"
			if secret.Views != nil {
				views = fmt.Sprint(*secret.Views)
			}
			rows = append(rows, []string{secret.ID, shortTime(secret.CreatedAt), shortTime(secret.ExpiresAt), views, strings.Join(flags, ",")})
		}
		a.table([]string{"ID", "CREATED", "EXPIRES", "VIEWS LEFT", "OPTIONS"}, rows)
		a.info("Page %d of %d, %d secrets in total.", list.Meta.Page, max(list.Meta.TotalPages, 1), list.Meta.Total)
	})
}

func (a *app) secretsDelete(args []string) error {
	fs := newFlagSet("hemmelig secrets delete <link|id>",
		"Delete a secret. It works for the owner, and with the delete token that the CLI stores when it creates or opens a secret.",
		`hemmelig secrets delete 3f0c2a4e-6f1b-4c1d-9a55-0a4c8f1e2b7d`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one secret link or ID")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if err := svc.DeleteSecret(a.ctx, fs.Args()[0]); err != nil {
		return err
	}
	return a.done("Deleted the secret.", map[string]bool{"deleted": true})
}
