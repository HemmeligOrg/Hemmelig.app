package main

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type flagKind int

const (
	kindString flagKind = iota
	kindBool
	kindInt
	kindList
)

type flagDef struct {
	long, short string
	kind        flagKind
	placeholder string
	usage       string
	str         *string
	boolean     *bool
	number      *int
	list        *[]string
	set         bool
}

// flagSet parses the flags of one command. It accepts --name value,
// --name=value, -n value, and flags after positional arguments. The
// argument -- ends the flags.
type flagSet struct {
	usage    string
	summary  string
	examples []string
	defs     []*flagDef
	byName   map[string]*flagDef
	args     []string
	help     bool
}

func newFlagSet(usage, summary string, examples ...string) *flagSet {
	fs := &flagSet{usage: usage, summary: summary, examples: examples, byName: map[string]*flagDef{}}
	fs.Bool("help", "h", "Show help for this command")
	fs.help = false
	return fs
}

func (fs *flagSet) add(def *flagDef) {
	fs.defs = append(fs.defs, def)
	fs.byName["--"+def.long] = def
	if def.short != "" {
		fs.byName["-"+def.short] = def
	}
}

func (fs *flagSet) String(long, short, value, placeholder, usage string) *string {
	target := value
	fs.add(&flagDef{long: long, short: short, kind: kindString, placeholder: placeholder, usage: usage, str: &target})
	return &target
}

func (fs *flagSet) Bool(long, short, usage string) *bool {
	target := false
	fs.add(&flagDef{long: long, short: short, kind: kindBool, usage: usage, boolean: &target})
	return &target
}

func (fs *flagSet) Int(long, short string, value int, placeholder, usage string) *int {
	target := value
	fs.add(&flagDef{long: long, short: short, kind: kindInt, placeholder: placeholder, usage: usage, number: &target})
	return &target
}

func (fs *flagSet) List(long, short, placeholder, usage string) *[]string {
	target := []string{}
	fs.add(&flagDef{long: long, short: short, kind: kindList, placeholder: placeholder, usage: usage, list: &target})
	return &target
}

// Changed reports whether the user gave the flag.
func (fs *flagSet) Changed(long string) bool {
	def, ok := fs.byName["--"+long]
	return ok && def.set
}

// Args returns the positional arguments.
func (fs *flagSet) Args() []string { return fs.args }

func (fs *flagSet) Parse(args []string) error {
	for i := 0; i < len(args); i++ {
		arg := args[i]
		if arg == "--" {
			fs.args = append(fs.args, args[i+1:]...)
			break
		}
		if arg == "/?" {
			fs.help = true
			continue
		}
		if len(arg) < 2 || arg[0] != '-' {
			fs.args = append(fs.args, arg)
			continue
		}

		name, value, hasValue := strings.Cut(arg, "=")
		def, ok := fs.byName[name]
		if !ok {
			return usageError{fmt.Errorf("unknown flag %s", name)}
		}
		def.set = true

		if def.kind == kindBool {
			enabled := true
			if hasValue {
				parsed, err := strconv.ParseBool(value)
				if err != nil {
					return usageError{fmt.Errorf("%s takes true or false, not %q", name, value)}
				}
				enabled = parsed
			}
			*def.boolean = enabled
			if def.long == "help" {
				fs.help = enabled
			}
			continue
		}

		if !hasValue {
			if i+1 >= len(args) {
				return usageError{fmt.Errorf("%s needs a value", name)}
			}
			i++
			value = args[i]
		}
		switch def.kind {
		case kindString:
			*def.str = value
		case kindList:
			*def.list = append(*def.list, value)
		case kindInt:
			number, err := strconv.Atoi(value)
			if err != nil {
				return usageError{fmt.Errorf("%s takes a whole number, not %q", name, value)}
			}
			*def.number = number
		}
	}
	return nil
}

// Help returns the help text of the command.
func (fs *flagSet) Help() string {
	var b strings.Builder
	fmt.Fprintf(&b, "%s\n\nUsage:\n  %s\n", fs.summary, fs.usage)
	if len(fs.defs) > 0 {
		b.WriteString("\nFlags:\n")
		rows := make([][2]string, 0, len(fs.defs))
		width := 0
		for _, def := range fs.defs {
			left := "    --" + def.long
			if def.short != "" {
				left = "-" + def.short + ", --" + def.long
			}
			if def.kind != kindBool {
				placeholder := def.placeholder
				if placeholder == "" {
					placeholder = "value"
				}
				left += " <" + placeholder + ">"
			}
			if len(left) > width {
				width = len(left)
			}
			usage := def.usage
			if def.kind == kindString && *def.str != "" {
				usage += " (default: " + *def.str + ")"
			}
			if def.kind == kindInt && *def.number != 0 {
				usage += " (default: " + strconv.Itoa(*def.number) + ")"
			}
			if def.kind == kindList {
				usage += " (repeatable)"
			}
			rows = append(rows, [2]string{left, usage})
		}
		for _, row := range rows {
			fmt.Fprintf(&b, "  %-*s  %s\n", width, row[0], row[1])
		}
	}
	if len(fs.examples) > 0 {
		b.WriteString("\nExamples:\n")
		for _, example := range fs.examples {
			fmt.Fprintf(&b, "  %s\n", example)
		}
	}
	return b.String()
}

// usageError is an error in the command line. It exits with code 2.
type usageError struct{ err error }

func (e usageError) Error() string { return e.err.Error() }
func (e usageError) Unwrap() error { return e.err }

func usagef(format string, args ...any) error { return usageError{fmt.Errorf(format, args...)} }

func isUsageError(err error) bool {
	var target usageError
	return errors.As(err, &target)
}

// parseDuration accepts a number with the unit s, m, h or d, for example 7d.
func parseDuration(value string) (int, error) {
	if len(value) < 2 {
		return 0, fmt.Errorf("invalid duration %q: use a number and s, m, h or d, for example 7d", value)
	}
	units := map[byte]int{'s': 1, 'm': 60, 'h': 3600, 'd': 86400}
	unit, ok := units[value[len(value)-1]]
	number, err := strconv.Atoi(value[:len(value)-1])
	if !ok || err != nil || number <= 0 {
		return 0, fmt.Errorf("invalid duration %q: use a number and s, m, h or d, for example 7d", value)
	}
	return number * unit, nil
}
