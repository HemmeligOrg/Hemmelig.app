//go:build windows

package prompt

import "syscall"

const enableEchoInput = 0x0004

var setConsoleMode = syscall.NewLazyDLL("kernel32.dll").NewProc("SetConsoleMode")

func isTerminal(fd uintptr) bool {
	var mode uint32
	return syscall.GetConsoleMode(syscall.Handle(fd), &mode) == nil
}

func withoutEcho(fd uintptr, read func() error) error {
	var mode uint32
	if err := syscall.GetConsoleMode(syscall.Handle(fd), &mode); err != nil {
		return read()
	}
	_, _, _ = setConsoleMode.Call(fd, uintptr(mode&^enableEchoInput))
	defer func() { _, _, _ = setConsoleMode.Call(fd, uintptr(mode)) }()
	return read()
}
