package htmltext

import "testing"

func TestToText(t *testing.T) {
	cases := map[string]string{
		"plain text\nsecond line":                          "plain text\nsecond line",
		"<p>user: admin</p><p>pass: s3cr3t &amp; more</p>": "user: admin\npass: s3cr3t & more",
		"<p><strong>API Key</strong></p><p>Key: abc</p>":   "API Key\nKey: abc",
		"<ul><li><p>one</p></li><li><p>two</p></li></ul>":  "- one\n- two",
		"<p>a<br>b</p>":                    "a\nb",
		"<pre><code>x &lt; y</code></pre>": "x < y",
	}
	for in, want := range cases {
		if got := ToText(in); got != want {
			t.Fatalf("ToText(%q) = %q, want %q", in, got, want)
		}
	}
}
