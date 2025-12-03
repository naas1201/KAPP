# Copilot Instructions for KAPP Medical Booking Application

> This document provides guidance for GitHub Copilot and other AI coding assistants working with this codebase.

## Repo overview

- **Framework**: Next.js 15 app using the App Router under `src/app`.
- **AI Integration**: Core AI code lives in `src/ai/*` and is implemented with `genkit` + `@genkit-ai/google-genai` (see `src/ai/genkit.ts`).
- **Backend**: Firebase for authentication (Auth) and database (Firestore); client entry is `src/firebase/client.ts` and config in `src/firebase/config.ts`.
- **UI Components**: Shared React primitives and UI live under `src/components` (notably `src/components/ui/*` using Shadcn/UI + Radix).
- **Styling**: Tailwind CSS for styling with configuration in `tailwind.config.ts`.

## Application Domain

This is a medical booking application (KAPP) with three user roles:
- **Admin**: Full access to manage staff, view all data, and configure the system.
- **Doctor**: Access to patient consultations, appointments, and their service configurations.
- **Patient**: Book appointments, view their own records and consultation history.

## Quick commands

- **Install dependencies**: `pnpm install` (project uses `pnpm` as package manager).
- **Run app locally**: `pnpm dev` (starts Next dev server on port 9002 by default).
- **Type checking**: `pnpm typecheck` (runs `tsc --noEmit`).
- **Linting**: `pnpm lint` (runs `next lint` with ESLint).
- **Build**: `pnpm build` (runs typecheck then `next build`).
- **Unit tests**: `pnpm test` (runs Jest tests in `__tests__/` directory).
- **Firestore rules tests**: `pnpm test:rules` (requires Firebase emulator running).
- **E2E tests**: `pnpm test:e2e` (runs Playwright tests; see `E2E_TESTING.md` for setup details).
- **GenKit AI dev server**: `pnpm genkit:dev` (runs `src/ai/dev.ts` — hot-reloads GenKit flows when used with `genkit:watch`).

### Firebase Emulator Setup

Before running tests or local development with emulators:

```bash
# Start Firebase emulators (Firestore + Auth)
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project

# Connect local dev server to emulators
FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 pnpm dev
```

## AI-specific patterns (very important)

- All AI flows are server-side. Files under `src/ai` use `use server` and expect server runtime. Example: `src/ai/dev.ts` and `src/ai/flows/generate-treatment-faq.ts`.
- `src/ai/genkit.ts` creates a singleton `ai` with plugins and the global model. When adding prompts or flows, import that `ai` instance.
- Preferred flow shape:
  - Define Zod input/output schemas (using `z` from `genkit`).
  - Create a `prompt` via `ai.definePrompt({ input: {schema}, output: {schema}, prompt: '...' })`.
  - Wrap logic in `ai.defineFlow({ name, inputSchema, outputSchema }, async input => { const {output} = await prompt(input); return output!; })`.

Example: `src/ai/flows/generate-treatment-faq.ts` — follow its structure when adding new flows.

## Server vs Client conventions

- Files that interact with browser APIs or React hooks are marked `use client`. UI components and Firebase hooks are client-side (`src/firebase/hooks.ts`, many `components/*`).
- AI and other secret-bearing code must remain server-side (`use server`). Do not move `genkit` flows to client files.

## Firebase integration notes

- Firebase is initialized in `src/firebase/client.ts` and exported `auth` and `firestore` for hooks and components to consume.
- Auth + Firestore patterns: `useUser`, `useDoc`, `useCollection`, and `useFirebase` provide standard subscriptions via `onAuthStateChanged` and `onSnapshot`.
- When adding new DB access, prefer using the provided hooks or the `firestore` instance from `src/firebase/client.ts`.

## Project structure / key files (quick map)

- `src/app` — Next.js App Router pages and layouts.
- `src/ai` — GenKit setup (`genkit.ts`), dev entry (`dev.ts`), and flows (`flows/*`).
- `src/components` — UI components + `ui` primitives (Radix + Tailwind).
- `src/firebase` — `client.ts`, `config.ts`, `hooks.ts` (auth/firestore helpers).
- `src/lib` — utilities and types used across the app.

## Notes for AI coding agents

- Keep changes minimal and consistent with existing patterns. If you add an AI flow,:
  - Put it in `src/ai/flows/`.
  - Use Zod schemas for input/output as in existing flows.
  - Import the shared `ai` from `src/ai/genkit.ts`.
  - Mark runtime as server (`'use server'`).
- Use explicit file references in PRs (for example: "Added `src/ai/flows/generate-X.ts` and updated `src/ai/genkit.ts` if model/plugin changes").
- When editing UI components, prefer `src/components/ui/*` primitives and Tailwind classes; keep styling inside `src/app/globals.css` and `tailwind.config.ts`.
- For local testing of AI flows use `pnpm genkit:dev`; this mirrors how flows are loaded in `src/ai/dev.ts`.

## Security & secrets

- The repo contains a `src/firebase/config.ts` file with API keys; avoid adding or hardcoding additional secrets. Use environment variables for new secrets and load them via `dotenv` (already used in `src/ai/dev.ts`).
- See `env.example` for a template of required environment variables (Stripe keys, Firebase config, Google AI keys).
- Firestore security rules are defined in `firestore.rules` — update them when adding new collections and add corresponding tests in `__tests__/firestore.rules.test.ts`.
- Always use role-based access control patterns following existing `isAdmin()`, `isDoctor()`, `isSignedIn()` helper functions in Firestore rules.

### Important Security Notes

- Never commit service account JSON files.
- The seeding script (`pnpm seed:prod-staff-accounts`) creates accounts with hard-coded passwords — change them immediately in production.
- Validate user roles server-side; don't trust client-side role checks for sensitive operations.

## Testing

### Unit Tests (Jest)

- Unit tests are in `__tests__/` directory using Jest with ts-jest preset.
- Current tests focus on Firestore security rules validation.
- Run with `pnpm test` or `pnpm test:rules` for rules-specific tests.
- Tests require Firebase emulator running: `firebase emulators:start --only firestore`.

### E2E Tests (Playwright)

- E2E tests are in `e2e/tests/` directory (e.g., `smoke.spec.ts`, `booking-and-approve.spec.ts`).
- Tests run against Firebase emulators for isolated, repeatable testing.
- Use `data-testid` attributes for stable Playwright selectors — see `E2E_TESTING.md` for conventions.
- Run with `pnpm test:e2e` after setting up emulators.

### Test Data IDs Convention

Key elements use `data-testid` for testing:
- Booking flow: `booking-date`, `booking-time-*`, `booking-fullname`, `booking-email`, `booking-phone`, `booking-submit`
- Doctor dashboard: `consultation-requests-table`, `consultation-approve-<id>`, `consultation-reject-<id>`
- Doctor services: `service-toggle-<id>`, `service-price-<id>`

## When in doubt

- Read `src/ai/flows/*` and `src/ai/genkit.ts` to match prompt/flow conventions.
- Prefer server-only placement for all AI/LLM operations.
- Confirm local commands with `package.json` scripts; the dev environment expects `pnpm`.

## Code Style Conventions

### TypeScript

- Use TypeScript strict mode; all files should pass `pnpm typecheck`.
- Define types in `src/lib/types.ts` for shared data structures.
- Use Zod schemas for runtime validation, especially for AI flow inputs/outputs.

### React Components

- Mark client components with `'use client'` directive.
- Mark server actions with `'use server'` directive.
- Use functional components with hooks; avoid class components.
- Prefer named exports for components.

### File Naming

- Pages: `page.tsx` within App Router directories.
- Components: PascalCase (e.g., `MyComponent.tsx`).
- Utilities: kebab-case (e.g., `my-utility.ts`).
- AI flows: kebab-case (e.g., `generate-treatment-faq.ts`).

### Imports

- Use `@/` path alias for imports from `src/` directory.
- Group imports: React/Next.js first, then external libraries, then internal modules.

## Common Development Tasks

### Adding a New Page

1. Create file in appropriate `src/app/[role]/` directory.
2. Use `'use client'` directive for interactive pages.
3. Follow the page template pattern from `docs/DEVELOPMENT_GUIDE.md`.
4. Add navigation link in the corresponding layout file.

### Adding a New Firestore Collection

1. Define TypeScript interface in `src/lib/types.ts`.
2. Add security rules in `firestore.rules`.
3. Add rule tests in `__tests__/firestore.rules.test.ts`.
4. Use `useDoc`/`useCollection` hooks for data access.

### Adding a New AI Flow

1. Create file in `src/ai/flows/` with `'use server'` directive.
2. Define Zod input/output schemas.
3. Create prompt with `ai.definePrompt()`.
4. Create flow with `ai.defineFlow()`.
5. Register in `src/ai/dev.ts` for local testing.

If anything here is unclear or you want the instructions to emphasize additional workflows (CI, test commands, or specific conventions), tell me what to expand and I will update this file.

## Additional documentation

- `docs/DEVELOPMENT_GUIDE.md` — Detailed guide for adding pages, components, and Firestore collections.
- `docs/STRIPE_SETUP.md` — Stripe payment integration instructions.
- `docs/STORAGE_SETUP.md` — Firebase Storage configuration.
- `docs/ADMIN_DOCTOR_SETUP.md` — Admin and doctor account setup.
- `E2E_TESTING.md` — End-to-end testing with Playwright and Firebase emulators.

## Debug Token

Firebase App Check debug token for development and testing: `F62EFE3C-5DF9-4636-ACBE-ED57D7793FB4`
