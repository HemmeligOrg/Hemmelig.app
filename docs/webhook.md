# Webhook Notifications

Hemmelig can send HTTP POST requests to your webhook URL when secrets are viewed or burned. This allows you to integrate with external services like Slack, Discord, monitoring systems, or custom applications.

## Configuration

Configure webhooks in the admin dashboard under **Instance Settings → Webhooks**.

| Setting             | Description                                |
| ------------------- | ------------------------------------------ |
| **Enable Webhooks** | Turn webhook notifications on/off          |
| **Webhook URL**     | The endpoint where payloads are sent       |
| **Webhook Secret**  | Secret key for HMAC-SHA256 payload signing |
| **Secret Viewed**   | Send webhook when a secret is viewed       |
| **Secret Burned**   | Send webhook when a secret is deleted      |

## Webhook Payload

Webhooks are sent as HTTP POST requests with a JSON body:

### Secret Events

```json
{
    "event": "secret.viewed",
    "timestamp": "2024-12-04T10:30:00.000Z",
    "data": {
        "secretId": "abc123-def456",
        "hasPassword": true,
        "hasIpRestriction": false,
        "viewsRemaining": 2
    }
}
```

### API Key Events

```json
{
    "event": "apikey.created",
    "timestamp": "2024-12-04T10:30:00.000Z",
    "data": {
        "apiKeyId": "key-uuid-here",
        "name": "My Integration",
        "expiresAt": "2025-12-04T10:30:00.000Z",
        "userId": "user-uuid-here"
    }
}
```

### Event Types

| Event            | Description                                        |
| ---------------- | -------------------------------------------------- |
| `secret.viewed`  | A secret was successfully viewed                   |
| `secret.burned`  | A secret was deleted (manually or after last view) |
| `apikey.created` | A new API key was created                          |

### Headers

| Header                 | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `Content-Type`         | `application/json`                                                 |
| `X-Hemmelig-Event`     | Event type (`secret.viewed`, `secret.burned`, or `apikey.created`) |
| `X-Hemmelig-Signature` | HMAC-SHA256 signature (if secret configured)                       |

## Verifying Webhook Signatures

If you configure a webhook secret, Hemmelig signs each payload using HMAC-SHA256. The signature is sent in the `X-Hemmelig-Signature` header as `sha256=<hex>`.

**Always verify signatures** to ensure webhooks are authentic and haven't been tampered with.

### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Express.js middleware
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const signature = req.headers['x-hemmelig-signature'];
    const payload = req.body.toString();

    if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
        return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(payload);
    console.log(`Received ${event.event} for secret ${event.data.secretId}`);

    res.status(200).send('OK');
});
```

### Python Example

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = 'sha256=' + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected)

# Flask example
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Hemmelig-Signature')
    payload = request.get_data()

    if not verify_webhook(payload, signature, os.environ['WEBHOOK_SECRET']):
        return 'Invalid signature', 401

    event = request.get_json()
    print(f"Received {event['event']} for secret {event['data']['secretId']}")

    return 'OK', 200
```

### Go Example

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "io"
    "net/http"
)

func verifyWebhook(payload []byte, signature, secret string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(payload)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(signature), []byte(expected))
}

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    signature := r.Header.Get("X-Hemmelig-Signature")
    payload, _ := io.ReadAll(r.Body)

    if !verifyWebhook(payload, signature, os.Getenv("WEBHOOK_SECRET")) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }

    // Process webhook...
    w.WriteHeader(http.StatusOK)
}
```

## Integration Examples

### Slack Notification

Send a message to Slack when a secret is viewed:

```javascript
app.post('/webhook', async (req, res) => {
    const event = req.body;

    if (event.event === 'secret.viewed') {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🔓 Secret ${event.data.secretId} was viewed. ${event.data.viewsRemaining} views remaining.`,
            }),
        });
    }

    res.status(200).send('OK');
});
```

### Discord Notification

```javascript
if (event.event === 'secret.burned') {
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            embeds: [
                {
                    title: '🔥 Secret Burned',
                    description: `Secret \`${event.data.secretId}\` has been permanently deleted.`,
                    color: 0xff6b6b,
                    timestamp: event.timestamp,
                },
            ],
        }),
    });
}
```

## Best Practices

1. **Always use HTTPS** for your webhook endpoint
2. **Always verify signatures** to prevent spoofed requests
3. **Respond quickly** (< 5 seconds) to avoid timeouts
4. **Use a queue** for heavy processing to avoid blocking
5. **Log webhook events** for debugging and audit trails
6. **Handle retries** gracefully (webhooks are fire-and-forget, no retries)

## Troubleshooting

**Webhooks not being received?**

- Check that webhooks are enabled in Instance Settings
- Verify your webhook URL is accessible from the Hemmelig server
- Check server logs for any error messages

**Invalid signature errors?**

- Ensure you're using the raw request body (not parsed JSON) for verification
- Check that your webhook secret matches exactly
- Make sure you're comparing the full signature including the `sha256=` prefix
