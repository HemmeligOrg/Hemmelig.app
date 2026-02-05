# Claude AI Assistant Guidelines for Hemmelig.app

Welcome to Hemmelig.app! This guide will help you navigate our codebase and contribute effectively. Think of this document as your onboarding buddy - it covers everything you need to know to maintain code quality, security, and architectural consistency.

## What is Hemmelig?

Hemmelig.app is a secure secret-sharing application that lets users share encrypted messages that automatically self-destruct after being read. The name "Hemmelig" means "secret" in Norwegian - fitting, right?

### The Security Model You Must Understand

**CRITICAL: Zero-Knowledge Architecture**

This is the heart of Hemmelig. Before you write a single line of code, make sure you understand this:

- All encryption/decryption happens **client-side only** using the Web Crypto API
- The server **never** sees plaintext secrets - only encrypted blobs
- Decryption keys live in URL fragments (`#decryptionKey=...`), which browsers **never send to servers**
- This is our fundamental security promise to users - **do not compromise this under any circumstances**

### How Encryption Works

| Component          | Details                                                    |
| ------------------ | ---------------------------------------------------------- |
| **Algorithm**      | AES-256-GCM (authenticated encryption)                     |
| **Key Derivation** | PBKDF2 with SHA-256, 1,300,000 iterations                  |
| **IV**             | 96-bit random initialization vector per encryption         |
| **Salt**           | 32-character random string per secret (stored server-side) |
| **Implementation** | `src/lib/crypto.ts`                                        |

## Technology Stack

Here's what powers Hemmelig:

| Layer          | Technology                   | Notes                                      |
| -------------- | ---------------------------- | ------------------------------------------ |
| **Runtime**    | Node.js 25                   | JavaScript runtime for dev and production  |
| **Frontend**   | React 19 + Vite + TypeScript | All components use `.tsx`                  |
| **Backend**    | Hono (RPC mode)              | Type-safe API client generation            |
| **Database**   | SQLite + Prisma ORM          | Schema in `prisma/schema.prisma`           |
| **Styling**    | Tailwind CSS v4              | Class-based, light/dark mode support       |
| **State**      | Zustand                      | Lightweight state management               |
| **Auth**       | better-auth                  | Session-based with 2FA support             |
| **i18n**       | react-i18next                | All user-facing strings must be translated |
| **Monitoring** | prom-client                  | Prometheus metrics                         |
| **API Docs**   | Swagger UI                   | OpenAPI documentation                      |

## Project Structure

Here's how the codebase is organized:

```
hemmelig.app/
├── api/                    # Backend (Hono)
│   ├── app.ts             # Main Hono application setup
│   ├── auth.ts            # Authentication configuration
│   ├── config.ts          # Application configuration
│   ├── openapi.ts         # OpenAPI/Swagger spec & UI
│   ├── routes.ts          # Route aggregator
│   ├── routes/            # Individual route handlers
│   │   ├── secrets.ts     # Secret CRUD operations
│   │   ├── secret-requests.ts # Secret request management
│   │   ├── account.ts     # User account management
│   │   ├── files.ts       # File upload/download
│   │   ├── user.ts        # User management (admin)
│   │   ├── instance.ts    # Instance settings
│   │   ├── analytics.ts   # Usage analytics
│   │   ├── invites.ts     # Invite code management
│   │   ├── api-keys.ts    # API key management
│   │   ├── setup.ts       # Initial setup flow
│   │   ├── health.ts      # Health check endpoints
│   │   └── metrics.ts     # Prometheus metrics
│   ├── lib/               # Backend utilities
│   │   ├── db.ts          # Prisma client singleton
│   │   ├── password.ts    # Password hashing (Argon2)
│   │   ├── files.ts       # File handling utilities
│   │   ├── settings.ts    # Instance settings helper
│   │   ├── webhook.ts     # Webhook dispatch utilities
│   │   ├── analytics.ts   # Analytics utilities
│   │   ├── constants.ts   # Shared constants
│   │   └── utils.ts       # General utilities
│   ├── middlewares/       # Hono middlewares
│   │   ├── auth.ts        # Authentication middleware
│   │   ├── ratelimit.ts   # Rate limiting
│   │   └── ip-restriction.ts # IP allowlist/blocklist
│   ├── validations/       # Zod schemas for request validation
│   └── jobs/              # Background jobs (cleanup, etc.)
├── src/                   # Frontend (React)
│   ├── components/        # Reusable UI components
│   │   ├── Layout/        # Layout wrappers
│   │   ├── Editor.tsx     # TipTap rich text editor
│   │   └── ...
│   ├── pages/             # Route-level components
│   │   ├── HomePage.tsx
│   │   ├── SecretPage.tsx
│   │   ├── SetupPage.tsx  # Initial admin setup
│   │   ├── Verify2FAPage.tsx # Two-factor verification
│   │   ├── Dashboard/     # Admin dashboard pages
│   │   └── ...
│   ├── store/             # Zustand stores
│   │   ├── secretStore.ts # Secret creation state
│   │   ├── userStore.ts   # Current user state
│   │   ├── hemmeligStore.ts # Instance settings
│   │   ├── themeStore.ts  # Light/dark mode (persisted)
│   │   └── ...
│   ├── lib/               # Frontend utilities
│   │   ├── api.ts         # Hono RPC client
│   │   ├── auth.ts        # better-auth client
│   │   ├── crypto.ts      # Client-side encryption
│   │   ├── hash.ts        # Hashing utilities
│   │   └── analytics.ts   # Page view tracking
│   ├── i18n/              # Internationalization
│   │   └── locales/       # Translation JSON files
│   └── router.tsx         # React Router configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── scripts/               # Utility scripts
│   ├── admin.ts           # Set user as admin
│   └── seed-demo.ts       # Seed demo data
├── server.ts              # Production server entry point
└── vite.config.ts         # Vite configuration
```

## Getting Started

### Development Commands

```bash
# Install dependencies
npm install

# Start frontend with hot reload
npm run dev

# Start API server (runs migrations automatically)
npm run dev:api

# Build for production
npm run build

# Run production server
npm run start

# Database commands
npm run migrate:dev          # Create and apply migrations
npm run migrate:deploy       # Apply pending migrations (production)
npm run migrate:reset        # Reset database (destructive!)
npm run migrate:status       # Check migration status

# Utility scripts
npm run set:admin            # Promote a user to admin
npm run seed:demo            # Seed database with demo data

# Code quality
npm run format               # Format code with Prettier
npm run format:check         # Check formatting
npm run test:e2e             # Run end-to-end tests with Playwright
```

## Coding Guidelines

### Core Principles

1. **Make Surgical Changes** - Only change what's necessary. Don't refactor, optimize, or "improve" unrelated code.

2. **Follow Existing Patterns** - Consistency trumps personal preference. Match what's already in the codebase.

3. **Ask Before Adding Dependencies** - Never add, remove, or update packages without explicit permission.

4. **Security First** - Extra scrutiny for anything touching encryption, authentication, or data handling.

---

## Frontend Guidelines

### Component Structure

Keep your components clean and consistent:

```tsx
// Use functional components with hooks
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
    const { t } = useTranslation(); // Always use i18n for user-facing text
    const [state, setState] = useState<Type>(initialValue);

    const handleAction = () => {
        // Event handler logic
    };

    return <div className="bg-white dark:bg-dark-800">{/* Always support light/dark mode */}</div>;
}
```

### Design System

Our UI follows these principles:

- **Compact design** with minimal padding
- **Sharp corners** - no `rounded-*` classes
- **Light and dark mode** support is mandatory
- **Mobile-first** responsive design

### Styling with Tailwind

```tsx
// GOOD: Light mode first, then dark variant, sharp corners
className =
    'bg-white dark:bg-dark-800 text-gray-900 dark:text-white border border-gray-200 dark:border-dark-600';

// BAD: Missing light mode variant
className = 'dark:bg-dark-800';

// BAD: Using rounded corners
className = 'rounded-lg';

// BAD: Using arbitrary values when design tokens exist
className = 'bg-[#111111]'; // Use bg-dark-800 instead
```

### Custom Color Palette

```javascript
// tailwind.config.js defines these colors:
dark: {
    900: '#0a0a0a',  // Darkest background
    800: '#111111',  // Card backgrounds
    700: '#1a1a1a',  // Input backgrounds
    600: '#222222',  // Borders
    500: '#2a2a2a',  // Lighter borders
}
light: {
    900: '#ffffff',
    800: '#f8fafc',
    700: '#f1f5f9',
    600: '#e2e8f0',
    500: '#cbd5e1',
}
```

### State Management with Zustand

```typescript
// src/store/exampleStore.ts
import { create } from 'zustand';

interface ExampleState {
    data: string;
    setData: (data: string) => void;
}

export const useExampleStore = create<ExampleState>((set) => ({
    data: '',
    setData: (data) => set({ data }),
}));
```

### API Calls

Always use the typed Hono RPC client - it gives you full type safety:

```typescript
import { api } from '../lib/api';

// The client is fully typed based on backend routes
const response = await api.secrets.$post({
    json: { secret: encryptedData, expiresAt: timestamp },
});
const data = await response.json();
```

### React Router Loaders

We use React Router v7 with data loaders. Here's the pattern:

```typescript
// In router.tsx
{
    path: '/dashboard/secrets',
    element: <SecretsPage />,
    loader: async () => {
        const res = await api.secrets.$get();
        return await res.json();
    },
}

// In the component
import { useLoaderData } from 'react-router-dom';

export function SecretsPage() {
    const secrets = useLoaderData();
    // Use the pre-loaded data
}
```

---

## Internationalization (i18n)

### The Golden Rule

**When you add or modify any user-facing string, you MUST update ALL translation files.**

### Supported Languages

We currently support these languages:

| Language  | File Path                     |
| --------- | ----------------------------- |
| English   | `src/i18n/locales/en/en.json` |
| Danish    | `src/i18n/locales/da/da.json` |
| German    | `src/i18n/locales/de/de.json` |
| Spanish   | `src/i18n/locales/es/es.json` |
| French    | `src/i18n/locales/fr/fr.json` |
| Italian   | `src/i18n/locales/it/it.json` |
| Dutch     | `src/i18n/locales/nl/nl.json` |
| Norwegian | `src/i18n/locales/no/no.json` |
| Swedish   | `src/i18n/locales/sv/sv.json` |
| Chinese   | `src/i18n/locales/zh/zh.json` |

### How to Add New Strings

1. **Add to English first** - `src/i18n/locales/en/en.json`
2. **Add to ALL other locale files** - Even if you use English as a placeholder, add the key to every file
3. **Use nested keys** - Follow the existing structure (e.g., `secret_page.loading_message`)

```tsx
// Using translations in components
const { t } = useTranslation();

// GOOD
<p>{t('secret_page.loading_message')}</p>

// BAD: Hardcoded string
<p>Loading...</p>
```

### Translation Checklist

Before committing, verify:

- [ ] Added key to `en/en.json` with proper English text
- [ ] Added key to `da/da.json`
- [ ] Added key to `de/de.json`
- [ ] Added key to `es/es.json`
- [ ] Added key to `fr/fr.json`
- [ ] Added key to `it/it.json`
- [ ] Added key to `nl/nl.json`
- [ ] Added key to `no/no.json`
- [ ] Added key to `sv/sv.json`
- [ ] Added key to `zh/zh.json`

> **Tip**: If you don't know the translation, use the English text as a placeholder and add a `// TODO: translate` comment in your PR description.

---

## Backend Guidelines

### Route Structure

```typescript
// api/routes/example.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const exampleRoute = new Hono().post(
    '/',
    zValidator(
        'json',
        z.object({
            field: z.string().min(1).max(1000),
        })
    ),
    async (c) => {
        const { field } = c.req.valid('json');
        // Handler logic here
        return c.json({ success: true });
    }
);

export default exampleRoute;
```

### Database Operations

```typescript
// Always use the Prisma client from api/lib/db.ts
import prisma from '../lib/db';

// Use transactions for multiple operations
await prisma.$transaction([
    prisma.secrets.create({ data: { ... } }),
    prisma.file.createMany({ data: files }),
]);
```

### Input Validation

- **Always** validate input using Zod schemas
- Place reusable schemas in `api/validations/`
- Validate at the route level using `zValidator`

### Error Handling

```typescript
// Return consistent error responses
return c.json({ error: 'Descriptive error message' }, 400);

// Zod automatically handles validation errors
```

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Run `npm run migrate:dev --name descriptive_name`
3. Test the migration locally
4. Commit both schema and migration files

---

## Health & Monitoring

### Health Endpoints

Hemmelig provides Kubernetes-ready health checks:

| Endpoint            | Purpose         | Checks                    |
| ------------------- | --------------- | ------------------------- |
| `GET /health/live`  | Liveness probe  | Process is running        |
| `GET /health/ready` | Readiness probe | Database, storage, memory |

### Metrics Endpoint

Prometheus metrics are available at `GET /metrics`. This endpoint can be optionally protected with authentication.

---

## Security Checklist

When modifying security-sensitive code, verify:

- [ ] Encryption/decryption remains client-side only
- [ ] Decryption keys never reach the server
- [ ] Input validation is present on all endpoints
- [ ] Authentication checks are in place where required
- [ ] Rate limiting is applied to sensitive endpoints
- [ ] No sensitive data in logs or error messages
- [ ] File uploads are validated and sanitized

---

## Testing

- End-to-end tests use [Playwright](https://playwright.dev/) - find them in `tests/e2e/`
- Run e2e tests with `npm run test:e2e`
- When adding new features, add corresponding test files

---

## Common Patterns

### Creating a New Page

1. Create component in `src/pages/`
2. Add route with loader in `src/router.tsx`
3. **Add translations to ALL locale files**
4. Ensure light/dark mode support

### Creating a New API Endpoint

1. Add route handler in `api/routes/`
2. Register in `api/routes.ts`
3. Add Zod validation schema
4. Frontend types update automatically via Hono RPC

### Adding a New Store

1. Create store in `src/store/`
2. Follow existing Zustand patterns
3. Export from the store file

---

## What NOT to Do

These are hard rules - no exceptions:

1. **Never** modify encryption logic without explicit approval
2. **Never** log or store plaintext secrets server-side
3. **Never** send decryption keys to the server
4. **Never** bypass input validation
5. **Never** add dependencies without approval
6. **Never** modify unrelated code "while you're in there"
7. **Never** use `any` types in TypeScript
8. **Never** commit `.env` files or secrets
9. **Never** disable security features "temporarily"
10. **Never** add user-facing strings without updating ALL translation files

---

## Quick Reference

### Key File Locations

| What                   | Where                  |
| ---------------------- | ---------------------- |
| Frontend components    | `src/components/`      |
| Page components        | `src/pages/`           |
| API routes             | `api/routes/`          |
| API config             | `api/config.ts`        |
| Database schema        | `prisma/schema.prisma` |
| Translations           | `src/i18n/locales/`    |
| Stores                 | `src/store/`           |
| Client-side encryption | `src/lib/crypto.ts`    |
| API client             | `src/lib/api.ts`       |
| Backend setup          | `api/app.ts`           |
| Design tokens          | `tailwind.config.js`   |

### Environment Variables

```bash
# Required
DATABASE_URL=                      # SQLite connection (file:./data/hemmelig.db)
BETTER_AUTH_SECRET=                # Auth secret key (generate a random string)
BETTER_AUTH_URL=                   # Public URL of your instance

# Optional - Server
HEMMELIG_PORT=                     # Port the server listens on (default: 3000)
HEMMELIG_BASE_URL=                 # Public URL (required for OAuth callbacks)
HEMMELIG_TRUSTED_ORIGIN=           # Additional trusted origin for CORS

# Optional - Analytics
HEMMELIG_ANALYTICS_ENABLED=        # Enable/disable analytics tracking (default: true)
HEMMELIG_ANALYTICS_HMAC_SECRET=    # HMAC secret for anonymizing visitor IDs

# Optional - Managed Mode (all instance settings via env vars)
HEMMELIG_MANAGED=                  # Enable managed mode (true/false)
```

See `docs/env.md` for the full environment variable reference.

---

## Managed Mode

When `HEMMELIG_MANAGED=true`, all instance settings are controlled via environment variables instead of the database. The admin dashboard becomes read-only.

### Managed Mode Environment Variables

| Variable                                 | Description                                 | Default |
| ---------------------------------------- | ------------------------------------------- | ------- |
| `HEMMELIG_MANAGED`                       | Enable managed mode                         | `false` |
| `HEMMELIG_INSTANCE_NAME`                 | Display name for your instance              | `""`    |
| `HEMMELIG_INSTANCE_DESCRIPTION`          | Description shown on the homepage           | `""`    |
| `HEMMELIG_INSTANCE_LOGO`                 | Base64-encoded logo image (max 512KB)       | `""`    |
| `HEMMELIG_ALLOW_REGISTRATION`            | Allow new user signups                      | `true`  |
| `HEMMELIG_REQUIRE_EMAIL_VERIFICATION`    | Require email verification                  | `false` |
| `HEMMELIG_DEFAULT_SECRET_EXPIRATION`     | Default expiration in hours                 | `72`    |
| `HEMMELIG_MAX_SECRET_SIZE`               | Max secret size in KB                       | `1024`  |
| `HEMMELIG_IMPORTANT_MESSAGE`             | Alert banner shown to all users             | `""`    |
| `HEMMELIG_ALLOW_PASSWORD_PROTECTION`     | Allow password-protected secrets            | `true`  |
| `HEMMELIG_ALLOW_IP_RESTRICTION`          | Allow IP range restrictions                 | `true`  |
| `HEMMELIG_ALLOW_FILE_UPLOADS`            | Allow users to attach files                 | `true`  |
| `HEMMELIG_ENABLE_RATE_LIMITING`          | Enable API rate limiting                    | `true`  |
| `HEMMELIG_RATE_LIMIT_REQUESTS`           | Max requests per window                     | `100`   |
| `HEMMELIG_RATE_LIMIT_WINDOW`             | Rate limit window in seconds                | `60`    |
| `HEMMELIG_REQUIRE_INVITE_CODE`           | Require invite code for registration        | `false` |
| `HEMMELIG_ALLOWED_EMAIL_DOMAINS`         | Comma-separated allowed domains             | `""`    |
| `HEMMELIG_REQUIRE_REGISTERED_USER`       | Only registered users create secrets        | `false` |
| `HEMMELIG_DISABLE_EMAIL_PASSWORD_SIGNUP` | Disable email/password signup (social only) | `false` |
| `HEMMELIG_WEBHOOK_ENABLED`               | Enable webhook notifications                | `false` |
| `HEMMELIG_WEBHOOK_URL`                   | Webhook endpoint URL                        | `""`    |
| `HEMMELIG_WEBHOOK_SECRET`                | HMAC secret for webhook signatures          | `""`    |
| `HEMMELIG_WEBHOOK_ON_VIEW`               | Send webhook when secret is viewed          | `true`  |
| `HEMMELIG_WEBHOOK_ON_BURN`               | Send webhook when secret is burned          | `true`  |
| `HEMMELIG_METRICS_ENABLED`               | Enable Prometheus metrics endpoint          | `false` |
| `HEMMELIG_METRICS_SECRET`                | Bearer token for `/api/metrics`             | `""`    |

See `docs/managed.md` for full documentation.

---

## Feature Reference

### Organization Features

Hemmelig supports enterprise deployments with:

- **Invite-Only Registration** - Require invite codes to sign up
- **Email Domain Restrictions** - Limit signups to specific domains (e.g., `company.com`)
- **Instance Settings** - Configure `allowRegistration`, `requireInvite`, `allowedEmailDomains`

### Analytics System

Privacy-focused analytics with:

- HMAC-SHA256 hashing for anonymous visitor IDs (IPs never stored)
- Automatic bot filtering using `isbot`
- Tracks: Homepage (`/`) and Secret view page (`/secret`)
- Admin dashboard at `/dashboard/analytics`

### Authentication

better-auth provides:

- Session-based authentication
- Two-factor authentication (2FA) with TOTP
- Custom signup hooks for email domain validation
- Admin user management
- Social login providers (GitHub, Google, Microsoft, Discord, GitLab, Apple, Twitter)

### Social Login Providers

Social login can be configured via:

1. **Admin Dashboard** - Instance Settings > Social Login tab (when not in managed mode)
2. **Environment Variables** - Using `HEMMELIG_AUTH_*` variables (always available)

Environment variable format:

```bash
HEMMELIG_AUTH_GITHUB_ID=your-client-id
HEMMELIG_AUTH_GITHUB_SECRET=your-client-secret
HEMMELIG_AUTH_GOOGLE_ID=your-client-id
HEMMELIG_AUTH_GOOGLE_SECRET=your-client-secret
# ... etc for microsoft, discord, gitlab, apple, twitter
```

See `docs/social-login.md` for full setup instructions.

---

## Need Help?

- Check existing patterns in the codebase first
- Read related components/routes for context
- When in doubt, ask for clarification rather than making assumptions

---

_This document is the source of truth for development practices in this repository._
