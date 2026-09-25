package main

import (
	"fmt"
	"sort"

	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func (a *app) adminCommand(args []string) error {
	return a.group("admin", "Manage the instance. These commands need an admin account.", args, []subcommand{
		{"users", "List, create, change, ban and delete users", a.usersCommand},
		{"invites", "List, create and deactivate invite codes", a.invitesCommand},
		{"instance", "Show and change the instance settings", a.instanceCommand},
		{"analytics", "Show secret and visitor statistics", a.analyticsCommand},
	})
}

func (a *app) usersCommand(args []string) error {
	return a.group("admin users", "Manage users. A <user> is a user ID, a username or an email.", args, []subcommand{
		{"list", "List users", a.usersList},
		{"create", "Create a user", a.usersCreate},
		{"update", "Change the username, the email or the role of a user", a.usersUpdate},
		{"ban", "Ban a user", a.usersBan},
		{"unban", "Remove the ban of a user", a.usersUnban},
		{"set-password", "Set a new password for a user", a.usersSetPassword},
		{"delete", "Delete a user and the secrets of the user", a.usersDelete},
	})
}

func (a *app) printAdminUsers(users []service.AdminUser) {
	rows := [][]string{}
	for _, user := range users {
		banned := "no"
		if user.Banned != nil && *user.Banned {
			banned = "yes"
		}
		rows = append(rows, []string{user.ID, user.Username, user.Email, value(user.Role), banned, shortTime(user.CreatedAt)})
	}
	a.table([]string{"ID", "USERNAME", "EMAIL", "ROLE", "BANNED", "CREATED"}, rows)
}

func (a *app) usersList(args []string) error {
	fs := newFlagSet("hemmelig admin users list [flags]", "List users.", `hemmelig admin users list --search example.com`)
	search := fs.String("search", "s", "", "text", "Match the username, the email or the name")
	page := fs.Int("page", "", 1, "number", "Page number")
	pageSize := fs.Int("page-size", "", 20, "number", "Users per page, up to 100")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	list, err := svc.ListUsers(a.ctx, *search, *page, *pageSize)
	if err != nil {
		return err
	}
	return a.output(list, func() {
		a.printAdminUsers(list.Users)
		a.info("Page %d of %d, %d users in total.", list.Page, max(list.TotalPages, 1), list.Total)
	})
}

func (a *app) usersCreate(args []string) error {
	fs := newFlagSet("hemmelig admin users create --username <name> --email <email> [flags]",
		"Create a user. The CLI asks for the password without echo. Usernames can have letters, digits and underscores.",
		`hemmelig admin users create --username jane_doe --email jane@example.com --role admin`)
	username := fs.String("username", "", "", "name", "Username. Required")
	email := fs.String("email", "", "", "email", "Email address. Required")
	name := fs.String("name", "", "", "name", "Display name")
	role := fs.String("role", "", "user", "role", "user or admin")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if *username == "" || *email == "" {
		return usagef("--username and --email are required")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	password, err := a.prompt.Secret("Password for the new user: ")
	if err != nil {
		return err
	}
	user, err := svc.CreateUser(a.ctx, service.CreateUserInput{Username: *username, Email: *email, Password: password, Name: *name, Role: *role})
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printAdminUsers([]service.AdminUser{*user}) })
}

func (a *app) oneUser(fs *flagSet) (string, error) {
	if len(fs.Args()) != 1 {
		return "", usagef("give one user ID, username or email")
	}
	return fs.Args()[0], nil
}

func (a *app) usersUpdate(args []string) error {
	fs := newFlagSet("hemmelig admin users update <user> [flags]", "Change the username, the email or the role of a user.",
		`hemmelig admin users update jane_doe --role admin`)
	username := fs.String("username", "", "", "name", "New username")
	email := fs.String("email", "", "", "email", "New email address")
	role := fs.String("role", "", "", "role", "New role: user or admin")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	ref, err := a.oneUser(fs)
	if err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	user, err := svc.UpdateUser(a.ctx, ref, service.UpdateUserInput{Username: *username, Email: *email, Role: *role})
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printAdminUsers([]service.AdminUser{*user}) })
}

func (a *app) usersBan(args []string) error {
	fs := newFlagSet("hemmelig admin users ban <user> [flags]", "Ban a user. The user cannot sign in, and the API keys of the user stop working.",
		`hemmelig admin users ban jane_doe --reason "Left the company"`, `hemmelig admin users ban jane_doe --duration 7d`)
	reason := fs.String("reason", "r", "", "text", "Reason for the ban")
	duration := fs.String("duration", "", "", "time", "Length of the ban, for example 12h or 30d. Without it, the ban has no end")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	ref, err := a.oneUser(fs)
	if err != nil {
		return err
	}
	seconds := 0
	if *duration != "" {
		if seconds, err = parseDuration(*duration); err != nil {
			return usageError{err}
		}
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	user, err := svc.BanUser(a.ctx, ref, *reason, seconds)
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printAdminUsers([]service.AdminUser{*user}) })
}

func (a *app) usersUnban(args []string) error {
	fs := newFlagSet("hemmelig admin users unban <user>", "Remove the ban of a user.", `hemmelig admin users unban jane_doe`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	ref, err := a.oneUser(fs)
	if err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	user, err := svc.UnbanUser(a.ctx, ref)
	if err != nil {
		return err
	}
	return a.output(user, func() { a.printAdminUsers([]service.AdminUser{*user}) })
}

func (a *app) usersSetPassword(args []string) error {
	fs := newFlagSet("hemmelig admin users set-password <user>", "Set a new password for a user. The CLI asks for it without echo.",
		`hemmelig admin users set-password jane_doe`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	ref, err := a.oneUser(fs)
	if err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	password, err := a.prompt.Secret("New password: ")
	if err != nil {
		return err
	}
	if err := svc.SetUserPassword(a.ctx, ref, password); err != nil {
		return err
	}
	return a.done("Set the password.", map[string]bool{"changed": true})
}

func (a *app) usersDelete(args []string) error {
	fs := newFlagSet("hemmelig admin users delete <user> [--yes]", "Delete a user and the secrets of the user. This cannot be undone.",
		`hemmelig admin users delete jane_doe --yes`)
	yes := fs.Bool("yes", "y", "Delete without a question")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	ref, err := a.oneUser(fs)
	if err != nil {
		return err
	}
	if err := a.confirm(*yes, ref, "This deletes the user and the secrets of the user."); err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if err := svc.DeleteUser(a.ctx, ref); err != nil {
		return err
	}
	return a.done("Deleted the user.", map[string]bool{"deleted": true})
}

func (a *app) invitesCommand(args []string) error {
	return a.group("admin invites", "Invite codes let people register when the instance requires them.", args, []subcommand{
		{"list", "List invite codes", a.invitesList},
		{"create", "Create an invite code", a.invitesCreate},
		{"deactivate", "Stop an invite code", a.invitesDeactivate},
	})
}

func (a *app) printInvites(invites []service.Invite) {
	rows := [][]string{}
	for _, invite := range invites {
		uses := fmt.Sprint(invite.Uses)
		if invite.MaxUses != nil {
			uses += "/" + fmt.Sprint(*invite.MaxUses)
		}
		active := "no"
		if invite.IsActive {
			active = "yes"
		}
		rows = append(rows, []string{invite.ID, invite.Code, uses, shortTime(value(invite.ExpiresAt)), active})
	}
	a.table([]string{"ID", "CODE", "USES", "EXPIRES", "ACTIVE"}, rows)
}

func (a *app) invitesList(args []string) error {
	fs := newFlagSet("hemmelig admin invites list", "List invite codes.", `hemmelig admin invites list`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	invites, err := svc.ListInvites(a.ctx)
	if err != nil {
		return err
	}
	return a.output(invites, func() { a.printInvites(invites) })
}

func (a *app) invitesCreate(args []string) error {
	fs := newFlagSet("hemmelig admin invites create [flags]", "Create an invite code and print it.",
		`hemmelig admin invites create --max-uses 10 --expires-in-days 14`)
	maxUses := fs.Int("max-uses", "", 1, "number", "Registrations the code allows, 1 to 100")
	days := fs.Int("expires-in-days", "", 0, "days", "Expire the code after 1 to 365 days")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	invite, err := svc.CreateInvite(a.ctx, *maxUses, *days)
	if err != nil {
		return err
	}
	return a.output(invite, func() { fmt.Fprintln(a.stdout, invite.Code) })
}

func (a *app) invitesDeactivate(args []string) error {
	fs := newFlagSet("hemmelig admin invites deactivate <id|code>", "Stop an invite code.", `hemmelig admin invites deactivate K3J9QX2M7ZPA`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one invite ID or code")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if err := svc.DeactivateInvite(a.ctx, fs.Args()[0]); err != nil {
		return err
	}
	return a.done("Deactivated the invite code.", map[string]bool{"deactivated": true})
}

func (a *app) instanceCommand(args []string) error {
	return a.group("admin instance", "Instance settings in the sections general, security, organization, webhook and metrics.", args, []subcommand{
		{"get", "Show the settings, or one section of them", a.instanceGet},
		{"set", "Change settings in one section", a.instanceSet},
	})
}

func (a *app) printSettings(settings map[string]any) {
	keys := make([]string, 0, len(settings))
	for key := range settings {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	rows := [][]string{}
	for _, key := range keys {
		text := fmt.Sprint(settings[key])
		if len(text) > 60 {
			text = text[:57] + "..."
		}
		rows = append(rows, []string{key, text})
	}
	a.table([]string{"KEY", "VALUE"}, rows)
}

func (a *app) instanceGet(args []string) error {
	fs := newFlagSet("hemmelig admin instance get [section]", "Show the instance settings. Sections: general, security, organization, webhook, metrics.",
		`hemmelig admin instance get security`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	section := ""
	if len(fs.Args()) > 0 {
		section = fs.Args()[0]
		if _, ok := service.SettingSections[section]; !ok {
			return usagef("unknown section %q: use general, security, organization, webhook or metrics", section)
		}
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	settings, err := svc.InstanceSettings(a.ctx, section)
	if err != nil {
		return err
	}
	return a.output(settings, func() { a.printSettings(settings) })
}

func (a *app) instanceSet(args []string) error {
	fs := newFlagSet("hemmelig admin instance set <section> <key=value>...",
		"Change instance settings. Run hemmelig admin instance get <section> to see the keys. Managed instances reject changes.",
		`hemmelig admin instance set security allowFileUploads=false rateLimitRequests=50`,
		`hemmelig admin instance set general instanceName="Acme secrets"`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) < 2 {
		return usagef("give a section and at least one key=value pair")
	}
	values, err := service.ParseSettings(fs.Args()[0], fs.Args()[1:])
	if err != nil {
		return usageError{err}
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if _, err := svc.UpdateInstanceSettings(a.ctx, values); err != nil {
		return err
	}
	return a.output(values, func() { a.printSettings(values) })
}

func (a *app) analyticsCommand(args []string) error {
	return a.group("admin analytics", "Secret and visitor statistics. Visitor IDs are anonymous hashes.", args, []subcommand{
		{"show", "Show the statistics for a time range", a.analyticsShow},
	})
}

func (a *app) analyticsShow(args []string) error {
	fs := newFlagSet("hemmelig admin analytics show [--range 7d|14d|30d]", "Show the secret and visitor statistics.",
		`hemmelig admin analytics show --range 7d`)
	timeRange := fs.String("range", "r", "30d", "range", "Time range: 7d, 14d or 30d")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	stats, err := svc.GetAnalytics(a.ctx, *timeRange)
	if err != nil {
		return err
	}
	return a.output(stats, func() {
		rows := [][]string{}
		for _, key := range []string{"totalSecrets", "activeSecrets", "expiredSecrets", "totalViews", "averageViews"} {
			rows = append(rows, []string{key, fmt.Sprint(stats.Secrets[key])})
		}
		if requests, ok := stats.Secrets["secretRequests"].(map[string]any); ok {
			rows = append(rows, []string{"secretRequests", fmt.Sprintf("%v (%v fulfilled)", requests["total"], requests["fulfilled"])})
		}
		unique, visits := 0.0, 0.0
		for _, day := range stats.Visitors {
			if entry, ok := day.(map[string]any); ok {
				u, _ := entry["unique_visitors"].(float64)
				v, _ := entry["total_visits"].(float64)
				unique, visits = unique+u, visits+v
			}
		}
		rows = append(rows, []string{"visits", fmt.Sprint(visits)}, []string{"dailyUniqueVisitors", fmt.Sprint(unique)})
		fmt.Fprintf(a.stdout, "Last %s\n", stats.Range)
		a.table([]string{"METRIC", "VALUE"}, rows)
	})
}
