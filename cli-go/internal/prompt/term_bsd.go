//go:build darwin || freebsd || netbsd || openbsd || dragonfly

package prompt

import "syscall"

const (
	ioctlGetTermios = syscall.TIOCGETA
	ioctlSetTermios = syscall.TIOCSETA
)
