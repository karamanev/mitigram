# Mitigram — Invite Counterparties Workflow

A redesigned "Invite counterparties" feature for Mitigram, built as a
full-stack monorepo: Angular 17 frontend + NestJS backend + shared TypeScript
types.

---

## Requirements covered

| # | Requirement | Where |
|---|---|---|
| 1 | Invite individual counterparties from an address book | *Individuals* tab → click to add → chip in Recipients panel |
| 2 | Invite groups from an address book | *Groups* tab → click to add → group card in Recipients panel |
| 3 | Exclude individual group members from the invitation | Expand a group card → uncheck a member → strikethrough + removed from count |
| 4 | Invite ad-hoc individuals not in the address book | Type email in the top input → Enter / comma / Tab → dashed chip |
| 5 | See all emails being invited before sending | "Send invitations" → Review panel with every email and its source |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17.3, standalone components, signals, OnPush |
| Backend | NestJS 10, Prisma 5, SQLite |
| Shared types | `packages/shared` — consumed by both apps |
| Styling | Plain SCSS + CSS custom properties — no UI library |
| Backend tests | Jest + Supertest (e2e, 31 tests) |
| Frontend tests | Jest (unit, 30 tests — InvitationStore logic) |
| Browser tests | Playwright (15 tests — all 5 requirement flows) |

---

## Running with Docker

The quickest way to run the full stack with no local Node setup:

```bash
docker compose up --build
```

- Frontend → http://localhost:4200
- Backend  → http://localhost:3000

The backend container runs `prisma db push` and seeds the database on every start (both operations are idempotent). The SQLite file lives inside the container — add the `volumes` block in `docker-compose.yml` to persist it across restarts.

---

## Running locally

### Prerequisites

- Node.js 20+
- npm 10+

> **Google Drive users:** if the project lives inside a synced Google Drive
> folder, pause sync before running `npm install` — GDrive's real-time file
> watcher corrupts npm's extraction. Resume sync once install completes.

### 1. Install

```bash
npm install
```

### 2. Initialise the database

```bash
cd apps/backend
npx prisma db push   # creates dev.db and generates the Prisma client
npm run db:seed      # seeds 20 contacts and 5 groups
cd ../..
```

### 3. Start

```bash
npm run dev
```

- Frontend → <http://localhost:4200>
- Backend  → <http://localhost:3000>

Or start each separately:

```bash
npm run dev:be   # backend only
npm run dev:fe   # frontend only
```

---

## Running the tests

```bash
# Backend — 31 e2e tests (spins up real app + SQLite test.db)
cd apps/backend
npm run test:e2e

# Frontend — 30 unit tests (InvitationStore signal logic, no DOM)
cd apps/frontend
npm run test:unit

# Playwright browser tests — all 5 requirement flows (requires stack running)
npm start &          # start backend + frontend first
npm run test:e2e     # headless, from root
npm run test:e2e:headed  # headed — watch the browser
```

---

## Project structure

```
mitigram-invite/
├── packages/shared/        shared TypeScript interfaces + mock data
├── apps/backend/           NestJS API (port 3000)
│   ├── prisma/             schema + seed
│   ├── src/
│   │   ├── contacts/       GET /api/contacts
│   │   ├── groups/         GET /api/groups
│   │   └── invitations/    POST /api/instruments/:id/invitations
│   └── test/               backend e2e specs (Jest + Supertest)
├── apps/frontend/          Angular app (port 4200)
│   └── src/app/
│       ├── store/          InvitationStore (signals)
│       ├── services/       ApiService (HTTP)
│       └── components/     InviteDialog + all child components
└── e2e/                    Playwright browser tests (all 5 req flows)
    └── tests/
        └── invite-workflow.spec.ts
```

---

## API

```
GET  /api/contacts
     200 Contact[]  — sorted by name

GET  /api/groups
     200 Group[]    — sorted by name, members nested

POST /api/instruments/:id/invitations
     body  { emails: string[] }   — must be non-empty, each a valid email
     201   { id, instrumentId, emails, sentAt }
     400   validation error
```

The backend receives a flat, deduplicated `emails[]`. Group membership,
exclusions, and deduplication are resolved entirely in the frontend's
`InvitationStore.finalEmails` computed signal before the POST is made.

---

## Architecture decisions

### Groups stay as groups in the UI state

`InvitationStore` holds a `selectedGroups: SelectedGroup[]` where each entry
keeps the full member list alongside an `excludedMemberIds: Set<string>`. The
UI never collapses a group into emails — that happens only in the `finalEmails`
computed signal. This is what makes per-member exclusion (req #3) possible
without losing context.

### Single store, signal-based

One `InvitationStore` service (Angular's `providedIn: 'root'`) holds all
invitation state. Components inject it directly and read signals in their
templates. No prop-drilling, no `@Input` chains through multiple levels, no
RxJS `BehaviorSubject`.

### Backend knows nothing about groups

The API receives `{ emails: string[] }` and stores it. It has no concept of
groups, exclusions, or deduplication. This keeps the API stable: any UX
change to how groups work requires zero backend changes.

### Shared types as the contract

`packages/shared` exports the interfaces used by both apps. A breaking change
to `Group.members` will cause TypeScript errors in both `apps/backend` and
`apps/frontend` simultaneously, making regressions visible at compile time.

---

## Assumptions

- Address book is **read-only** in this workflow — no editing contacts or
  groups from the invite dialog.
- Send is **simulated** — the backend stores the invitation row; no actual
  email is dispatched.
- A contact appearing in multiple selected groups is invited **once**
  (deduplicated by email address).
- Ad-hoc emails are **not** persisted to the address book.
- Excluding a member from *Group A* does not exclude them from *Group B*
  if both groups are selected. The review panel shows the final resolved list
  so the user can see the actual outcome and act accordingly.
- No authentication — single-user demo.
- SQLite for the demo. Swap to Postgres by changing `provider = "postgresql"`
  and updating `DATABASE_URL` in `.env`.
