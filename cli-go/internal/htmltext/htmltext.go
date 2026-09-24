// Package htmltext converts the HTML that the web editor stores to plain text.
//
// The web app stores secrets as TipTap HTML, for example
// "<p>user</p><p>pass</p>". A terminal needs plain lines instead.
package htmltext

import (
	"html"
	"strings"
)

// LooksLikeHTML reports whether text is probably editor HTML.
func LooksLikeHTML(text string) bool {
	trimmed := strings.TrimSpace(text)
	return strings.HasPrefix(trimmed, "<") && strings.Contains(trimmed, "</")
}

// blockTags end with a line break.
var blockTags = map[string]bool{
	"p": true, "div": true, "h1": true, "h2": true, "h3": true, "h4": true, "h5": true,
	"h6": true, "li": true, "pre": true, "blockquote": true, "ul": true, "ol": true, "tr": true,
}

// ToText converts editor HTML to plain text. List items get a "- " prefix.
// Text that is not HTML is returned unchanged.
func ToText(input string) string {
	if !LooksLikeHTML(input) {
		return input
	}

	var out strings.Builder
	var text strings.Builder
	flush := func() {
		out.WriteString(html.UnescapeString(text.String()))
		text.Reset()
	}

	for i := 0; i < len(input); {
		if input[i] != '<' {
			text.WriteByte(input[i])
			i++
			continue
		}
		end := strings.IndexByte(input[i:], '>')
		if end < 0 {
			text.WriteString(input[i:])
			break
		}
		tag := strings.ToLower(strings.TrimSpace(input[i+1 : i+end]))
		i += end + 1

		closing := strings.HasPrefix(tag, "/")
		name := strings.TrimPrefix(tag, "/")
		if space := strings.IndexAny(name, " \t\n/"); space >= 0 {
			name = name[:space]
		}

		switch {
		case name == "br":
			flush()
			out.WriteString("\n")
		case name == "li" && !closing:
			flush()
			out.WriteString("- ")
		case blockTags[name] && closing:
			flush()
			if !strings.HasSuffix(out.String(), "\n") {
				out.WriteString("\n")
			}
		}
	}
	flush()

	return strings.TrimRight(out.String(), "\n")
}
