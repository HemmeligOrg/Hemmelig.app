# Upgrading from v6 to v7

## ⚠️ Breaking Changes - Fresh Start Required

**v7 is a complete rewrite and is NOT backwards compatible with v6.** Due to fundamental changes in the encryption and password hashing algorithms, migration of existing data is not possible.

### What Changed

| Component            | v6                  | v7                      |
| -------------------- | ------------------- | ----------------------- |
| Encryption Algorithm | Different algorithm | AES-256-GCM with PBKDF2 |
| Password Hashing     | Different algorithm | Updated secure hashing  |
| Database Schema      | Previous schema     | New schema structure    |

### Why Migration Is Not Possible

1. **Encryption Algorithm Change:** Secrets encrypted with the v6 algorithm cannot be decrypted with v7's implementation. Since the server never stores decryption keys (zero-knowledge architecture), there is no way to re-encrypt existing secrets.

2. **Password Algorithm Change:** User passwords are hashed differently in v7. Existing password hashes from v6 cannot be verified or converted.

### Upgrade Steps

1. **Backup v6 data** (for reference only - it cannot be migrated)
2. **Stop your v6 instance**
3. **Deploy v7 with a fresh database** - See [Docker Guide](docker.md) for deployment instructions
4. **Re-create user accounts**
5. **Inform users** that existing secrets are no longer accessible

### Important Notes

- No migration scripts are provided or planned
- Users must register new accounts in v7
- Consider running v6 in read-only mode temporarily to allow users to retrieve unexpired secrets before shutdown
