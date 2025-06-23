# Agents Guide for Hemmelig.app

## Build, Lint, Test Commands
- Build: `bun run build` (TypeScript compilation)
- Start: `bun run start` (runs migrations and starts app)
- Dev: `bun run dev` (runs migrations and starts app in watch mode)
- Test: `hurl api/tests` (runs all API tests)
- Run single test: Use Hurl test files in `api/tests/` and run `hurl <testfile>`

## Code Style Guidelines
- Formatting: Prettier with 4 spaces indent, semicolons, single quotes, max line width 100
- Imports: Organized by `prettier-plugin-organize-imports`
- TypeScript: Strict mode enabled, ESNext target, module resolution bundler
- Naming: Use camelCase for variables and functions, PascalCase for types and components
- Error Handling: Use try/catch for async operations, validate inputs with Zod
- Database: Use Prisma ORM with SQLite backend

## Environment
- Environment variables prefixed with `SECRET_` for configuration

## Cursor and Copilot Rules
- No `.cursor/rules/` or `.cursorrules` files found
- No `.github/copilot-instructions.md` found

## Notes
- Docker images are built and published via GitHub Actions workflows
- Use `npm run dev` or `bun run dev` for local development
- Tests are written as Hurl API tests in `api/tests/` directory

---

This file is intended for use by agentic coding agents working in this repository.

