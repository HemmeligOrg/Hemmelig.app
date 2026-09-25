package main

import (
	"errors"
	"fmt"

	"github.com/HemmeligOrg/hemmelig-cli/internal/config"
	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func (a *app) accountCommand(args []string) error {
	return a.group("account", "Manage your account, 2FA and API keys.", args, []subcommand{
		{"show", "Show your account", a.accountShow},
		{"update", "Change your username or email", a.accountUpdate},
		{"password", "Change your password (needs hemmelig login)", a.accountPassword},
		{"delete", "Delete your account (needs hemmelig login)", a.accountDelete},
		{"2fa", "Show, turn on or turn off two-factor authentication", a.twoFactorCommand},
		{"api-keys", "List, create and revoke API keys", a.apiKeysCommand},
	})
}

func (a *app) printUser(user *service.User, extra [][]string) {
	rows := [][]string{{"Username", user.Username}, {"Email", user.Email}}
	if user.Name != "" {
		rows = append(rows, []string{"Name", user.Name})
	}
	if user.Role != "" {
		rows = append(rows, []string{"Role", user.Role})
	}
	if user.TwoFactorEnabled != nil {
		rows = append(rows, []string{"2FA", map[bool]string{true: "on", false: "off"}[*user.TwoFactorEnabled]})
	}
	a.table([]string{"FIELD", "VALUE"}, append(rows, extra...))
}

func (a *app) accountShow(args []string) error {
	fs := newFlagSet("hemmelig account show", "Show the account of the current credential.", `hemmelig account show --json`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	user, err := svc.Account(a.ctx)
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printUser(user, nil) })
}

func (a *app) accountUpdate(args []string) error {
	fs := newFlagSet("hemmelig account update [--username <name>] [--email <email>]", "Change your username or email.",
		`hemmelig account update --email new@example.com`)
	username := fs.String("username", "", "", "name", "New username")
	email := fs.String("email", "", "", "email", "New email address. The address needs a new verification")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if *username == "" && *email == "" {
		return usagef("give --username, --email or both")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	user, err := svc.UpdateAccount(a.ctx, *username, *email)
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printUser(user, nil) })
}

func (a *app) accountPassword(args []string) error {
	fs := newFlagSet("hemmelig account password", "Change your password. The CLI asks for the current and the new password without echo. This needs a session from hemmelig login.",
		`hemmelig account password`, `printf '%s\n%s\n' "$OLD" "$NEW" | hemmelig account password`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.sessionService()
	if err != nil {
		return err
	}
	current, err := a.prompt.Secret("Current password: ")
	if err != nil {
		return err
	}
	next, err := a.prompt.Secret("New password: ")
	if err != nil {
		return err
	}
	if a.prompt.Terminal() {
		again, err := a.prompt.Secret("New password again: ")
		if err != nil {
			return err
		}
		if again != next {
			return errors.New("the new passwords do not match")
		}
	}
	if err := svc.ChangePassword(a.ctx, current, next); err != nil {
		return err
	}
	return a.done("Changed the password.", map[string]bool{"changed": true})
}

func (a *app) accountDelete(args []string) error {
	fs := newFlagSet("hemmelig account delete [--yes]", "Delete your account and all your secrets. This cannot be undone. This needs a session from hemmelig login.",
		`hemmelig account delete`)
	yes := fs.Bool("yes", "y", "Delete without a question")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, s, err := a.sessionService()
	if err != nil {
		return err
	}
	if err := a.confirm(*yes, "delete", "This deletes your account and all your secrets."); err != nil {
		return err
	}
	if err := svc.DeleteAccount(a.ctx); err != nil {
		return err
	}
	s.Config.Session = nil
	if err := s.Config.Save(); err != nil {
		return err
	}
	return a.done("Deleted the account.", map[string]bool{"deleted": true})
}

func (a *app) twoFactorCommand(args []string) error {
	return a.group("account 2fa", "Two-factor authentication with an authenticator app. Changes need a session from hemmelig login.", args, []subcommand{
		{"status", "Show whether 2FA is on", a.twoFactorStatus},
		{"enable", "Turn on 2FA and show the setup URI and the backup codes", a.twoFactorEnable},
		{"verify", "Finish the 2FA setup with a code from the app", a.twoFactorVerify},
		{"disable", "Turn off 2FA", a.twoFactorDisable},
	})
}

func (a *app) twoFactorStatus(args []string) error {
	fs := newFlagSet("hemmelig account 2fa status", "Show whether 2FA is on.", `hemmelig account 2fa status`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.sessionService()
	if err != nil {
		return err
	}
	enabled, err := svc.TwoFactorStatus(a.ctx)
	if err != nil {
		return err
	}
	return a.done(map[bool]string{true: "2FA is on.", false: "2FA is off."}[enabled], map[string]bool{"enabled": enabled})
}

func (a *app) twoFactorEnable(args []string) error {
	fs := newFlagSet("hemmelig account 2fa enable [flags]",
		"Turn on 2FA. Add the URI to your authenticator app, keep the backup codes, then type a code from the app.",
		`hemmelig account 2fa enable`, `hemmelig account 2fa enable --no-verify --json`)
	noVerify := fs.Bool("no-verify", "", "Do not ask for a code now. Run hemmelig account 2fa verify later")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.sessionService()
	if err != nil {
		return err
	}
	password, err := a.prompt.Secret("Account password: ")
	if err != nil {
		return err
	}
	setup, err := svc.EnableTwoFactor(a.ctx, password)
	if err != nil {
		return err
	}
	if err := a.output(setup, func() {
		fmt.Fprintf(a.stdout, "Setup URI: %s\n\nBackup codes. Keep them in a safe place:\n", setup.TOTPURI)
		for _, code := range setup.BackupCodes {
			fmt.Fprintf(a.stdout, "  %s\n", code)
		}
	}); err != nil {
		return err
	}
	if *noVerify {
		a.info("Run hemmelig account 2fa verify <code> to finish the setup.")
		return nil
	}
	code, err := a.prompt.Line("Code from the app: ")
	if err != nil {
		return err
	}
	if err := svc.VerifyTwoFactor(a.ctx, code); err != nil {
		return err
	}
	a.info("2FA is on.")
	return nil
}

func (a *app) twoFactorVerify(args []string) error {
	fs := newFlagSet("hemmelig account 2fa verify <code>", "Finish the 2FA setup with a code from the authenticator app.", `hemmelig account 2fa verify 123456`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give the 6-digit code")
	}
	svc, _, err := a.sessionService()
	if err != nil {
		return err
	}
	if err := svc.VerifyTwoFactor(a.ctx, fs.Args()[0]); err != nil {
		return err
	}
	return a.done("2FA is on.", map[string]bool{"enabled": true})
}

func (a *app) twoFactorDisable(args []string) error {
	fs := newFlagSet("hemmelig account 2fa disable", "Turn off 2FA. The CLI asks for your account password.", `hemmelig account 2fa disable`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.sessionService()
	if err != nil {
		return err
	}
	password, err := a.prompt.Secret("Account password: ")
	if err != nil {
		return err
	}
	if err := svc.DisableTwoFactor(a.ctx, password); err != nil {
		return err
	}
	return a.done("2FA is off.", map[string]bool{"enabled": false})
}

func (a *app) apiKeysCommand(args []string) error {
	return a.group("account api-keys", "API keys act as you in scripts and in the MCP server. A user can have 5 keys.", args, []subcommand{
		{"list", "List your API keys", a.apiKeysList},
		{"create", "Create an API key (needs hemmelig login)", a.apiKeysCreate},
		{"revoke", "Delete an API key", a.apiKeysRevoke},
	})
}

func (a *app) apiKeysList(args []string) error {
	fs := newFlagSet("hemmelig account api-keys list", "List your API keys. The list shows the prefix, not the key.", `hemmelig account api-keys list`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	keys, err := svc.ListAPIKeys(a.ctx)
	if err != nil {
		return err
	}
	return a.output(keys, func() {
		rows := [][]string{}
		for _, key := range keys {
			rows = append(rows, []string{key.ID, key.Name, key.KeyPrefix + "...", shortTime(value(key.LastUsedAt)), shortTime(value(key.ExpiresAt))})
		}
		a.table([]string{"ID", "NAME", "PREFIX", "LAST USED", "EXPIRES"}, rows)
	})
}

func (a *app) apiKeysCreate(args []string) error {
	fs := newFlagSet("hemmelig account api-keys create --name <name> [flags]",
		"Create an API key and print it. The server shows the key only once. This needs a session from hemmelig login.",
		`hemmelig account api-keys create --name "CI deploy" --expires-in-days 90`,
		`hemmelig account api-keys create --name laptop --save`)
	name := fs.String("name", "n", "", "name", "Name of the key. Required")
	days := fs.Int("expires-in-days", "", 0, "days", "Expire the key after 1 to 365 days. Without it, the key does not expire")
	save := fs.Bool("save", "", "Store the key in the config file for this URL")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if *name == "" {
		return usagef("--name is required")
	}
	svc, s, err := a.sessionService()
	if err != nil {
		return err
	}
	key, err := svc.CreateAPIKey(a.ctx, *name, *days)
	if err != nil {
		return err
	}
	if *save {
		s.Config.URL, s.Config.APIKey = s.URL, key.Key
		if err := s.Config.Save(); err != nil {
			return err
		}
		path, _ := config.Path()
		a.info("Stored the key in %s.", path)
	}
	return a.output(key, func() {
		fmt.Fprintln(a.stdout, key.Key)
		a.info("The server shows this key only once. Store it in a safe place.")
	})
}

func (a *app) apiKeysRevoke(args []string) error {
	fs := newFlagSet("hemmelig account api-keys revoke <id>", "Delete an API key. Programs that use it stop working.", `hemmelig account api-keys revoke <id>`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one API key ID")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if err := svc.RevokeAPIKey(a.ctx, fs.Args()[0]); err != nil {
		return err
	}
	return a.done("Revoked the API key.", map[string]bool{"revoked": true})
}
