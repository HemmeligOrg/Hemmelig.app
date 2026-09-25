package links

import "testing"

const id = "fd54ec88-0239-4868-8dc6-48d8e5979133"

func TestParseSecret(t *testing.T) {
	cases := []struct {
		in   string
		want Secret
	}{
		{"https://h.example/s/" + id + "#abc", Secret{"https://h.example", id, "abc"}},
		{"https://h.example/secret/" + id + "#decryptionKey=abc", Secret{"https://h.example", id, "abc"}},
		{"http://localhost:5173/secret/" + id, Secret{"http://localhost:5173", id, ""}},
		{"https://h.example/prefix/s/" + id + "#k", Secret{"https://h.example/prefix", id, "k"}},
		{id, Secret{"", id, ""}},
	}
	for _, c := range cases {
		got, err := ParseSecret(c.in)
		if err != nil {
			t.Fatalf("%s: %v", c.in, err)
		}
		if got != c.want {
			t.Fatalf("%s: got %+v, want %+v", c.in, got, c.want)
		}
	}

	for _, bad := range []string{"", "hello", "https://h.example/other/" + id, "https://h.example/s/not-an-id"} {
		if _, err := ParseSecret(bad); err == nil {
			t.Fatalf("%q must fail", bad)
		}
	}
}

func TestParseRequest(t *testing.T) {
	got, err := ParseRequest("https://h.example/request/" + id + "#token=tok")
	if err != nil || got != (Request{"https://h.example", id, "tok"}) {
		t.Fatalf("got %+v, %v", got, err)
	}
	legacy, err := ParseRequest("https://h.example/request/" + id + "?token=tok")
	if err != nil || legacy.Token != "tok" {
		t.Fatalf("legacy: got %+v, %v", legacy, err)
	}
	if _, err := ParseRequest("https://h.example/request/" + id); err == nil {
		t.Fatal("a link without a token must fail")
	}
}

func TestBuildLinks(t *testing.T) {
	if got := SecretLink("https://h.example/", id, "k"); got != "https://h.example/s/"+id+"#k" {
		t.Fatal(got)
	}
	if got := SecretLink("https://h.example", id, ""); got != "https://h.example/s/"+id {
		t.Fatal(got)
	}
	if got := RequestLink("https://h.example", id, "t"); got != "https://h.example/request/"+id+"#token=t" {
		t.Fatal(got)
	}
}

func TestNormalizeBaseURL(t *testing.T) {
	got, err := NormalizeBaseURL("https://h.example/")
	if err != nil || got != "https://h.example" {
		t.Fatalf("got %q, %v", got, err)
	}
	if _, err := NormalizeBaseURL("h.example"); err == nil {
		t.Fatal("a URL without a scheme must fail")
	}
}
