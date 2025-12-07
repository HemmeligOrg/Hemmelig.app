# Encryption

Hemmelig uses a **zero-knowledge architecture** where all encryption and decryption happens entirely in your browser. The server never sees your plaintext secrets or encryption keys.

## How It Works

1. **Secret Creation**: When you create a secret, it's encrypted in your browser before being sent to the server
2. **Key Transmission**: The decryption key is passed via URL fragment (`#decryptionKey=...`), which is never sent to the server
3. **Secret Retrieval**: When viewing a secret, the encrypted data is fetched and decrypted locally in your browser

## Why URL Fragments?

The decryption key is placed in the URL fragment (the part after `#`) for a critical security reason:

**URL fragments are never transmitted to servers.**

When you visit a URL like `https://example.com/secret/abc123#decryptionKey=xyz`:

- The browser sends a request to `https://example.com/secret/abc123`
- The fragment (`#decryptionKey=xyz`) stays in your browser
- Server logs, proxies, load balancers, and CDNs never see the fragment
- The key exists only in the browser's address bar and JavaScript

This is defined in [RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986#section-3.5) and is a fundamental behavior of all web browsers.

### What This Means

| Component                     | Sees the Key? |
| ----------------------------- | ------------- |
| Your browser                  | ✅ Yes        |
| Hemmelig server               | ❌ No         |
| Reverse proxies (nginx, etc.) | ❌ No         |
| CDNs (Cloudflare, etc.)       | ❌ No         |
| Server access logs            | ❌ No         |
| Network monitoring tools      | ❌ No         |

**Note**: Be aware that browser history and bookmarks store the full URL including fragments.

## Technical Details

### Why This Encryption?

Hemmelig uses **AES-256-GCM** via the **Web Crypto API** for several important reasons:

- **Browser-native**: The Web Crypto API is built into all modern browsers. No external libraries required.
- **Hardware-accelerated**: AES is supported by dedicated instructions (AES-NI) in most modern CPUs (Intel, AMD, ARM), making encryption and decryption fast.
- **Battle-tested**: AES-256 is a NIST-approved standard.
- **Authenticated encryption**: GCM mode provides both confidentiality and integrity, detecting any tampering with the ciphertext.
- **No dependencies**: By using native browser APIs, we avoid supply chain risks from third-party cryptography libraries.

### Algorithm

- **Encryption**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256
- **Implementation**: Web Crypto API (browser-native)

### Parameters

| Parameter         | Value              | Description                                              |
| ----------------- | ------------------ | -------------------------------------------------------- |
| Algorithm         | AES-GCM            | Authenticated encryption with associated data            |
| Key Length        | 256 bits           | Maximum AES key size                                     |
| IV Length         | 96 bits (12 bytes) | Initialization vector, randomly generated per encryption |
| Salt Length       | 32 characters      | Unique per secret, stored server-side                    |
| PBKDF2 Iterations | 600,000            | Key derivation iterations                                |
| PBKDF2 Hash       | SHA-256            | Hash function for key derivation                         |

### Encryption Process

1. **Key Generation**: A 32-character random key is generated using `nanoid`, or a user-provided password is used directly
2. **Key Derivation**: PBKDF2 derives a 256-bit AES key from the password/key and a unique salt
3. **Encryption**: AES-256-GCM encrypts the plaintext with a random 96-bit IV
4. **Output Format**: `IV (12 bytes) || Ciphertext`

## Password Protection

When you set a password on a secret:

- The password is used directly as the encryption key instead of a randomly generated key
- The URL does **not** include the `#decryptionKey=...` fragment
- The recipient must enter the password manually to decrypt the secret
- This allows you to share the URL and password through separate channels for additional security

### Decryption Process

1. **Parse**: Extract the 12-byte IV from the beginning of the encrypted data
2. **Key Derivation**: PBKDF2 derives the same AES key using the password/key and salt
3. **Decryption**: AES-GCM decrypts and authenticates the ciphertext

## Security Properties

- **Confidentiality**: AES-256 provides strong encryption
- **Integrity**: GCM mode provides authenticated encryption, detecting any tampering
- **Key Strength**: PBKDF2 with 600,000 iterations provides resistance against brute-force attacks
- **Forward Secrecy**: Each secret uses a unique salt and random IV

## File Encryption

Files are encrypted using the same AES-256-GCM scheme. The file buffer is encrypted directly, and the output format is identical: `IV || Ciphertext`.

## What the Server Stores

- Encrypted secret (ciphertext)
- Salt (used for key derivation)
- Metadata (expiration, view count, etc.)

## What the Server Never Sees

- Plaintext secrets
- Encryption keys or passwords
- Decryption keys (passed via URL fragment)

## References

- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - Browser-native cryptography documentation
- [MDN AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams) - AES-GCM algorithm parameters
- [MDN PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/Pbkdf2Params) - PBKDF2 key derivation parameters
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html) - Best practices for cryptographic storage
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) - Key derivation recommendations
- [NIST AES Specification](https://csrc.nist.gov/publications/detail/fips/197/final) - Official AES standard (FIPS 197)
