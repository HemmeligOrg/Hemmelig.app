package api

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBytesRoundTrip(t *testing.T) {
	in := Bytes{0, 1, 255, 10, 42}
	data, err := json.Marshal(in)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != `{"0":0,"1":1,"2":255,"3":10,"4":42}` {
		t.Fatalf("unexpected JSON %s", data)
	}
	var out Bytes
	if err := json.Unmarshal(data, &out); err != nil || !bytes.Equal(out, in) {
		t.Fatalf("round trip failed: %v %v", out, err)
	}
}

func TestBytesOtherForms(t *testing.T) {
	var buffer Bytes
	if err := json.Unmarshal([]byte(`{"type":"Buffer","data":[1,2,3]}`), &buffer); err != nil || !bytes.Equal(buffer, []byte{1, 2, 3}) {
		t.Fatalf("buffer form: %v %v", buffer, err)
	}
	var array Bytes
	if err := json.Unmarshal([]byte(`[4,5]`), &array); err != nil || !bytes.Equal(array, []byte{4, 5}) {
		t.Fatalf("array form: %v %v", array, err)
	}
	// Keys must sort by number, not as strings.
	var object Bytes
	if err := json.Unmarshal([]byte(`{"10":10,"2":2,"0":0,"1":1,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9}`), &object); err != nil || object[10] != 10 || object[2] != 2 {
		t.Fatalf("object order: %v %v", object, err)
	}
	var empty Bytes
	if err := json.Unmarshal([]byte(`{}`), &empty); err != nil || len(empty) != 0 {
		t.Fatalf("empty object: %v %v", empty, err)
	}
}

func TestErrorMessages(t *testing.T) {
	cases := map[string]string{
		`{"error":"Secret not found"}`: "Secret not found",
		`{"success":false,"error":{"issues":[{"message":"Invalid expiration time"}],"name":"ZodError"}}`: "Invalid expiration time",
		`{"error":{"name":"ZodError","message":"[{\"message\":\"Too small\"}]"}}`:                        "Too small",
		`plain text`: "plain text",
	}
	for body, want := range cases {
		if got := errorMessage([]byte(body)); got != want {
			t.Fatalf("errorMessage(%s) = %q, want %q", body, got, want)
		}
	}
}

func TestAuthHeaders(t *testing.T) {
	var gotAuth, gotCookie, gotOrigin string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotCookie = r.Header.Get("Cookie")
		gotOrigin = r.Header.Get("Origin")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error":"Secret not found"}`))
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, APIKey: "hemmelig_x", Cookie: "session=1"}
	err := c.Get(context.Background(), "/api/secrets", nil, nil)
	if StatusOf(err) != http.StatusNotFound || err.Error() != "Secret not found (status 404)" {
		t.Fatalf("unexpected error %v", err)
	}
	if gotAuth != "Bearer hemmelig_x" || gotCookie != "session=1" || gotOrigin != server.URL {
		t.Fatalf("headers: %q %q %q", gotAuth, gotCookie, gotOrigin)
	}
}

func TestBodylessUnsafeRequestSendsJSON(t *testing.T) {
	var contentType, body string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		contentType = r.Header.Get("Content-Type")
		data, _ := io.ReadAll(r.Body)
		body = string(data)
	}))
	defer server.Close()

	c := &Client{BaseURL: server.URL, Cookie: "session=1"}
	if err := c.Do(context.Background(), Request{Method: http.MethodDelete, Path: "/api/api-keys/x"}, nil); err != nil {
		t.Fatal(err)
	}
	if contentType != "application/json" || body != "{}" {
		t.Fatalf("a DELETE must pass the CSRF check: %q %q", contentType, body)
	}
}

func TestSessionCookieRotation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{Name: "better-auth.session_token", Value: "new"})
		http.SetCookie(w, &http.Cookie{Name: "better-auth.session_data", Value: "", MaxAge: -1})
	}))
	defer server.Close()

	stored := ""
	c := &Client{BaseURL: server.URL, Cookie: "better-auth.session_token=old; better-auth.session_data=cache", OnCookie: func(v string) { stored = v }}
	if err := c.Get(context.Background(), "/x", nil, nil); err != nil {
		t.Fatal(err)
	}
	if c.Cookie != "better-auth.session_token=new" || stored != c.Cookie {
		t.Fatalf("cookie %q stored %q", c.Cookie, stored)
	}
}
