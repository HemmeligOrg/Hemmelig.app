# API Documentation

Hemmelig provides a REST API for programmatic access to secret sharing functionality.

## Interactive Documentation

The API is documented using OpenAPI 3.0 specification with an interactive Swagger UI:

- **Swagger UI:** `/api/docs` - Interactive API explorer
- **OpenAPI Spec:** `/api/openapi.json` - Raw OpenAPI specification

## Authentication

### Session Authentication

For browser-based access, authenticate through the `/auth` endpoints provided by better-auth. Session cookies are automatically managed.

### API Key Authentication

For programmatic access, create an API key in your account settings under the **Developer** tab.

Use the API key as a Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer hemmelig_your_api_key_here" \
  https://your-instance.com/api/secrets
```

**Important:**

- API keys are shown only once upon creation - store them securely
- Maximum 5 API keys per user
- Keys can optionally expire after 30, 90, or 365 days
- Revoke compromised keys immediately from your account settings

For endpoints requiring admin access, the authenticated user must have the `admin` role.

## Quick Reference

### Public Endpoints

| Method | Endpoint                        | Description                                       |
| ------ | ------------------------------- | ------------------------------------------------- |
| GET    | `/api/healthz`                  | Health check                                      |
| POST   | `/api/secrets`                  | Create a new secret                               |
| POST   | `/api/secrets/:id`              | Retrieve a secret (password in body if protected) |
| GET    | `/api/secrets/:id/check`        | Check if secret exists and requires password      |
| POST   | `/api/files`                    | Upload a file                                     |
| GET    | `/api/files/:id`                | Download a file                                   |
| GET    | `/api/instance/settings/public` | Get public instance settings                      |
| GET    | `/api/setup/status`             | Check if initial setup is needed                  |
| POST   | `/api/setup/complete`           | Complete initial setup                            |

### Authenticated Endpoints

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/secrets`          | List user's secrets |
| DELETE | `/api/secrets/:id`      | Delete a secret     |
| GET    | `/api/account`          | Get account info    |
| PUT    | `/api/account`          | Update account info |
| PUT    | `/api/account/password` | Update password     |
| DELETE | `/api/account`          | Delete account      |
| GET    | `/api/api-keys`         | List API keys       |
| POST   | `/api/api-keys`         | Create API key      |
| DELETE | `/api/api-keys/:id`     | Delete API key      |

### Admin Endpoints

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/api/instance/settings`        | Get all instance settings |
| PUT    | `/api/instance/settings`        | Update instance settings  |
| GET    | `/api/analytics`                | Get secret analytics      |
| GET    | `/api/analytics/visitors/daily` | Get daily visitor stats   |
| GET    | `/api/invites`                  | List invite codes         |
| POST   | `/api/invites`                  | Create invite code        |
| DELETE | `/api/invites/:id`              | Deactivate invite code    |
| PUT    | `/api/user/:id`                 | Update user               |

## Example: Create a Secret

```bash
curl -X POST https://your-instance.com/api/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "BASE64_ENCRYPTED_CONTENT",
    "salt": "ENCRYPTION_SALT",
    "expiresAt": 3600,
    "views": 1
  }'
```

Response:

```json
{
    "id": "abc123xyz"
}
```

## Important Notes

- **Client-side encryption:** All secret content should be encrypted client-side before sending to the API. The server only stores encrypted data.
- **Decryption keys:** Never send decryption keys to the server. They should be passed via URL fragments (`#key=...`) which are not transmitted to the server.
- **Rate limiting:** API requests may be rate-limited based on instance settings.
