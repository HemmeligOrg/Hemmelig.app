package service

import (
	"bytes"
	"context"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/HemmeligOrg/hemmelig-cli/internal/api"
	"github.com/HemmeligOrg/hemmelig-cli/internal/hcrypto"
	"github.com/HemmeligOrg/hemmelig-cli/internal/links"
)

// FileInput is a file to attach to a new secret.
type FileInput struct {
	Name string
	Data []byte
}

// CreateSecretInput describes a new secret.
type CreateSecretInput struct {
	Text  string
	Title string
	// ExpiresIn is the lifetime in seconds. Use a value from Expirations.
	ExpiresIn int
	// Views is the view limit. It is ignored when NoViewLimit is true.
	Views int
	// NoViewLimit keeps the secret until it expires, however many times
	// people open it. The web app calls this "Burn after time".
	NoViewLimit bool
	// Burnable sends the "burned" webhook when the last view is used.
	Burnable bool
	Password string
	IPRange  string
	Files    []FileInput
}

// CreateSecretResult is the created secret.
type CreateSecretResult struct {
	ID                string   `json:"id"`
	Link              string   `json:"link"`
	ExpiresIn         string   `json:"expiresIn"`
	Views             *int     `json:"views"`
	PasswordProtected bool     `json:"passwordProtected"`
	IPRange           string   `json:"ipRange,omitempty"`
	Files             []string `json:"files"`
	CanDelete         bool     `json:"canDelete"`
}

type attachedFile struct {
	ID    string `json:"id"`
	Token string `json:"token"`
}

// CreateSecret encrypts the input locally and stores the ciphertext.
func (s *Service) CreateSecret(ctx context.Context, in CreateSecretInput) (*CreateSecretResult, error) {
	if !in.NoViewLimit && (in.Views < 1 || in.Views > 9999) {
		return nil, errors.New("views must be between 1 and 9999")
	}
	if in.Password != "" && len(in.Password) < 5 {
		return nil, errors.New("the password must have at least 5 characters")
	}

	key := in.Password
	if key == "" {
		generated, err := hcrypto.GenerateKey()
		if err != nil {
			return nil, err
		}
		key = generated
	}
	salt, err := hcrypto.GenerateSalt()
	if err != nil {
		return nil, err
	}
	cipher, err := hcrypto.NewCipher(key, salt)
	if err != nil {
		return nil, err
	}

	encryptedText, err := cipher.EncryptString(in.Text)
	if err != nil {
		return nil, err
	}

	payload := map[string]any{
		"secret":     api.Bytes(encryptedText),
		"salt":       salt,
		"expiresAt":  in.ExpiresIn,
		"isBurnable": in.Burnable && !in.NoViewLimit,
	}
	if in.NoViewLimit {
		payload["views"] = nil
	} else {
		payload["views"] = in.Views
	}
	if in.Title != "" {
		encryptedTitle, err := cipher.EncryptString(in.Title)
		if err != nil {
			return nil, err
		}
		payload["title"] = api.Bytes(encryptedTitle)
	}
	if in.Password != "" {
		payload["passwordVerifier"] = cipher.Verifier()
	}
	if in.IPRange != "" {
		payload["ipRange"] = in.IPRange
	}

	fileNames := make([]string, 0, len(in.Files))
	if len(in.Files) > 0 {
		attached := make([]attachedFile, 0, len(in.Files))
		for _, file := range in.Files {
			uploaded, err := s.uploadFile(ctx, cipher, file)
			if err != nil {
				return nil, fmt.Errorf("upload %s: %w", file.Name, err)
			}
			attached = append(attached, uploaded)
			fileNames = append(fileNames, file.Name)
		}
		payload["files"] = attached
	}

	var created struct {
		ID          string `json:"id"`
		DeleteToken string `json:"deleteToken"`
	}
	if err := s.API.Send(ctx, http.MethodPost, "/api/secrets", payload, &created); err != nil {
		return nil, err
	}
	s.saveToken(s.API.BaseURL, created.ID, created.DeleteToken)

	linkKey := key
	if in.Password != "" {
		// A password-protected link never carries the key.
		linkKey = ""
	}

	result := &CreateSecretResult{
		ID:                created.ID,
		Link:              links.SecretLink(s.API.BaseURL, created.ID, linkKey),
		ExpiresIn:         ExpirationName(in.ExpiresIn),
		PasswordProtected: in.Password != "",
		IPRange:           in.IPRange,
		Files:             fileNames,
		CanDelete:         created.DeleteToken != "",
	}
	if !in.NoViewLimit {
		views := in.Views
		result.Views = &views
	}
	return result, nil
}

// uploadFile encrypts a file and its name and streams it to the server.
func (s *Service) uploadFile(ctx context.Context, cipher *hcrypto.Cipher, file FileInput) (attachedFile, error) {
	encrypted, err := cipher.Encrypt(file.Data)
	if err != nil {
		return attachedFile{}, err
	}
	encryptedName, err := cipher.EncryptString(file.Name)
	if err != nil {
		return attachedFile{}, err
	}

	var uploaded attachedFile
	err = s.API.Do(ctx, api.Request{
		Method:        http.MethodPost,
		Path:          "/api/files",
		Body:          bytes.NewReader(encrypted),
		ContentLength: int64(len(encrypted)),
		ContentType:   "application/octet-stream",
		Headers:       map[string]string{"X-Hemmelig-File-Name": hex.EncodeToString(encryptedName)},
	}, &uploaded)
	if api.StatusOf(err) == http.StatusUnauthorized {
		return attachedFile{}, errors.New("file attachments need an API key or a session: run hemmelig login or set HEMMELIG_API_KEY")
	}
	if err != nil {
		return attachedFile{}, err
	}
	return uploaded, nil
}

// ReadSecretInput describes a secret to open. Opening a secret uses a view.
type ReadSecretInput struct {
	// Ref is a secret link or a secret ID.
	Ref string
	// Key overrides the key in the link.
	Key      string
	Password string
	// SkipFiles does not download the attachments.
	SkipFiles bool
}

// SecretFile is a decrypted attachment.
type SecretFile struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Size int    `json:"size"`
	Data []byte `json:"-"`
}

// ReadSecretResult is a decrypted secret.
type ReadSecretResult struct {
	ID             string       `json:"id"`
	Title          string       `json:"title"`
	Content        string       `json:"content"`
	ViewsRemaining *int         `json:"viewsRemaining"`
	ExpiresAt      string       `json:"expiresAt,omitempty"`
	Files          []SecretFile `json:"files"`
	CanDelete      bool         `json:"canDelete"`
}

type checkResponse struct {
	Views               *int   `json:"views"`
	IsPasswordProtected bool   `json:"isPasswordProtected"`
	PasswordScheme      string `json:"passwordScheme"`
	Salt                string `json:"salt"`
}

type revealResponse struct {
	ID          string    `json:"id"`
	Secret      api.Bytes `json:"secret"`
	Title       api.Bytes `json:"title"`
	Salt        string    `json:"salt"`
	Views       *int      `json:"views"`
	ExpiresAt   string    `json:"expiresAt"`
	DeleteToken string    `json:"deleteToken"`
	Files       []struct {
		ID       string `json:"id"`
		Filename string `json:"filename"`
		Token    string `json:"token"`
	} `json:"files"`
}

// ReadSecret opens a secret, decrypts it locally and downloads its files.
func (s *Service) ReadSecret(ctx context.Context, in ReadSecretInput) (*ReadSecretResult, error) {
	ref, err := parseSecretRef(in.Ref)
	if err != nil {
		return nil, err
	}
	client := s.clientFor(ref.BaseURL)
	path := "/api/secrets/" + url.PathEscape(ref.ID)

	var check checkResponse
	if err := client.Get(ctx, path+"/check", nil, &check); err != nil {
		return nil, notFound(err)
	}

	key := in.Key
	if key == "" {
		key = ref.Key
	}
	body := map[string]any{}
	if check.IsPasswordProtected {
		if in.Password == "" {
			return nil, ErrPasswordRequired
		}
		key = in.Password
		if check.PasswordScheme == "legacy" {
			// Secrets from older clients still compare the password on the server.
			body["password"] = in.Password
		} else {
			body["passwordVerifier"] = hcrypto.PasswordVerifier(in.Password, check.Salt)
		}
	}
	if key == "" {
		return nil, ErrNoKey
	}

	var reveal revealResponse
	if err := client.Send(ctx, http.MethodPost, path, body, &reveal); err != nil {
		if api.StatusOf(err) == http.StatusUnauthorized {
			return nil, errors.New("wrong password")
		}
		return nil, notFound(err)
	}
	s.saveToken(client.BaseURL, ref.ID, reveal.DeleteToken)

	cipher, err := hcrypto.NewCipher(key, reveal.Salt)
	if err != nil {
		return nil, err
	}
	content, err := cipher.DecryptString(reveal.Secret)
	if err != nil {
		return nil, fmt.Errorf("%w (the reveal used a view)", err)
	}

	result := &ReadSecretResult{
		ID:             ref.ID,
		Content:        content,
		ViewsRemaining: reveal.Views,
		ExpiresAt:      reveal.ExpiresAt,
		Files:          []SecretFile{},
		CanDelete:      reveal.DeleteToken != "",
	}
	if len(reveal.Title) > 0 {
		if title, err := cipher.DecryptString(reveal.Title); err == nil {
			result.Title = title
		}
	}

	for _, file := range reveal.Files {
		name := fileDisplayName(cipher, file.ID, file.Filename)
		entry := SecretFile{ID: file.ID, Name: name}
		if !in.SkipFiles {
			data, err := s.downloadFile(ctx, client, cipher, file.ID, file.Token)
			if err != nil {
				return nil, fmt.Errorf("download %s: %w", name, err)
			}
			entry.Data = data
			entry.Size = len(data)
		}
		result.Files = append(result.Files, entry)
	}
	return result, nil
}

// fileDisplayName decrypts the stored file name. Files from older clients
// store "<file id>-<plaintext name>".
func fileDisplayName(cipher *hcrypto.Cipher, id, stored string) string {
	if encrypted, ok := hcrypto.HexToBytes(stored); ok {
		if name, err := cipher.DecryptString(encrypted); err == nil {
			return name
		}
	}
	return strings.TrimPrefix(stored, id+"-")
}

func (s *Service) downloadFile(ctx context.Context, client *api.Client, cipher *hcrypto.Cipher, id, token string) ([]byte, error) {
	resp, err := client.Raw(ctx, api.Request{
		Method:  http.MethodGet,
		Path:    "/api/files/" + url.PathEscape(id),
		Headers: map[string]string{"X-Hemmelig-File-Token": token},
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.Status != http.StatusOK {
		return nil, &api.Error{Status: resp.Status, Message: "file download failed"}
	}
	return cipher.Decrypt(data)
}

// SecretSummary is one secret in a list. The server knows only metadata.
type SecretSummary struct {
	ID                  string `json:"id"`
	CreatedAt           string `json:"createdAt"`
	ExpiresAt           string `json:"expiresAt"`
	Views               *int   `json:"views"`
	IsPasswordProtected bool   `json:"isPasswordProtected"`
	IPRange             string `json:"ipRange"`
	IsBurnable          bool   `json:"isBurnable"`
	FileCount           int    `json:"fileCount"`
}

// Page is the pagination data of a list.
type Page struct {
	Total      int `json:"total"`
	Page       int `json:"page"`
	TotalPages int `json:"totalPages"`
}

// SecretList is one page of secrets.
type SecretList struct {
	Data []SecretSummary `json:"data"`
	Meta Page            `json:"meta"`
}

// ListSecrets lists the secrets of the signed-in user.
func (s *Service) ListSecrets(ctx context.Context, page, limit int) (*SecretList, error) {
	query := url.Values{}
	if page > 0 {
		query.Set("page", strconv.Itoa(page))
	}
	if limit > 0 {
		query.Set("limit", strconv.Itoa(limit))
	}
	var list SecretList
	if err := s.API.Get(ctx, "/api/secrets", query, &list); err != nil {
		return nil, err
	}
	if list.Data == nil {
		list.Data = []SecretSummary{}
	}
	return &list, nil
}

// DeleteSecret deletes a secret. It uses a stored delete token when this
// CLI created or opened the secret, and owner authentication otherwise.
func (s *Service) DeleteSecret(ctx context.Context, refValue string) error {
	ref, err := parseSecretRef(refValue)
	if err != nil {
		return err
	}
	client := s.clientFor(ref.BaseURL)

	headers := map[string]string{}
	if s.Tokens != nil {
		if token := s.Tokens.Get(client.BaseURL, ref.ID); token != "" {
			headers["X-Hemmelig-Delete-Token"] = token
		}
	}
	err = client.Do(ctx, api.Request{
		Method:  http.MethodDelete,
		Path:    "/api/secrets/" + url.PathEscape(ref.ID),
		Headers: headers,
	}, nil)
	if err != nil {
		return notFound(err)
	}
	if s.Tokens != nil {
		_ = s.Tokens.Forget(client.BaseURL, ref.ID)
	}
	return nil
}

func notFound(err error) error {
	if status := api.StatusOf(err); status == http.StatusNotFound || status == http.StatusGone {
		return fmt.Errorf("secret not found: it was viewed, expired or deleted (%w)", err)
	}
	return err
}
