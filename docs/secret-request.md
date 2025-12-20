# Secret Requests

Secret Requests allow you to request secrets from others securely. Instead of asking someone to create a secret and send you the link, you create a request link that they can use to submit a secret directly to you.

## How It Works

1. **Create a Request** - You configure the secret settings (expiration, max views, etc.) and get a unique request link
2. **Share the Link** - Send the request link to the person who has the secret
3. **They Submit** - They enter their secret, which gets encrypted in their browser. They receive a decryption key which they must send back to you.
4. **View the Secret** - You use the secret URL from your dashboard combined with the decryption key to view the secret.

```
┌─────────────┐         ┌─────────────┐
│  Requester  │         │   Creator   │
│  (You)      │         │  (Them)     │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ 1. Create request     │
       │───────────────────>   │
       │                       │
       │ 2. Share request link │
       │ ─ ─ ─ ─ ─ ─ ─ ─ ─ >   │
       │                       │
       │                       │ 3. Submit secret
       │                       │    (encrypted)
       │                       │
       │ 4. They send you the  │
       │    decryption key     │
       │< ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
       │                       │
       │ 5. View secret from   │
       │    dashboard with key │
       │                       │
```

## Creating a Request

Navigate to **Dashboard → Secret Requests → Create New Request**.

### Required Fields

- **Title** - A descriptive title shown to the creator (e.g., "API credentials for Project X")

### Optional Fields

- **Description** - Additional context for the creator
- **Link Validity** - How long the request link remains active (1 hour to 30 days)
- **Secret Expiration** - How long the submitted secret lives (5 minutes to 28 days)
- **Max Views** - Number of times the secret can be viewed (1-9999)
- **IP Restriction** - Limit secret access to specific IP/CIDR
- **Prevent Burn** - Keep secret even after max views reached
- **Webhook URL** - Get notified when the secret is submitted

## Webhooks

When a secret is submitted, Hemmelig sends a POST request to your webhook URL:

```json
{
    "event": "secret_request.fulfilled",
    "timestamp": "2024-12-14T10:30:00.000Z",
    "request": {
        "id": "uuid",
        "title": "API credentials",
        "createdAt": "2024-12-14T10:00:00.000Z",
        "fulfilledAt": "2024-12-14T10:30:00.000Z"
    },
    "secret": {
        "id": "secret-uuid",
        "maxViews": 1,
        "expiresAt": "2024-12-15T10:30:00.000Z"
    }
}
```

### Webhook Security

Webhooks are signed using HMAC-SHA256. Verify the signature to ensure authenticity:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, timestamp, secret) {
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return `sha256=${expectedSig}` === signature;
}

// Headers to check:
// X-Hemmelig-Signature: sha256=<hex>
// X-Hemmelig-Timestamp: <unix-timestamp>
```

**Note:** The webhook secret is shown only once when creating the request. Store it securely.

## Security

- **Client-side encryption** - Secrets are encrypted in the creator's browser before transmission
- **Decryption key in URL fragment** - The `#decryptionKey=...` never reaches the server
- **Single-use tokens** - Request links use 256-bit cryptographically secure tokens
- **Timing-safe validation** - Prevents timing attacks on token verification

## API Usage

### Create a Request

```bash
curl -X POST https://your-instance/api/secret-requests \
  -H "Authorization: Bearer hemmelig_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database credentials",
    "description": "Need the prod DB password",
    "maxViews": 1,
    "expiresIn": 86400,
    "validFor": 604800
  }'
```

### List Your Requests

```bash
curl https://your-instance/api/secret-requests \
  -H "Authorization: Bearer hemmelig_your_api_key"
```

### Get Request Details

```bash
curl https://your-instance/api/secret-requests/{id} \
  -H "Authorization: Bearer hemmelig_your_api_key"
```

### Cancel a Request

```bash
curl -X DELETE https://your-instance/api/secret-requests/{id} \
  -H "Authorization: Bearer hemmelig_your_api_key"
```

## Limits

- **Secret size**: 1 MB maximum
- **Title size**: 1 KB maximum
- **Request validity**: 1 hour to 30 days
- **Secret expiration**: 5 minutes to 28 days
