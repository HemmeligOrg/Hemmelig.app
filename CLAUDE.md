# Claude AI Assistant Guidelines for Hemmelig.app

This document provides comprehensive guidelines for Claude when working within the Hemmelig.app codebase. Follow these instructions precisely to maintain code quality, security, and architectural consistency.

## Project Overview

Hemmelig.app is a secure secret-sharing application that enables users to share encrypted messages that automatically self-destruct after being read. The name "Hemmelig" means "secret" in Norwegian.

### Core Security Model

**CRITICAL: Zero-Knowledge Architecture**
- All encryption/decryption happens **client-side only** using the Web Crypto API
- The server **never** sees plaintext secrets—only encrypted blobs
- Decryption keys are passed via URL fragments (`#decryptionKey=...`), which are **never sent to the server**
- This is the fundamental security guarantee of the application—**do not compromise this**

### Encryption Details
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Derivation:** PBKDF2 with SHA-256, 100,000 iterations
- **IV:** 96-bit random initialization vector per encryption
- **Salt:** 32-character random string per secret (stored server-side)
- **Implementation:** `src/lib/crypto.ts`

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Runtime** | Bun | Fast JavaScript runtime, used for both dev and production |
| **Frontend** | React 18 + Vite + TypeScript | All components in `.tsx` |
| **Backend** | Hono (RPC mode) | Type-safe API client generation |
| **Database** | SQLite + Prisma ORM | Schema in `prisma/schema.prisma` |
| **Styling** | Tailwind CSS | Class-based, supports light/dark mode |
| **State** | Zustand | Lightweight state management |
| **Auth** | better-auth | Session-based authentication |
| **i18n** | react-i18next | All user-facing strings must be translated |

## Project Structure

```
hemmelig.app/
├── api/                    # Backend (Hono)
│   ├── app.ts             # Main Hono application setup
│   ├── auth.ts            # Authentication configuration
│   ├── routes.ts          # Route aggregator
│   ├── routes/            # Individual route handlers
│   │   ├── secrets.ts     # Secret CRUD operations
│   │   ├── account.ts     # User account management
│   │   ├── files.ts       # File upload/download
│   │   ├── user.ts        # User management (admin)
│   │   ├── instance.ts    # Instance settings
│   │   └── analytics.ts   # Usage analytics
│   ├── lib/               # Backend utilities
│   │   ├── db.ts          # Prisma client singleton
│   │   ├── password.ts    # Password hashing utilities
│   │   └── utils.ts       # General utilities
│   ├── middlewares/       # Hono middlewares
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
│   │   ├── Dashboard/     # Admin dashboard pages
│   │   └── ...
│   ├── store/             # Zustand stores
│   │   ├── secretStore.ts # Secret creation state
│   │   ├── userStore.ts   # Current user state
│   │   ├── themeStore.ts  # Light/dark mode
│   │   └── ...
│   ├── lib/               # Frontend utilities
│   │   ├── api.ts         # Hono RPC client
│   │   └── crypto.ts      # Client-side encryption
│   ├── i18n/              # Internationalization
│   │   └── locales/       # Translation JSON files
│   └── router.tsx         # React Router configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── server.ts              # Production server entry point
└── vite.config.ts         # Vite configuration
```

## Development Commands

```bash
# Install dependencies
bun install

# Development (frontend only, hot reload)
bun run dev

# Development (API server with database migrations)
bun run dev:api

# Build for production
bun run build

# Run production server
bun run start

# Database migrations
bun run migrate:dev      # Create and apply migrations
bun run migrate:deploy   # Apply pending migrations
bun run migrate:reset    # Reset database (destructive!)

# Run tests
bun run test
```

## Coding Guidelines

### General Principles

1. **Surgical Changes Only:** Make the minimum changes necessary. Do not refactor, optimize, or "improve" unrelated code.

2. **Preserve Existing Patterns:** Follow the conventions already established in the codebase. Consistency trumps personal preference.

3. **No Unsolicited Dependencies:** Never add, remove, or update packages without explicit permission.

4. **Security First:** Any change touching encryption, authentication, or data handling requires extra scrutiny.

### Frontend Guidelines

#### Component Structure
```tsx
// Use functional components with hooks
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
    const { t } = useTranslation();  // Always use i18n
    const [state, setState] = useState<Type>(initialValue);
    
    // Event handlers
    const handleAction = () => { /* ... */ };
    
    return (
        <div className="bg-white dark:bg-dark-800">
            {/* Always support light/dark mode */}
        </div>
    );
}
```

#### Styling with Tailwind
```tsx
// ✅ Correct: Light mode first, then dark variant
className="bg-white dark:bg-dark-800 text-gray-900 dark:text-white"

// ❌ Wrong: Missing light mode variant
className="dark:bg-dark-800"

// ❌ Wrong: Using arbitrary values when design tokens exist
className="bg-[#111111]"  // Use bg-dark-800 instead
```

#### Custom Color Palette
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

#### State Management with Zustand
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

#### API Calls
```typescript
// Always use the typed Hono RPC client
import { api } from '../lib/api';

// The client is fully typed based on backend routes
const response = await api.secrets.$post({
    json: { secret: encryptedData, expiresAt: timestamp }
});
const data = await response.json();
```

#### Internationalization
```tsx
// All user-facing strings must use translations
const { t } = useTranslation();

// ✅ Correct
<p>{t('secret_page.loading_message')}</p>

// ❌ Wrong: Hardcoded string
<p>Loading...</p>
```

When adding new strings:
1. Add to `src/i18n/locales/en/en.json` (required)
2. Add to other locale files as appropriate

### Backend Guidelines

#### Route Structure
```typescript
// api/routes/example.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const exampleRoute = new Hono()
    .post(
        '/',
        zValidator('json', z.object({
            field: z.string().min(1).max(1000),
        })),
        async (c) => {
            const { field } = c.req.valid('json');
            // ... handler logic
            return c.json({ success: true });
        }
    );

export default exampleRoute;
```

#### Database Operations
```typescript
// Always use the Prisma client from api/lib/db.ts
import { prisma } from '../lib/db';

// Use transactions for multiple operations
await prisma.$transaction([
    prisma.secrets.create({ data: { ... } }),
    prisma.file.createMany({ data: files }),
]);
```

#### Input Validation
- **Always** validate input using Zod schemas
- Place reusable schemas in `api/validations/`
- Validate at the route level using `zValidator`

#### Error Handling
```typescript
// Return consistent error responses
return c.json({ error: 'Descriptive error message' }, 400);

// For validation errors, Zod automatically formats them
```

### Database Schema Changes

1. Modify `prisma/schema.prisma`
2. Run `bun run migrate:dev --name descriptive_name`
3. Test the migration locally
4. Commit both schema and migration files

## Security Checklist

When modifying security-sensitive code, verify:

- [ ] Encryption/decryption remains client-side only
- [ ] Decryption keys never reach the server
- [ ] Input validation is present on all endpoints
- [ ] Authentication checks are in place where required
- [ ] Rate limiting is applied to sensitive endpoints
- [ ] No sensitive data in logs or error messages
- [ ] File uploads are validated and sanitized

## Testing

- API tests use Hurl (`api/tests/`)
- Run with `bun run test`
- When adding new endpoints, add corresponding test files

## Common Patterns

### Creating a New Page
1. Create component in `src/pages/`
2. Add route in `src/router.tsx`
3. Add translations in locale files
4. Ensure light/dark mode support

### Creating a New API Endpoint
1. Add route handler in `api/routes/`
2. Register in `api/routes.ts`
3. Add Zod validation schema
4. Update frontend API types (automatic via Hono RPC)

### Adding a New Store
1. Create store in `src/store/`
2. Follow existing store patterns (Zustand)
3. Export from store file

## What NOT to Do

1. **Never** modify encryption logic without explicit approval
2. **Never** log or store plaintext secrets server-side
3. **Never** send decryption keys to the server
4. **Never** bypass input validation
5. **Never** add dependencies without approval
6. **Never** modify unrelated code "while you're in there"
7. **Never** use `any` types in TypeScript
8. **Never** commit `.env` files or secrets
9. **Never** disable security features "temporarily"

## Quick Reference

### File Locations
- Frontend components: `src/components/`
- Page components: `src/pages/`
- API routes: `api/routes/`
- Database schema: `prisma/schema.prisma`
- Translations: `src/i18n/locales/`
- Stores: `src/store/`

### Key Files
- `src/lib/crypto.ts` - Client-side encryption
- `src/lib/api.ts` - API client
- `api/app.ts` - Backend setup
- `tailwind.config.js` - Design tokens

### Environment Variables
```bash
DATABASE_URL=        # SQLite connection string
BETTER_AUTH_SECRET=  # Auth secret key
```

---

*This document should be treated as the source of truth for development practices in this repository. When in doubt, ask for clarification rather than making assumptions.*
