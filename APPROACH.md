# How We're Approaching This Project

A concise guide to the thinking behind every decision. Read this before
touching any code on the new machine.

---

## The Core Idea to Never Forget

**Groups are never flattened until the very last moment.**

The whole design hinges on this. When a user adds "EU Banks" to the
recipients, the UI keeps it as a group — not as 9 individual emails. This
is what allows them to then say "...except Nathan". We only flatten to a
flat email list in two places:

1. The `finalEmails` computed signal in `InvitationStore`
2. The POST body sent to the API

Break this rule anywhere else and requirement #3 (member exclusion) falls apart.

---

## Development Order and Why

```
shared types  →  backend  →  backend tests  →  frontend store  →  frontend UI
```

**Why this order:**

- `packages/shared` first — both ends need the same `Contact`, `Group`,
  `Invitation` interfaces. Writing them once prevents drift.
- Backend before frontend — the API shape drives what the frontend consumes.
  Do it backwards and you'll refactor the API to fit the UI.
- Backend tests before frontend — e2e tests lock in the API contract. If
  the frontend later discovers a mismatch, the failing test tells you where.
- Store before components — `InvitationStore` is the frontend's source of
  truth. Writing it first (and unit-testing it) means all component work
  is just "wire up signals and render". Components become thin.

---

## State Management Philosophy

One service, `InvitationStore`, owns everything:

```
contacts / groups           ← address book (loaded from API once)
selectedIndividuals         ← req #1
selectedGroups              ← req #2 + #3 (each has excludedMemberIds: Set)
adHocEmails                 ← req #4
finalEmails (computed)      ← dedup of all three → req #5, API payload
emailsWithSources (computed)← same but with hints → review panel
```

**Signals over RxJS for state.** RxJS is only used where it genuinely helps:
HTTP calls (unavoidable) and debounced search inputs (if you add them later).
Everything else is `signal()` and `computed()`. Reason: signals are
synchronous, easy to read, and testable without `async/await` or marble
diagrams.

**OnPush everywhere.** Every component has `ChangeDetectionStrategy.OnPush`.
This means Angular only re-renders a component when its signal inputs change.
Keeps the app fast even with 20 contacts and multiple groups open.

**`inject()` over constructor injection.** All services are injected with
`inject(InvitationStore)` at the field level, not as constructor parameters.
This is the Angular 17 idiomatic style for standalone components.

---

## Backend Philosophy

**Keep it minimal.** The backend knows nothing about groups or exclusions.
It receives `{ emails: string[] }` and stores it. The frontend resolves
everything. This means:

- The API never changes when the UX logic changes
- The exclusion/dedup logic is entirely unit-testable in the frontend
- The backend stays a thin persistence layer

**Prisma with SQLite for the demo.** SQLite means zero infra — one `.db`
file, no Docker, no connection string fiddling. Swap to Postgres by changing
one line in `schema.prisma` when/if needed.

**Stable seed IDs.** The seed uses `contact_alice`, `group_eu_banks` etc.
instead of generated cuid(). This makes the database readable when
inspecting it, and makes e2e test assertions predictable.

---

## Testing Strategy

Two levels, different purposes:

**Frontend unit tests (`invitation.store.spec.ts`)** — test the logic, not
the framework. `InvitationStore` is instantiated as `new InvitationStore()`
(no TestBed). These tests run in milliseconds and cover every combination
of the dedup/exclusion rules. Write them before the UI; they tell you if
your state logic is correct before you've drawn a single pixel.

**Backend e2e tests (`app.e2e-spec.ts`)** — test the HTTP contract. Real
NestJS app, real SQLite database (`test.db`), real HTTP via supertest.
These tests own a separate database that is created fresh and deleted after
each run — never touch `dev.db`. They lock in what the API promises to
return so the frontend can rely on it.

**What we're not testing (yet):** component rendering, user interactions,
Angular template logic. That would require Karma/Cypress and is lower
priority for a demo assignment. If time allows, a Cypress smoke test of
the happy path (open dialog → add group → send → see 201) would be the
highest-value addition.

---

## Monorepo Structure Rationale

```
packages/shared   ← zero dependencies, just types + mock data
apps/backend      ← imports @mitigram/shared for type safety
apps/frontend     ← imports @mitigram/shared for type safety
```

`packages/shared` is the contract. If you change `Group.members` from
`GroupMember[]` to `string[]`, TypeScript will shout at both apps
simultaneously. This is the whole point of the shared package.

The path alias `"@mitigram/shared": ["../../packages/shared/src/index.ts"]`
in each app's `tsconfig.json` makes the import look clean. No relative
`../../../../packages/shared/src/...` paths.

---

## CSS Conventions

One rule: **use variables, never hex**.

```scss
/* ✅ correct */
color: var(--headline);
border: 1px solid var(--line);

/* ❌ wrong */
color: #235565;
border: 1px solid #C6C6C6;
```

All variables are defined in `apps/frontend/src/styles.scss`. If you need
a new colour, add it there with a semantic name. This makes the design
consistent and makes global theme changes a one-file edit.

---

## The Google Drive Problem

`G:\My Drive\Assignment` is synced by Google Drive. Google Drive watches
for file changes and syncs them in real time. `npm install` writes thousands
of small files very fast — GDrive intercepts these writes, causing
`TAR_ENTRY_ERROR` and half-extracted packages.

**Every time you run `npm install`:**
1. Right-click GDrive tray → Pause syncing
2. `npm install`
3. Right-click GDrive tray → Resume syncing

There is no workaround that avoids this. It is a known GDrive limitation
with any tool that does high-frequency small-file writes.

After pausing and reinstalling, also run:
```bash
cd apps/backend
npx prisma db push   # regenerates the client at generated/client/
npm run db:seed      # populates dev.db
```

---

## What to Do First on the New Machine

1. Clone the repo from GitLab (URL in `HANDOFF.md` / `CLAUDE.md`)
2. **Pause Google Drive sync**
3. `npm install` from repo root
4. Resume sync
5. `cd apps/backend && npx prisma db push && npm run db:seed`
6. `npm run dev` from root → backend on :3000, frontend on :4200
7. Open `http://localhost:4200`, click "Invite counterparties", exercise all 5 requirements
8. `npm run test:e2e` from `apps/backend` — should be 30 passing
9. `npm run test:unit` from `apps/frontend` — should be 40 passing

If anything is broken, the tests will tell you exactly where. Don't debug
the UI until the tests pass — the tests are faster feedback.

---

## UI Polish Decisions

**Loading skeleton** — while contacts/groups load from the API, the dialog
shows shimmer placeholder rows instead of a spinner or plain text. Uses a
single CSS `@keyframes shimmer` animation on elements sized to match the real
content. Declared directly in the dialog component styles so it's
self-contained.

**Auto-focus** — `AdHocEmailInputComponent` implements `AfterViewInit` and
calls `.focus()` on the `#inputEl` `@ViewChild`. The user can start typing an
email the moment the dialog finishes loading, without clicking first.

**Responsive stacking** — below 600 px the address book and recipients panels
stack vertically (column flex-direction) rather than sitting side by side. Each
zone gets a `max-height` and the column wrapper becomes scrollable. The
breakpoint is in the dialog component's inline styles — no global media query
needed.

## Remaining Work (Prioritised)

| Priority | Task | Why |
|---|---|---|
| 1 | Git commit + push to GitLab | Nothing is safe until it's in the remote |
| 2 | Smoke-test end to end manually | Confirm the wiring actually works after clean install |
| 3 | Cypress happy-path smoke test | Nice to have — open dialog → add group → send → assert 201 |

**Commit frequently and with intent.** The reviewer will read the git log.
Each commit should represent one coherent change: `feat: add group exclusion`,
`test: cover dedup edge cases`, not `wip` or `fix stuff`.
