//go:build linux || darwin || freebsd || netbsd || openbsd || dragonfly

package prompt

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"unsafe"
)

func getTermios(fd uintptr) (*syscall.Termios, error) {
	var state syscall.Termios
	if _, _, errno := syscall.Syscall(syscall.SYS_IOCTL, fd, ioctlGetTermios, uintptr(unsafe.Pointer(&state))); errno != 0 {
		return nil, errno
	}
	return &state, nil
}

func setTermios(fd uintptr, state *syscall.Termios) {
	_, _, _ = syscall.Syscall(syscall.SYS_IOCTL, fd, ioctlSetTermios, uintptr(unsafe.Pointer(state)))
}

func isTerminal(fd uintptr) bool {
	_, err := getTermios(fd)
	return err == nil
}

func withoutEcho(fd uintptr, read func() error) error {
	old, err := getTermios(fd)
	if err != nil {
		return read()
	}
	quiet := *old
	quiet.Lflag &^= syscall.ECHO
	quiet.Lflag |= syscall.ICANON | syscall.ISIG
	quiet.Iflag |= syscall.ICRNL
	setTermios(fd, &quiet)
	defer setTermios(fd, old)

	// Ctrl+C must not leave the terminal without echo.
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	done := make(chan struct{})
	defer func() {
		signal.Stop(signals)
		close(done)
	}()
	go func() {
		select {
		case <-signals:
			setTermios(fd, old)
			fmt.Fprintln(os.Stderr)
			os.Exit(130)
		case <-done:
		}
	}()

	return read()
}
