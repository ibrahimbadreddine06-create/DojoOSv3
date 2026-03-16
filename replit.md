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

## Key Files

- `server/index.ts` — App entry point, wires everything together
- `server/routes.ts` — All REST API endpoints
- `server/auth.ts` — Passport local + Google OAuth strategies
- `server/db.ts` — PostgreSQL connection pool and Drizzle instance
- `server/storage.ts` — Database operations (IStorage interface)
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
