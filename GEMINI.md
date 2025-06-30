# Gemini Workspace Configuration

This document outlines the best practices and guidelines for Gemini when working within the Hemmelig.app repository.

## Core Principles

- **Precision and Focus:** Only perform the changes explicitly requested by the user. Do not modify code, files, or configurations that are not directly related to the prompt, even if you identify potential improvements or refactoring opportunities.
- **Adhere to Conventions:** Strictly follow the existing coding styles, patterns, and architectural choices of the project.

## Technology Stack

This project is built with a specific stack. Adherence to its conventions is critical.

- **Frontend:** React with Vite and TypeScript (`.tsx`).
- **Backend:** Hono with RPC, running on Bun.
- **Styling:** Tailwind CSS.
- **Database:** PostgreSQL with Prisma ORM.
- **Linting/Formatting:** ESLint and Prettier.

## Guidelines

### General

- **No Unsolicited Changes:** Do not refactor, restyle, or optimize code unless specifically asked. If a change is requested for "file A," do not touch "file B" without permission.
- **Dependency Management:** Do not add, remove, or update any dependencies in `package.json` unless explicitly instructed to do so.
- **Tooling:** Use the existing project tools. Run `bun install`, `bun dev`, and `bun test` as needed.

### Frontend (React & Vite)

- **Component Structure:** Follow the existing component patterns in `src/components` and `src/pages`. Use functional components with hooks.
- **State Management:** Utilize the existing state management patterns, including `src/store/errorStore.ts` for global error state management.
- **Styling:** Apply styles using Tailwind CSS classes, following the conventions in existing components and `tailwind.config.js`.
- **API Interaction:** The frontend communicates with the backend via Hono's RPC client. Centralized error handling is implemented in `src/lib/api.ts`, and errors are displayed using `src/components/ErrorDisplay.tsx`. When making changes that affect the API, ensure the frontend client code is correctly aligned with the backend route definitions.
- **Internationalization (i18n):** All user-facing strings in React components must use `useTranslation` from `react-i18next` for internationalization. Ensure new strings are added to the appropriate JSON translation files (`src/i18n/locales/en/en.json`, `src/i18n/locales/es/es.json`, etc.) and referenced correctly.

### Backend (Hono RPC)

- **API Routes:** Define and modify API routes in the `api/` directory, primarily within `api/routes.ts` and the `api/routes/` subdirectory.
- **RPC Mode:** Remember that Hono is used in RPC mode. Backend routes are directly callable from the frontend client. Maintain this contract.
- **Database:** All database interactions must go through the Prisma client. The schema is defined in `prisma/schema.prisma`. When making model changes, new migrations must be created correctly.
