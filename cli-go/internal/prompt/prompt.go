// Package prompt reads answers from the user. On a terminal, it turns off
// the echo for passwords. When stdin is not a terminal, it reads each answer
// as one line from stdin, so scripts can pipe the answers in.
package prompt

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

// ErrNoInput means that stdin closed before an answer came.
var ErrNoInput = errors.New("no input: stdin closed before the answer")

// Prompter asks questions on stderr and reads the answers from stdin.
type Prompter struct {
	in       *os.File
	reader   *bufio.Reader
	out      io.Writer
	terminal bool
}

// New returns a Prompter for the given stdin and stderr.
func New(in *os.File, out io.Writer) *Prompter {
	return &Prompter{in: in, reader: bufio.NewReader(in), out: out, terminal: in != nil && isTerminal(in.Fd())}
}

// Terminal reports whether stdin is a terminal.
func (p *Prompter) Terminal() bool { return p.terminal }

// Reader returns the buffered stdin. Use it to read the rest of stdin after
// a prompt, so no buffered bytes get lost.
func (p *Prompter) Reader() io.Reader { return p.reader }

func (p *Prompter) readLine() (string, error) {
	line, err := p.reader.ReadString('\n')
	if err != nil && (err != io.EOF || line == "") {
		if err == io.EOF {
			return "", ErrNoInput
		}
		return "", err
	}
	return strings.TrimRight(line, "\r\n"), nil
}

// Line asks for a visible answer.
func (p *Prompter) Line(label string) (string, error) {
	if p.terminal {
		fmt.Fprint(p.out, label)
	}
	return p.readLine()
}

// Secret asks for an answer without echo.
func (p *Prompter) Secret(label string) (string, error) {
	if !p.terminal {
		return p.readLine()
	}
	fmt.Fprint(p.out, label)
	var answer string
	err := withoutEcho(p.in.Fd(), func() error {
		var readErr error
		answer, readErr = p.readLine()
		return readErr
	})
	fmt.Fprintln(p.out)
	return answer, err
}

// IsTerminal reports whether the file is a terminal.
func IsTerminal(f *os.File) bool { return f != nil && isTerminal(f.Fd()) }
