// Package hcrypto implements the Hemmelig encryption scheme.
//
// The scheme matches src/lib/crypto.ts in the web app:
//   - PBKDF2 with SHA-256 and 1,300,000 iterations derives a 256-bit key from
//     the secret key (or the password) and the salt.
//   - AES-256-GCM encrypts the data with a random 96-bit IV.
//   - The encrypted message is the IV followed by the ciphertext and the tag.
//   - The password verifier is the hex SHA-256 digest of the derived key.
package hcrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"golang.org/x/crypto/pbkdf2"
)

const (
	// Iterations is the PBKDF2 iteration count of the web app.
	Iterations = 1300000
	// KeyLength is the length of a generated key and of a generated salt.
	KeyLength = 32
	ivLength  = 12
	// alphabet is the URL-safe alphabet of nanoid, which the web app uses.
	alphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"
)

// ErrDecrypt means that the key, the password or the data is wrong.
var ErrDecrypt = errors.New("could not decrypt: the key or password is wrong, or the data is damaged")

// RandomString returns n random characters from the nanoid alphabet.
func RandomString(n int) (string, error) {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}
	out := make([]byte, n)
	for i, b := range buf {
		// The alphabet has 64 characters, so the low 6 bits select one uniformly.
		out[i] = alphabet[b&63]
	}
	return string(out), nil
}

// GenerateKey returns a new random 32-character secret key.
func GenerateKey() (string, error) { return RandomString(KeyLength) }

// GenerateSalt returns a new random 32-character salt.
func GenerateSalt() (string, error) { return RandomString(KeyLength) }

// DeriveKey derives the 256-bit AES key from a secret key or a password.
func DeriveKey(secret, salt string) []byte {
	return pbkdf2.Key([]byte(secret), []byte(salt), Iterations, 32, sha256.New)
}

// PasswordVerifier returns the value that the server stores for a
// password-protected secret. The server never sees the password or the key.
func PasswordVerifier(password, salt string) string {
	return VerifierFromKey(DeriveKey(password, salt))
}

// VerifierFromKey returns the password verifier for an already derived key.
func VerifierFromKey(derived []byte) string {
	sum := sha256.Sum256(derived)
	return hex.EncodeToString(sum[:])
}

// Cipher encrypts and decrypts with one derived key. Derive the key once per
// secret, because PBKDF2 with this iteration count is slow on purpose.
type Cipher struct {
	aead    cipher.AEAD
	derived []byte
}

// NewCipher derives the key for secret and salt and returns a Cipher.
func NewCipher(secret, salt string) (*Cipher, error) {
	return NewCipherFromKey(DeriveKey(secret, salt))
}

// NewCipherFromKey returns a Cipher for a derived 32-byte key.
func NewCipherFromKey(derived []byte) (*Cipher, error) {
	block, err := aes.NewCipher(derived)
	if err != nil {
		return nil, fmt.Errorf("create AES cipher: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create GCM: %w", err)
	}
	return &Cipher{aead: aead, derived: derived}, nil
}

// Verifier returns the password verifier for the key of this Cipher.
func (c *Cipher) Verifier() string { return VerifierFromKey(c.derived) }

// Encrypt returns the IV followed by the ciphertext and the tag.
func (c *Cipher) Encrypt(plain []byte) ([]byte, error) {
	iv := make([]byte, ivLength)
	if _, err := rand.Read(iv); err != nil {
		return nil, fmt.Errorf("read random IV: %w", err)
	}
	out := make([]byte, ivLength, ivLength+len(plain)+c.aead.Overhead())
	copy(out, iv)
	return c.aead.Seal(out, iv, plain, nil), nil
}

// Decrypt reverses Encrypt.
func (c *Cipher) Decrypt(message []byte) ([]byte, error) {
	if len(message) < ivLength+c.aead.Overhead() {
		return nil, ErrDecrypt
	}
	plain, err := c.aead.Open(nil, message[:ivLength], message[ivLength:], nil)
	if err != nil {
		return nil, ErrDecrypt
	}
	return plain, nil
}

// EncryptString encrypts UTF-8 text.
func (c *Cipher) EncryptString(text string) ([]byte, error) { return c.Encrypt([]byte(text)) }

// DecryptString decrypts to UTF-8 text.
func (c *Cipher) DecryptString(message []byte) (string, error) {
	plain, err := c.Decrypt(message)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}

// HexToBytes decodes a hex string. It returns false for empty or invalid input,
// like hexToBytes in the web app.
func HexToBytes(value string) ([]byte, bool) {
	if value == "" || len(value)%2 != 0 {
		return nil, false
	}
	out, err := hex.DecodeString(value)
	if err != nil {
		return nil, false
	}
	return out, true
}
