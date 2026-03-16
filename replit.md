# DojoOS

A comprehensive personal productivity and life-management system — an all-in-one "OS" for personal growth, inspired by Notion and Linear.

## Architecture

- **Frontend**: React 18 + Vite + TanStack Query + Wouter + Tailwind CSS + Radix UI / Shadcn
- **Backend**: Express.js + Passport.js (local auth + optional Google OAuth)
- **Database**: PostgreSQL via Drizzle ORM (`node-postgres` driver)
- **Dev server**: `tsx server/index.ts` which also serves the Vite dev middleware

## Project Structure

- `client/` — React frontend (pages, components, lib)
- `server/` — Express backend (routes, auth, storage, db)
- `shared/` — Shared TypeScript schemas (Drizzle + Zod)

## AI Features

- **AI Learning Trajectory Builder** (`server/ai.ts`, `client/src/components/ai-trajectory-builder.tsx`)
  - Uses `gemini-2.5-flash` with Google Search grounding
  - Multi-step dialog: goal → optional ToC → AI thinking → review & edit tree → accept
  - Generates complete chapter hierarchies for Second Brain, Languages, Studies, and Disciplines
  - Bulk creates all chapters via `POST /api/learn-plan-items/bulk`
  - Saves `trajectoryContext` (goal, context, structure, submoduleType, submoduleName) to parent entity
  - Accessible from the Learning Trajectory sidebar (header ✦ icon, empty state, footer)

- **AI Material Finder** (`client/src/components/ai-material-finder.tsx`)
  - 4 search types: YouTube videos (with thumbnails + coverage analysis), Websites, PDFs/Papers, Custom search
  - Optional user prompt to refine each search
  - Results shown as rich cards; user selects which to add; saved to DB as materials
  - Powered by `POST /api/ai/find-materials` endpoint
  - Accessible via sparkle (✦) button in the Materials section of every chapter
  - Uses stored `trajectoryContext` to make searches learner-aware (goal + level + subject)

### Important Database Note

The app uses `NEON_DATABASE_URL` for runtime connections but `DATABASE_URL` for `drizzle-kit push`. If adding new schema columns, run `npm run db:push` first; if drizzle-kit reports "no changes," add the columns directly via the Neon connection.

## Key Files

- `server/index.ts` — App entry point, wires everything together
- `server/routes.ts` — All REST API endpoints
- `server/auth.ts` — Passport local + Google OAuth strategies
- `server/db.ts` — PostgreSQL connection pool and Drizzle instance
- `server/storage.ts` — Database operations (IStorage interface)
- `server/ai.ts` — Gemini AI service (trajectory generation)
- `shared/schema.ts` — Database schema (30+ tables) and Zod validation

## Environment Variables / Secrets

- `DATABASE_URL` — PostgreSQL connection string (Replit managed)
- `SESSION_SECRET` — Express session secret (Replit managed)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Optional, for Google OAuth
- `CALLBACK_URL` — Google OAuth callback URL (optional)

## Running

```bash
npm run dev       # Start development server (port 5000)
npm run build     # Build for production
npm start         # Run production build
npm run db:push   # Push schema changes to database
```

## Notes

- Session store uses PostgreSQL (`connect-pg-simple`) when a `DATABASE_URL` is present
- Google OAuth is optional — the app works without it using local username/password auth
- The database connection uses `pg` (node-postgres) with `drizzle-orm/node-postgres`
