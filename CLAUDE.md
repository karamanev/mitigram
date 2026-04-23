# CLAUDE.md

Project context for the **Mitigram Invite Workflow** assignment.
Read this first before making changes. Keep it updated as decisions evolve.

---

## What we're building

A redesigned "Invite counterparties" workflow for Mitigram. A user clicks
**Invite** on an instrument → a modal opens → the user assembles a list of
recipients from (a) individual contacts, (b) named groups, (c) ad-hoc emails
→ reviews the final deduplicated email list → sends.

### The 5 requirements (from the assignment)

1. Invite individual counterparties from an address book
2. Invite **groups** from an address book
3. **Exclude individual group members** from the invitation
4. Invite **ad-hoc individuals** not in the address book by entering an email
5. **See all emails** being invited before sending

---

## Repository

The project is hosted on GitLab:
**https://gitlab.codexio.bg/georgi.karamanev/mitigram**

Clone / set as remote:

```bash
git remote add origin git@gitlab.codexio.bg:georgi.karamanev/mitigram.git
# or, over HTTPS:
git remote add origin https://gitlab.codexio.bg/georgi.karamanev/mitigram.git
```

- Default branch: `main`
- Use conventional-commit messages (see *Code conventions*).
- Push early and often — even scaffolding commits. The review is likely to
  skim the git history, so keep commits small and meaningful.

---

## Core UX concept

A single modal (no wizard) with three zones:

- **Zone A — Ad-hoc email input.** Type email → Enter/comma/Tab → chip.
  Validated, deduped silently.
- **Zone B — Address book.** Two tabs: *Individuals* and *Groups*, each
  searchable. Click to add. A group is added as a **single group card**, not
  exploded into members.
- **Zone C — Recipients list.** Source of truth. Three entry types:
  - Individual chip (email, removable)
  - Ad-hoc chip (visually distinct — dashed border)
  - Group card (expandable; checkboxes per member; unchecking = exclusion)

**Footer.** Live count of unique emails + primary **Send invitations** button.
Clicking opens a **review panel** showing the flat, deduplicated final email
list with a source hint per email (`from group "EU Banks"`, `ad-hoc`, etc.).
This satisfies requirement #5.

### Why groups stay as groups in the UI

Preserving the group concept lets the user reason about *why* someone is
invited and lets them exclude members without losing the grouping. We only
flatten to a unique email list at the send/review step.

---

## Architecture

Monorepo, two apps:

```
mitigram-invite/
├── apps/
│   ├── frontend/   # Angular 17+ (standalone components, signals)
│   └── backend/    # NestJS + Prisma + SQLite
├── packages/
│   └── shared/     # shared TS types (Contact, Group, Invitation DTOs)
├── package.json    # workspaces
└── README.md
```

- **Frontend:** Angular 17+, standalone components, signals for state,
  OnPush change detection, plain SCSS + CSS variables from the styleguide.
  No Angular Material.
- **Backend:** NestJS (Angular-style DI/modules on the server), Prisma ORM,
  SQLite for the demo (swap to Postgres via Prisma provider for prod).
- **Shared types:** `packages/shared` exports interfaces used by both ends
  so the contract stays in one place.

---

## Data model (Prisma)

```prisma
model Contact {
  id     String        @id @default(cuid())
  name   String
  email  String        @unique
  groups GroupMember[]
}

model Group {
  id      String        @id @default(cuid())
  name    String
  members GroupMember[]
}

model GroupMember {
  contactId String
  groupId   String
  contact   Contact @relation(fields: [contactId], references: [id])
  group     Group   @relation(fields: [groupId], references: [id])
  @@id([contactId, groupId])
}

model Invitation {
  id           String   @id @default(cuid())
  instrumentId String
  emails       String   // JSON array of strings
  sentAt       DateTime @default(now())
}
```

---

## API surface

```
GET  /api/contacts
GET  /api/groups                 # includes member ids
POST /api/instruments/:id/invitations
     body: { emails: string[] }
     → 201 { id, sentAt, emails }
```

The backend does **not** know about groups/exclusions at send time — the
frontend resolves everything to a flat `emails[]` and posts that. Keeps the
API minimal and the client logic testable.

---

## Frontend state

One `InvitationStore` service with signals:

```ts
selectedIndividuals = signal<Contact[]>([]);
selectedGroups      = signal<SelectedGroup[]>([]); // has excludedMemberIds: Set<string>
adHocEmails         = signal<string[]>([]);

finalEmails = computed(() => {
  const set = new Set<string>();
  this.selectedIndividuals().forEach(c => set.add(c.email));
  this.selectedGroups().forEach(g =>
    g.members
      .filter(m => !g.excludedMemberIds.has(m.id))
      .forEach(m => set.add(m.email))
  );
  this.adHocEmails().forEach(e => set.add(e));
  return [...set];
});
```

The `computed` is the whole dedup + exclusion logic in one place. Unit-test
this in isolation before touching UI.

---

## Component tree

```
InviteDialogComponent
├── AdHocEmailInputComponent
├── AddressBookPanelComponent
│   ├── IndividualsTabComponent
│   └── GroupsTabComponent
├── RecipientsPanelComponent
│   ├── IndividualChipComponent
│   ├── AdHocChipComponent
│   └── GroupCardComponent         # expandable, per-member exclude
└── ReviewAndSendComponent
```

All components standalone, `ChangeDetectionStrategy.OnPush`.

---

## Styling conventions

Expose the styleguide as CSS variables in `styles.scss`:

```scss
:root {
  --primary:        #2CABD3;
  --primary-dark:   #177998;
  --headline:       #235565;
  --text:           #5D5D5D;
  --line:           #C6C6C6;
  --bg-grey:        #EFEFEF;
  --notification:   #F96429;
  --unread:         #EBFAFF;
  --menu-dark:      #084153;
  --menu-highlight: #0F586F;
}
```

**Never hardcode hex values in components.** If you need a new shade, add it
to the root and give it a semantic name.

---

## Mock data

We're **not** using any external starter. All sample data is authored by us
and lives in `apps/backend/prisma/seed.ts`. The goal is a dataset rich
enough to exercise every requirement without being noisy.

### Shape & volume

- **~20 contacts** with realistic names and plausible bank/corporate
  emails (e.g. `alice.schmidt@deutschebank.de`).
- **5–6 groups** that reflect realistic business groupings:
  - `EU Banks` (large — 8+ members)
  - `Asian Banks` (medium — 4–5 members)
  - `US Banks` (medium — 4–5 members)
  - `Top Tier` (small, cross-cuts with the regional groups — so at least
    one contact is in multiple groups)
  - `Favourites` (small, overlaps with others — drives the dedup demo)
- **Overlap is intentional.** At least 2–3 contacts should belong to
  multiple groups so requirement #3 (exclusion) and the dedup logic in
  `finalEmails` are visibly exercised in the UI.
- **A few contacts with awkward edge cases:** long names, an email with a
  `+` alias, a non-ASCII name — purely for UI polish testing.

### Conventions for the seed file

- Stable, readable IDs (`contact_alice`, `group_eu_banks`) — makes tests
  and screenshots easier to reason about. No `cuid()` in the seed.
- No real people's emails. Use fabricated domains like
  `@example-bank.com`, `@demo-corp.eu`.
- Seed is **idempotent**: `prisma migrate reset --force && npm run db:seed`
  must produce the exact same dataset every time.
- Keep the seed file a single TypeScript module — no JSON imports, no
  external data files. Easy to diff, easy to extend.

### Frontend during early development

Before the backend is wired, the frontend can import a typed mock from
`packages/shared/src/mock.ts` so UI work isn't blocked on API calls. Once
the backend exists, the same data is used to build the Prisma seed and the
frontend switches to real HTTP. **The mock lives in `shared`, not in the
frontend**, so there's one source of truth.

---

## Code conventions

- TypeScript **strict** on both ends.
- Angular: standalone components, signals over RxJS where possible,
  OnPush change detection, prefer `inject()` over constructor params.
- NestJS: feature modules (`contacts`, `groups`, `invitations`),
  DTOs with `class-validator`, services thin, controllers thinner.
- File naming: `kebab-case.ts`, component class `PascalCase`.
- No `any`. Use `unknown` + narrow if you must.
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`).

---

## Assumptions (documented in README)

- Address book is read-only in this workflow (no editing contacts/groups
  from the invite dialog).
- Send is **simulated** — backend stores the invitation, no actual email
  dispatch.
- A contact in multiple selected groups is invited once (dedup by email).
- Ad-hoc emails aren't persisted to the address book.
- Excluding a member from one selected group does not exclude them from
  another selected group that contains them — the review step surfaces the
  final list so the user can reconcile.
- No auth — single-user demo.

---

## Out of scope (for now)

- Deployment / hosting configs — deferred.
- Docker / docker-compose — deferred.
- Real email sending.
- Authentication & multi-tenancy.
- Editing the address book from the invite dialog.
- Persisting ad-hoc emails back into the address book.

---

## Running locally *(to be filled in once scaffolded)*

```bash
# install
npm install

# dev (frontend + backend in parallel)
npm run dev

# frontend only
npm run dev:fe       # → http://localhost:4200

# backend only
npm run dev:be       # → http://localhost:3000

# seed the db
npm run db:seed
```

---

## How to help on this project

When assisting with code changes:

1. **Preserve the group-with-exclusions concept.** Never prematurely flatten
   groups to emails in the UI state — flattening happens only in the
   `finalEmails` computed and at send.
2. **Use signals** for local state. Reach for RxJS only when streaming
   (HTTP, debounced search input, etc.) genuinely helps.
3. **Use CSS variables** from the styleguide. Never hardcode hex values in
   components.
4. **Keep the API minimal.** Resist adding endpoints until a real need shows
   up. Groups/exclusions are a frontend concern.
5. **Ask before adding dependencies.** The stack is intentionally small.
6. **Keep assumptions in the README** updated as they evolve.

---

## Open questions / TODOs

- [x] Scaffold the monorepo (Angular + NestJS + shared package)
- [x] Write the Prisma seed with our own mock data (see "Mock data" section)
- [x] Wire the `InvitationStore` with unit tests for `finalEmails`
- [x] Build the three zones of the dialog
- [x] Implement the review + send step
- [x] Polish per the styleguide
- [ ] Smoke-test the full flow end to end (run `npm run dev`, open :4200, exercise all 5 requirements manually)
- [ ] Add deployment config (deferred)
