package main

import (
	"fmt"

	"github.com/HemmeligOrg/hemmelig-cli/internal/service"
)

func (a *app) requestsCommand(args []string) error {
	return a.group("requests", "Ask someone for a secret with a request link, and fill in request links.", args, []subcommand{
		{"create", "Create a request link to send to someone", a.requestsCreate},
		{"list", "List your requests", a.requestsList},
		{"show", "Show one request and its link", a.requestsShow},
		{"cancel", "Cancel a pending request", a.requestsCancel},
		{"open", "Show what a request link asks for (no account needed)", a.requestsOpen},
		{"submit", "Encrypt a secret locally and fill in a request link", a.requestsSubmit},
	})
}

func (a *app) requestsCreate(args []string) error {
	fs := newFlagSet("hemmelig requests create --title <title> [flags]",
		"Create a request link. The person who opens it encrypts a secret for you.",
		`hemmelig requests create --title "AWS keys for the deploy" --valid-for 3d`,
		`hemmelig requests create --title "VPN config" --views 2 --expires 7d --json`)
	title := fs.String("title", "t", "", "title", "What you ask for. Required")
	description := fs.String("description", "d", "", "text", "More detail for the person who fills it in")
	views := fs.Int("views", "v", 1, "number", "Views of the secret that the request creates")
	expires := fs.String("expires", "e", "1d", "time", "Lifetime of that secret: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d or 28d")
	validFor := fs.String("valid-for", "", "7d", "time", "How long the link works: 1h, 12h, 1d, 3d, 7d, 14d or 30d")
	ip := fs.String("ip", "", "", "cidr", "Allow only this IP address or CIDR range to open the secret")
	preventBurn := fs.Bool("prevent-burn", "", "Keep the secret until it expires, however many views")
	webhook := fs.String("webhook-url", "", "", "url", "Call this URL when the request is fulfilled")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if *title == "" {
		return usagef("--title is required")
	}
	expiresIn, err := service.ParseExpiration(*expires)
	if err != nil {
		return usageError{err}
	}
	valid, err := service.ParseValidity(*validFor)
	if err != nil {
		return usageError{err}
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	result, err := svc.CreateRequest(a.ctx, service.CreateRequestInput{
		Title: *title, Description: *description, MaxViews: *views, ExpiresIn: expiresIn,
		ValidFor: valid, AllowedIP: *ip, PreventBurn: *preventBurn, WebhookURL: *webhook,
	})
	if err != nil {
		return err
	}
	return a.output(result, func() {
		fmt.Fprintln(a.stdout, result.Link)
		if result.WebhookSecret != "" {
			a.info("Webhook secret, shown only once: %s", result.WebhookSecret)
		}
	})
}

func (a *app) requestsList(args []string) error {
	fs := newFlagSet("hemmelig requests list [flags]", "List your secret requests.",
		`hemmelig requests list --status pending`)
	status := fs.String("status", "s", "", "status", "Filter: all, pending, fulfilled, expired or cancelled")
	page := fs.Int("page", "", 1, "number", "Page number")
	limit := fs.Int("limit", "", 20, "number", "Requests per page, up to 100")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	list, err := svc.ListRequests(a.ctx, *status, *page, *limit)
	if err != nil {
		return err
	}
	return a.output(list, func() {
		rows := [][]string{}
		for _, request := range list.Data {
			rows = append(rows, []string{request.ID, request.Status, request.Title, shortTime(request.CreatedAt), shortTime(request.ExpiresAt), value(request.SecretID)})
		}
		a.table([]string{"ID", "STATUS", "TITLE", "CREATED", "LINK EXPIRES", "SECRET ID"}, rows)
		a.info("Page %d of %d, %d requests in total.", list.Meta.Page, max(list.Meta.TotalPages, 1), list.Meta.Total)
	})
}

func (a *app) requestsShow(args []string) error {
	fs := newFlagSet("hemmelig requests show <id>", "Show a request and its link.",
		`hemmelig requests show 7a1f3c52-9b0e-4d6a-8c21-5e4f0b9d2a17`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one request ID")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	request, err := svc.ShowRequest(a.ctx, fs.Args()[0])
	if err != nil {
		return err
	}
	return a.output(request, func() {
		a.table([]string{"FIELD", "VALUE"}, [][]string{
			{"ID", request.ID},
			{"Title", request.Title},
			{"Description", value(request.Description)},
			{"Status", request.Status},
			{"Views", fmt.Sprint(request.MaxViews)},
			{"Secret lifetime", service.ExpirationName(request.ExpiresIn)},
			{"Link expires", shortTime(request.ExpiresAt)},
			{"Secret ID", value(request.SecretID)},
			{"Link", request.Link},
		})
	})
}

func (a *app) requestsCancel(args []string) error {
	fs := newFlagSet("hemmelig requests cancel <id>", "Cancel a pending request. The link stops working.",
		`hemmelig requests cancel 7a1f3c52-9b0e-4d6a-8c21-5e4f0b9d2a17`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one request ID")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	if err := svc.CancelRequest(a.ctx, fs.Args()[0]); err != nil {
		return err
	}
	return a.done("Cancelled the request.", map[string]bool{"cancelled": true})
}

func (a *app) requestsOpen(args []string) error {
	fs := newFlagSet("hemmelig requests open <link>", "Show the title and the description of a request link.",
		`hemmelig requests open "https://hemmelig.app/request/<id>#token=<token>"`)
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) != 1 {
		return usagef("give one request link")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	info, err := svc.OpenRequest(a.ctx, fs.Args()[0])
	if err != nil {
		return err
	}
	return a.output(info, func() {
		fmt.Fprintln(a.stdout, info.Title)
		if info.Description != nil && *info.Description != "" {
			fmt.Fprintln(a.stdout, *info.Description)
		}
	})
}

func (a *app) requestsSubmit(args []string) error {
	fs := newFlagSet("hemmelig requests submit <link> [text|-] [flags]",
		"Encrypt a secret locally and fill in a request link. Without text, the CLI reads stdin. Send the printed link back to the person who asked.",
		`hemmelig requests submit "https://hemmelig.app/request/<id>#token=<token>" "the api key"`,
		`cat vpn.conf | hemmelig requests submit "<link>" --title "VPN config"`)
	title := fs.String("title", "t", "", "title", "Title, encrypted like the secret")
	if done, err := a.parse(fs, args); done || err != nil {
		return err
	}
	if len(fs.Args()) < 1 || len(fs.Args()) > 2 {
		return usagef("give the request link and the secret text")
	}
	text, _, err := a.readInput(fs.Args()[1:])
	if err != nil {
		return err
	}
	if text == "" {
		return usagef("no secret given: pass the text as an argument or pipe it to stdin")
	}
	svc, _, err := a.service()
	if err != nil {
		return err
	}
	result, err := svc.SubmitRequest(a.ctx, fs.Args()[0], text, *title)
	if err != nil {
		return err
	}
	return a.output(result, func() {
		fmt.Fprintln(a.stdout, result.Link)
		a.info("Send this link to the person who asked. The key is the part after #: %s", result.Key)
	})
}
