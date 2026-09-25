package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestConfigFilePermissions(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HEMMELIG_CONFIG_DIR", filepath.Join(dir, "hemmelig"))

	cfg := &Config{URL: "https://h.example", APIKey: "hemmelig_x"}
	if err := cfg.Save(); err != nil {
		t.Fatal(err)
	}
	path, _ := Path()
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("config mode %v, want 0600", info.Mode().Perm())
	}

	loaded, err := Load()
	if err != nil || loaded.APIKey != "hemmelig_x" || loaded.URL != "https://h.example" {
		t.Fatalf("load: %+v %v", loaded, err)
	}
}

func TestDeleteTokens(t *testing.T) {
	t.Setenv("HEMMELIG_CONFIG_DIR", t.TempDir())
	if DeleteToken("https://h.example", "id") != "" {
		t.Fatal("no token expected")
	}
	if err := SaveDeleteToken("https://h.example", "id", "tok"); err != nil {
		t.Fatal(err)
	}
	if DeleteToken("https://h.example", "id") != "tok" {
		t.Fatal("token not stored")
	}
	if DeleteToken("https://other.example", "id") != "" {
		t.Fatal("tokens must be per instance")
	}
	if err := ForgetDeleteToken("https://h.example", "id"); err != nil || DeleteToken("https://h.example", "id") != "" {
		t.Fatal("token not removed")
	}
}
