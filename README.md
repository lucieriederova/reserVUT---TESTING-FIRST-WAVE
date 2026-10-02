# reserVUT

Room reservation system built for a student organisation at VUT Brno (Technická fakulta FP / ESBD). Students, "Leaders" (CEO role), Guides and a Head Admin book shared rooms on a weekly calendar, with a role-based priority system that lets higher-priority bookings automatically override ("preempt") lower-priority ones.

## Architecture

Monorepo with two independently deployable apps:

```
reserVUT 2.0/
├── BACKEND/    Express + TypeScript REST API
└── FRONTEND/   React + TypeScript SPA (Vite)
```

### Backend (`BACKEND/`)

- **Stack:** Express 4, TypeScript, Prisma ORM, PostgreSQL, [Resend](https://resend.com) for transactional email.
- **Entry point:** [`src/server.ts`](BACKEND/src/server.ts) — mounts routes under `/api`, configures CORS, and starts the HTTP server.
- **Layout:** `routes/` → `controllers/` → `services/`.
  - `controllers/` hold the HTTP handlers (`authController`, `reservationController`, `roomPolicyController`).
  - `services/db.ts` is the shared Prisma connection singleton.
  - `services/memoryStore.ts` is a **fully-functional in-memory fallback** — if `DATABASE_URL` isn't set, or the DB connection fails, every endpoint keeps working against process memory instead of Postgres. This makes local development and preview deploys possible without provisioning a database, but note that in-memory state is lost on every restart.
  - `services/emailService.ts` sends welcome/confirmation/cancellation/preemption emails (best-effort, non-fatal — see the file's docblock).
  - `services/priorityEngine.ts` and `services/roomPolicyStore.ts` hold priority scoring and the in-memory room registry, respectively.
- **Data model:** see [`prisma/schema.prisma`](BACKEND/prisma/schema.prisma) — `User`, `Reservation`, `AuditLog`.
- **Core business rule (booking priority):** each role has a fixed priority (`STUDENT` < `CEO` < `GUIDE` < `HEAD_ADMIN`). Creating a reservation that overlaps an existing one in the same room preempts (cancels) the existing reservation *only if* the new booking's role priority is strictly higher; otherwise the request is rejected with a 409 conflict. `GLOBAL_EVENT` bookings (Head Admin only) are informational and skip room-conflict checks entirely. See [`reservationController.createReservation`](BACKEND/src/controllers/reservationController.ts) and [`memoryStore.validateReservation`](BACKEND/src/services/memoryStore.ts).

### Frontend (`FRONTEND/`)

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS, [Supabase](https://supabase.com) (auth only — app data goes through the backend, not Supabase's database).
- **Entry point:** [`src/App.tsx`](FRONTEND/src/App.tsx) — owns session/reservation/room state and routes between `LoginView` / `SignUpView` / `StudentView` (Student, Leader, Guide) / `HeadAdminView`.
- **`src/lib/api.ts`** is the only place that talks to the backend; **`src/lib/supabase.ts`** is the only place that talks to Supabase.
- A mock mode (`VITE_USE_MOCK_API=true`) runs the whole UI against fixture data in `src/lib/mockData.ts`, with no backend or Supabase project required — useful for pure UI work.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (optional for local dev — the backend works without one; required for persistent/production use). The project was built against a [Supabase](https://supabase.com) Postgres instance.
- A Supabase project (for frontend authentication).
- A [Resend](https://resend.com) API key (optional — only needed to actually send emails).

## Installation

```bash
cd BACKEND && npm install
cd ../FRONTEND && npm install
```

## Environment variables

Copy the example files and fill in real values — **never commit `.env`** (see [Security notes](#security-notes) below).

```bash
cp BACKEND/.env.example BACKEND/.env
cp FRONTEND/.env.example FRONTEND/.env
```

| File | Variable | Required | Notes |
|---|---|---|---|
| `BACKEND/.env` | `DATABASE_URL` | No | Pooled Postgres connection string (Prisma runtime). Omit to run on the in-memory store. |
| | `DIRECT_URL` | No | Direct (non-pooled) connection, used by `prisma migrate`. |
| | `PORT` | No | Defaults to `5001`. |
| | `ALLOWED_ORIGINS` | No | Comma-separated list of extra CORS origins. |
| | `HEAD_ADMIN_EMAIL` | No | Email granted the HEAD_ADMIN role. Must match the frontend's `VITE_HEAD_ADMIN_EMAIL`. |
| | `RESEND_API_KEY` | No | Enables outgoing email. |
| | `EMAIL_FROM` | No | "From" address for outgoing email. |
| `FRONTEND/.env` | `VITE_SUPABASE_URL` | **Yes** | Supabase project URL. |
| | `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key. |
| | `VITE_API_URL` | No | Backend base URL, defaults to `http://localhost:5001/api`. |
| | `VITE_USE_MOCK_API` | No | `true` to run against local mock data instead of the backend. |
| | `VITE_HEAD_ADMIN_EMAIL` | No | Must match the backend's `HEAD_ADMIN_EMAIL`. |

Full details and defaults are in [`BACKEND/.env.example`](BACKEND/.env.example) and [`FRONTEND/.env.example`](FRONTEND/.env.example).

## Running locally

Two terminals:

```bash
# Terminal 1 — backend (http://localhost:5001)
cd BACKEND
npm run db:generate   # only needed once, or after editing prisma/schema.prisma
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd FRONTEND
npm run dev
```

If `DATABASE_URL` is set, apply the schema once with `npm run db:push` (or `npm run db:migrate` for a tracked migration) from `BACKEND/`.

## Running tests

```bash
cd BACKEND
npm test         # runs once (vitest run)
npm run test:watch
```

Coverage focuses on the reservation priority/preemption engine and role-based validation rules in [`services/memoryStore.ts`](BACKEND/src/services/memoryStore.ts), [`services/priorityEngine.ts`](BACKEND/src/services/priorityEngine.ts), [`services/roomPolicyStore.ts`](BACKEND/src/services/roomPolicyStore.ts), and the HEAD_ADMIN role-gating in [`controllers/authController.ts`](BACKEND/src/controllers/authController.ts) — the parts of the codebase most likely to break silently during a migration. Express route handlers, the frontend and email sending are not yet covered.

## Building for production

```bash
cd BACKEND && npm run build   # currently a no-op; the app runs via tsx directly (see "start")
cd FRONTEND && npm run build  # tsc -b && vite build → FRONTEND/dist
```

The backend is deployed to [Railway](https://railway.app) (see [`BACKEND/railway.json`](BACKEND/railway.json)/[`nixpacks.toml`](BACKEND/nixpacks.toml)) and started with `npx prisma generate && npx tsx src/server.ts`. The frontend is a static Vite build (`FRONTEND/dist`), deployable to any static host — `server.ts`'s CORS config assumes Vercel (any `*.vercel.app` origin is allowed by default).

## API overview

All routes are mounted under `/api` (see [`server.ts`](BACKEND/src/server.ts)):

| Route | Purpose |
|---|---|
| `POST /api/auth/login` | Sync a Supabase-authenticated user into the app's own user store. |
| `GET /api/auth/users` | List all users (Head Admin). |
| `PATCH /api/auth/users/:id/role` | Change a user's role (Head Admin). |
| `PATCH /api/auth/users/:id/verify` | Mark a CEO/GUIDE account verified (Head Admin). |
| `GET /api/reservations` | List reservations, optional `?roomName=`. |
| `POST /api/reservations` | Create a reservation (priority-preemption logic applies). |
| `GET /api/reservations/:id` | Fetch one reservation. |
| `DELETE /api/reservations/:id` | Cancel a reservation. |
| `GET /api/rooms` | List rooms, optional `?role=` filter. |
| `POST /api/rooms` / `PATCH /api/rooms/:roomName` / `DELETE /api/rooms/:roomName` | Room policy management (Head Admin). |
| `GET /api/health` | Health check. |

## Security notes

- `.env` files are excluded from new commits via `.gitignore`, but **both `BACKEND/.env` and `FRONTEND/.env` were committed in this repository's initial commit** and remain in git history — including a live database connection string. Treat that password as compromised: rotate it in Supabase, then scrub it from history (e.g. `git filter-repo`) before making the repository public or handing it to a new team.
- The repository's `node_modules` and build output (`dist/`) directories were also committed to git prior to `.gitignore` being added. This should be cleaned up (`git rm -r --cached`) as part of any migration — see the migration checklist provided separately.
