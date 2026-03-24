# Copilot Instructions for KinetiK

## Build, lint, and run commands

### Frontend (repository root)
- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Start built app: `npm run start`
- Lint: `npm run lint`

### Backend (`backend\`)
- Install deps: `pip install -r requirements.txt`
- Run API locally: `uvicorn main:app --reload`

### Tests
- There is currently no dedicated automated test command configured (`package.json` has no `test` script, and backend has no test suite files/config in repo).

## High-level architecture

- This is a split frontend/backend app:
  - Next.js App Router frontend in `app\`, `components\`, `lib\`
  - FastAPI + Neo4j backend in `backend\main.py`

- Routing is organized by route groups:
  - Public pages in `app\(public)\...` (landing, login, signup)
  - Authenticated pages in `app\(protected)\...` (dashboard, organizer views, onboarding, profile)

- Auth and profile flow:
  - `app\layout.tsx` wraps everything with `AuthProvider` from `lib\auth-context.tsx`
  - Firebase Auth handles sign-in state (`onAuthStateChanged`)
  - User profile data lives in Firestore (`users/{uid}`)
  - Onboarding/profile updates write to Firestore and then refresh auth-context profile state

- Backend integration flow:
  - Frontend calls FastAPI endpoints directly at `http://localhost:8000/...`
  - FastAPI uses Neo4j for graph data (events, skills, applications, recommendation queries)
  - Recommendations and organizer/volunteer dashboards are computed from Neo4j queries

- Data split to keep in mind:
  - Firestore: user profile and onboarding completion
  - Neo4j: skills graph, events, applications, matching/recommendations, analytics

## Key repository conventions

- Route protection is client-driven:
  - `middleware.ts` does not enforce auth; `app\(protected)\layout.tsx` + `useAuth()` redirects unauthenticated users.
  - `AuthProvider` also enforces onboarding redirect to `/onboarding` when profile is incomplete.

- API request patterns are not fully uniform; preserve existing endpoint contract per feature:
  - Many read endpoints send `Authorization: Bearer <firebase-id-token>`
  - Several write endpoints require `X-User-ID` header (e.g., skills sync, create event, apply, application status)
  - Keep the backend base URL explicit as `http://localhost:8000` unless you are intentionally introducing centralized API config.

- Skill normalization happens server-side:
  - Backend title-cases/strips skills before writing to Neo4j. Frontend typically sends raw comma-separated input converted to arrays.

- Imports and typing:
  - Use path alias `@/*` (configured in `tsconfig.json`) for internal imports.
  - TypeScript strict mode is enabled; however, some dashboard-heavy files intentionally use `any` with file-level ESLint disables.

- UI implementation style:
  - Tailwind utility-first styling with `lucide-react` icons is the dominant pattern.
  - Existing pages favor client components (`"use client"`) and local state/data fetching over server components.
