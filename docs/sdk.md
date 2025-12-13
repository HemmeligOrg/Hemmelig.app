# SDK Generation

> **Disclaimer:** The Hemmelig API is subject to change without notice. Generated SDKs may break with future updates. Use at your own risk.

Hemmelig exposes an OpenAPI 3.0 specification that can be used to generate client SDKs in various programming languages.

## OpenAPI Specification

The OpenAPI spec is available at:

- **Swagger UI:** `/api/docs` - Interactive API explorer
- **OpenAPI JSON:** `/api/openapi.json` - Raw specification

## Generating an SDK

We recommend using [OpenAPI Generator](https://openapi-generator.tech/) which supports 50+ languages.

### Installation

```bash
npm install -g @openapitools/openapi-generator-cli
```

### Generate SDK

```bash
# TypeScript
openapi-generator-cli generate \
  -i https://your-instance.com/api/openapi.json \
  -g typescript-axios \
  -o ./hemmelig-sdk

# Python
openapi-generator-cli generate \
  -i https://your-instance.com/api/openapi.json \
  -g python \
  -o ./hemmelig-sdk

# Go
openapi-generator-cli generate \
  -i https://your-instance.com/api/openapi.json \
  -g go \
  -o ./hemmelig-sdk
```

View all available generators:

```bash
openapi-generator-cli list
```

## Authentication

The API supports two authentication methods:

### Bearer Token (API Key)

```typescript
const client = new HemmeligApi({
    baseURL: 'https://your-instance.com/api',
    headers: {
        Authorization: 'Bearer hemmelig_your_api_key_here',
    },
});
```

### Session Cookie

For browser-based applications, session cookies are automatically handled after authentication via `/auth` endpoints.

## Important: Client-Side Encryption

Generated SDKs handle API communication only. **You must implement client-side encryption** before sending secrets to the API.

Hemmelig uses AES-256-GCM encryption. See the [encryption documentation](./encryption.md) for implementation details.

The decryption key should be passed via URL fragments (`#decryptionKey=...`) which are never sent to the server.
