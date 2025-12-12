package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"golang.org/x/crypto/pbkdf2"
)

const version = "1.0.1"

var expirationTimes = map[string]int{
	"5m":  300,
	"30m": 1800,
	"1h":  3600,
	"4h":  14400,
	"12h": 43200,
	"1d":  86400,
	"3d":  259200,
	"7d":  604800,
	"14d": 1209600,
	"28d": 2419200,
}

type Options struct {
	Secret   string
	Title    string
	Password string
	Expires  string
	Views    int
	Burnable bool
	BaseURL  string
}

type SecretResponse struct {
	ID    string `json:"id"`
	Error string `json:"error,omitempty"`
}

func generateKey() string {
	b := make([]byte, 24)
	rand.Read(b)
	encoded := base64.URLEncoding.EncodeToString(b)
	if len(encoded) > 32 {
		return encoded[:32]
	}
	return encoded
}

func generateSalt() string {
	return generateKey()
}

func deriveKey(password, salt string) []byte {
	return pbkdf2.Key([]byte(password), []byte(salt), 600000, 32, sha256.New)
}

func encrypt(data []byte, encryptionKey, salt string) ([]byte, error) {
	key := deriveKey(encryptionKey, salt)

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	iv := make([]byte, 12)
	if _, err := rand.Read(iv); err != nil {
		return nil, err
	}

	ciphertext := aesGCM.Seal(nil, iv, data, nil)

	// Format: IV (12 bytes) + ciphertext (includes auth tag)
	result := make([]byte, len(iv)+len(ciphertext))
	copy(result, iv)
	copy(result[len(iv):], ciphertext)

	return result, nil
}

func uint8ArrayToObject(data []byte) map[string]int {
	obj := make(map[string]int)
	for i, b := range data {
		obj[strconv.Itoa(i)] = int(b)
	}
	return obj
}

func createSecret(opts Options) (string, error) {
	encryptionKey := opts.Password
	if encryptionKey == "" {
		encryptionKey = generateKey()
	}
	salt := generateSalt()

	encryptedSecret, err := encrypt([]byte(opts.Secret), encryptionKey, salt)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt secret: %w", err)
	}

	payload := map[string]interface{}{
		"secret":     uint8ArrayToObject(encryptedSecret),
		"salt":       salt,
		"expiresAt":  expirationTimes[opts.Expires],
		"views":      opts.Views,
		"isBurnable": opts.Burnable,
	}

	if opts.Title != "" {
		encryptedTitle, err := encrypt([]byte(opts.Title), encryptionKey, salt)
		if err != nil {
			return "", fmt.Errorf("failed to encrypt title: %w", err)
		}
		payload["title"] = uint8ArrayToObject(encryptedTitle)
	}

	if opts.Password != "" {
		payload["password"] = opts.Password
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal payload: %w", err)
	}

	resp, err := http.Post(
		opts.BaseURL+"/api/secrets",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", fmt.Errorf("failed to create secret: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var result SecretResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		errMsg := result.Error
		if errMsg == "" {
			errMsg = "Unknown error"
		}
		return "", fmt.Errorf("failed to create secret: %s", errMsg)
	}

	var url string
	if opts.Password != "" {
		url = fmt.Sprintf("%s/secret/%s", opts.BaseURL, result.ID)
	} else {
		url = fmt.Sprintf("%s/secret/%s#decryptionKey=%s", opts.BaseURL, result.ID, encryptionKey)
	}

	return url, nil
}

func printHelp() {
	fmt.Print(`
 _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \ '_ ` + "`" + ` _ \| '_ ` + "`" + ` _ \ / _ \ | |/ _` + "`" + ` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\___|_| |_| |_|_| |_| |_|\___|_|_|\__, |
                                         |___/
Create encrypted secrets from the command line

Usage:
  hemmelig <secret> [options]
  echo "secret" | hemmelig [options]
  hemmelig --help

Options:
  -t, --title <title>      Set a title for the secret
  -p, --password <pass>    Protect with a password (if not set, key is in URL)
  -e, --expires <time>     Expiration time (default: 1d)
                           Valid: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 28d
  -v, --views <number>     Max views before deletion (default: 1, max: 9999)
  -b, --burnable           Burn after first view (default: true)
  --no-burnable            Don't burn after first view
  -u, --url <url>          Base URL (default: https://hemmelig.app)
  -h, --help, /?           Show this help message
  --version                Show version number

Examples:
  # Create a simple secret
  hemmelig "my secret message"

  # Create a secret with a title and 7-day expiration
  hemmelig "my secret" -t "API Key" -e 7d

  # Create a password-protected secret
  hemmelig "my secret" -p "mypassword123"

  # Create a secret with 5 views allowed
  hemmelig "my secret" -v 5

  # Pipe content from a file
  cat ~/.ssh/id_rsa.pub | hemmelig -t "SSH Public Key"

  # Use a self-hosted instance
  hemmelig "my secret" -u https://secrets.mycompany.com
`)
}

func readStdin() string {
	stat, _ := os.Stdin.Stat()
	if (stat.Mode() & os.ModeCharDevice) != 0 {
		return ""
	}

	data, err := io.ReadAll(os.Stdin)
	if err != nil {
		return ""
	}

	return strings.TrimRight(string(data), "\n\r")
}

func parseArgs(args []string) (Options, bool, bool) {
	opts := Options{
		Expires:  "1d",
		Views:    1,
		Burnable: true,
		BaseURL:  "https://hemmelig.app",
	}

	showHelp := false
	showVersion := false

	for i := 0; i < len(args); i++ {
		arg := args[i]

		switch arg {
		case "-h", "--help", "/?":
			showHelp = true
		case "--version":
			showVersion = true
		case "-t", "--title":
			if i+1 < len(args) {
				i++
				opts.Title = args[i]
			}
		case "-p", "--password":
			if i+1 < len(args) {
				i++
				opts.Password = args[i]
			}
		case "-e", "--expires":
			if i+1 < len(args) {
				i++
				opts.Expires = args[i]
			}
		case "-v", "--views":
			if i+1 < len(args) {
				i++
				v, err := strconv.Atoi(args[i])
				if err == nil {
					opts.Views = v
				}
			}
		case "-b", "--burnable":
			opts.Burnable = true
		case "--no-burnable":
			opts.Burnable = false
		case "-u", "--url":
			if i+1 < len(args) {
				i++
				opts.BaseURL = args[i]
			}
		default:
			if !strings.HasPrefix(arg, "-") && opts.Secret == "" {
				opts.Secret = arg
			}
		}
	}

	return opts, showHelp, showVersion
}

func main() {
	opts, showHelp, showVersion := parseArgs(os.Args[1:])

	if showVersion {
		fmt.Println(version)
		os.Exit(0)
	}

	if showHelp {
		printHelp()
		os.Exit(0)
	}

	if opts.Secret == "" {
		opts.Secret = readStdin()
	}

	if opts.Secret == "" {
		fmt.Fprintln(os.Stderr, "Error: No secret provided. Use --help for usage information.")
		os.Exit(1)
	}

	if _, ok := expirationTimes[opts.Expires]; !ok {
		fmt.Fprintf(os.Stderr, "Error: Invalid expiration time \"%s\".\n", opts.Expires)
		fmt.Fprintln(os.Stderr, "Valid options: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 28d")
		os.Exit(1)
	}

	if opts.Views < 1 || opts.Views > 9999 {
		fmt.Fprintln(os.Stderr, "Error: Views must be between 1 and 9999.")
		os.Exit(1)
	}

	url, err := createSecret(opts)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(url)
}
