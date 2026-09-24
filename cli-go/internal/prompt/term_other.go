//go:build !(linux || darwin || freebsd || netbsd || openbsd || dragonfly || windows)

package prompt

// isTerminal is false on platforms without a known terminal API, so the
// answers come from stdin lines.
func isTerminal(fd uintptr) bool { return false }

func withoutEcho(fd uintptr, read func() error) error { return read() }
