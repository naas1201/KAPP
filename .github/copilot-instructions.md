## Repo overview

- Monorepo-style Next.js 15 app using the App Router under `src/app`.
- Core AI code lives in `src/ai/*` and is implemented with `genkit` + `@genkit-ai/google-genai` (see `src/ai/genkit.ts`).
- Firebase is used for auth and Firestore; client entry is `src/firebase/client.ts` and config in `src/firebase/config.ts`.
- Shared React primitives and UI live under `src/components` (notably `src/components/ui/*`).

## Quick commands

- Install: `pnpm install` (project uses `pnpm` in `package.json` build script).
- Run app locally: `pnpm dev` (starts Next dev server on port 9002 by default).
- Run GenKit AI dev server: `pnpm genkit:dev` (runs `src/ai/dev.ts` — hot-reloads GenKit flows when used with `genkit:watch`).
- Typecheck: `pnpm typecheck` (runs `tsc --noEmit`).
- Lint: `pnpm lint` (runs `next lint`).
- Build: `pnpm build` (runs `pnpm typecheck && next build`).
- E2E tests: `pnpm test:e2e` (runs Playwright tests; see `E2E_TESTING.md` for setup details).

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
- See `env.example` for a template of required environment variables.
- Firestore security rules are defined in `firestore.rules` — update them when adding new collections.

## Testing

- E2E tests use Playwright and run against Firebase emulators.
- Tests are located in `e2e/tests/` (e.g., `smoke.spec.ts`, `booking-and-approve.spec.ts`).
- Run `pnpm test:e2e` after setting up emulators (see `E2E_TESTING.md`).
- Use `data-testid` attributes for stable Playwright selectors — see existing conventions in `E2E_TESTING.md`.

## When in doubt

- Read `src/ai/flows/*` and `src/ai/genkit.ts` to match prompt/flow conventions.
- Prefer server-only placement for all AI/LLM operations.
- Confirm local commands with `package.json` scripts; the dev environment expects `pnpm`.

If anything here is unclear or you want the instructions to emphasize additional workflows (CI, test commands, or specific conventions), tell me what to expand and I will update this file.

## Additional documentation

- `docs/DEVELOPMENT_GUIDE.md` — Detailed guide for adding pages, components, and Firestore collections.
- `docs/STRIPE_SETUP.md` — Stripe payment integration instructions.
- `docs/STORAGE_SETUP.md` — Firebase Storage configuration.
- `docs/ADMIN_DOCTOR_SETUP.md` — Admin and doctor account setup.
- `E2E_TESTING.md` — End-to-end testing with Playwright and Firebase emulators.
