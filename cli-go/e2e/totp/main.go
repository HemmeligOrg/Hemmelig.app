// Command totp prints the current TOTP code for an otpauth:// URI or a
// base32 secret. The e2e test uses it to turn on 2FA and to sign in with it.
//
//	go run ./e2e/totp 'otpauth://totp/Hemmelig:jane?secret=JBSWY3DPEHPK3PXP'
package main

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "usage: totp <otpauth URI or base32 secret>")
		os.Exit(2)
	}
	secret := os.Args[1]
	if strings.HasPrefix(secret, "otpauth://") {
		parsed, err := url.Parse(secret)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		secret = parsed.Query().Get("secret")
	}
	key, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimRight(secret, "=")))
	if err != nil {
		fmt.Fprintln(os.Stderr, "invalid base32 secret:", err)
		os.Exit(1)
	}
	counter := make([]byte, 8)
	binary.BigEndian.PutUint64(counter, uint64(time.Now().Unix()/30))
	mac := hmac.New(sha1.New, key)
	mac.Write(counter)
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	code := (binary.BigEndian.Uint32(sum[offset:offset+4]) & 0x7fffffff) % 1000000
	fmt.Printf("%06d\n", code)
}
