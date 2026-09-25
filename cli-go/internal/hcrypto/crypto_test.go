package hcrypto

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type textVector struct {
	Key           string `json:"key"`
	Salt          string `json:"salt"`
	Plaintext     string `json:"plaintext"`
	CiphertextHex string `json:"ciphertextHex"`
}

type fileVector struct {
	Key           string `json:"key"`
	Salt          string `json:"salt"`
	PlaintextHex  string `json:"plaintextHex"`
	CiphertextHex string `json:"ciphertextHex"`
}

type verifierVector struct {
	Password string `json:"password"`
	Salt     string `json:"salt"`
	Verifier string `json:"verifier"`
}

type vectors struct {
	Text      []textVector     `json:"text"`
	Files     []fileVector     `json:"files"`
	Verifiers []verifierVector `json:"verifiers"`
}

func loadVectors(t *testing.T) vectors {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("..", "..", "testdata", "vectors.json"))
	if err != nil {
		t.Fatalf("read vectors: %v", err)
	}
	var v vectors
	if err := json.Unmarshal(data, &v); err != nil {
		t.Fatalf("parse vectors: %v", err)
	}
	return v
}

// TestDecryptWebVectors checks that Go decrypts what the web app encrypted.
func TestDecryptWebVectors(t *testing.T) {
	v := loadVectors(t)
	ciphers := map[string]*Cipher{}
	cipherFor := func(key, salt string) *Cipher {
		id := key + "|" + salt
		if c, ok := ciphers[id]; ok {
			return c
		}
		c, err := NewCipher(key, salt)
		if err != nil {
			t.Fatalf("new cipher: %v", err)
		}
		ciphers[id] = c
		return c
	}

	for _, vector := range v.Text {
		message, err := hex.DecodeString(vector.CiphertextHex)
		if err != nil {
			t.Fatalf("decode hex: %v", err)
		}
		got, err := cipherFor(vector.Key, vector.Salt).DecryptString(message)
		if err != nil {
			t.Fatalf("decrypt %q: %v", vector.Plaintext, err)
		}
		if got != vector.Plaintext {
			t.Fatalf("got %q, want %q", got, vector.Plaintext)
		}
	}

	for _, vector := range v.Files {
		message, _ := hex.DecodeString(vector.CiphertextHex)
		want, _ := hex.DecodeString(vector.PlaintextHex)
		got, err := cipherFor(vector.Key, vector.Salt).Decrypt(message)
		if err != nil {
			t.Fatalf("decrypt file: %v", err)
		}
		if !bytes.Equal(got, want) {
			t.Fatal("file bytes do not match")
		}
	}
}

// TestVerifierMatchesWeb checks the password verifier against the web app.
func TestVerifierMatchesWeb(t *testing.T) {
	for _, vector := range loadVectors(t).Verifiers {
		if got := PasswordVerifier(vector.Password, vector.Salt); got != vector.Verifier {
			t.Fatalf("verifier %s, want %s", got, vector.Verifier)
		}
	}
}

func TestWrongKeyFails(t *testing.T) {
	v := loadVectors(t)
	message, _ := hex.DecodeString(v.Text[0].CiphertextHex)
	c, err := NewCipher("wrong-key-wrong-key-wrong-key-xx", v.Text[0].Salt)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := c.Decrypt(message); err != ErrDecrypt {
		t.Fatalf("got %v, want ErrDecrypt", err)
	}
	if _, err := c.Decrypt([]byte{1, 2, 3}); err != ErrDecrypt {
		t.Fatalf("short message: got %v, want ErrDecrypt", err)
	}
}

func TestRandomString(t *testing.T) {
	a, err := GenerateKey()
	if err != nil {
		t.Fatal(err)
	}
	b, _ := GenerateKey()
	if len(a) != KeyLength || a == b {
		t.Fatalf("unexpected keys %q %q", a, b)
	}
	for _, r := range a {
		if !bytes.ContainsRune([]byte(alphabet), r) {
			t.Fatalf("character %q is not URL safe", r)
		}
	}
}

func TestHexToBytes(t *testing.T) {
	if _, ok := HexToBytes(""); ok {
		t.Fatal("empty input must fail")
	}
	if _, ok := HexToBytes("abc"); ok {
		t.Fatal("odd length must fail")
	}
	if _, ok := HexToBytes("zz"); ok {
		t.Fatal("non-hex must fail")
	}
	if b, ok := HexToBytes("0aff"); !ok || !bytes.Equal(b, []byte{0x0a, 0xff}) {
		t.Fatal("valid hex must decode")
	}
}

// TestWriteGoVectors writes vectors made by Go, for the web code to check.
// Run it with HEMMELIG_WRITE_GO_VECTORS=<path>. The e2e script does this.
func TestWriteGoVectors(t *testing.T) {
	path := os.Getenv("HEMMELIG_WRITE_GO_VECTORS")
	if path == "" {
		t.Skip("set HEMMELIG_WRITE_GO_VECTORS to write Go vectors")
	}
	key, _ := GenerateKey()
	salt, _ := GenerateSalt()
	password := "go password 123"

	keyCipher, err := NewCipher(key, salt)
	if err != nil {
		t.Fatal(err)
	}
	passwordCipher, err := NewCipher(password, salt)
	if err != nil {
		t.Fatal(err)
	}

	out := vectors{}
	for _, text := range []string{"Hello from Go", "", "Unicode: æøå 秘密 🔐"} {
		message, _ := keyCipher.EncryptString(text)
		out.Text = append(out.Text, textVector{key, salt, text, hex.EncodeToString(message)})
	}
	message, _ := passwordCipher.EncryptString("password protected from Go")
	out.Text = append(out.Text, textVector{password, salt, "password protected from Go", hex.EncodeToString(message)})

	file := make([]byte, 300)
	for i := range file {
		file[i] = byte(i * 7)
	}
	encryptedFile, _ := keyCipher.Encrypt(file)
	out.Files = append(out.Files, fileVector{key, salt, hex.EncodeToString(file), hex.EncodeToString(encryptedFile)})
	out.Verifiers = append(out.Verifiers, verifierVector{password, salt, passwordCipher.Verifier()})

	data, _ := json.MarshalIndent(out, "", "  ")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatal(err)
	}
}
