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
│   ├── frontend/         # Angular 17+ (standalone components, signals)
│   └── backend/          # ASP.NET Core 10 + EF Core + SQLite
└── docker-compose.yml
```

- **Frontend:** Angular 17+, standalone components, signals for state,
  OnPush change detection, plain SCSS + CSS variables from the styleguide.
  No Angular Material.
- **Backend:** ASP.NET Core 10 Web API, Entity Framework Core with SQLite.
  Schema is created via `EnsureCreated()` on startup; seeding runs
  automatically after. Port 3000. CORS allows `http://localhost:4200`.
- **Types:** `apps/frontend/src/app/types.ts` holds TypeScript interfaces
  (`Contact`, `Group`, `Invitation`, etc.). Referenced via the tsconfig path alias
  `@mitigram/shared`. Mock data for tests lives in `apps/frontend/src/app/mock.ts`.

---

## Data model

Four entities:

| Entity | Fields |
|---|---|
| `Contact` | `id`, `name`, `email` |
| `Group` | `id`, `name`, `members[]` |
| `GroupMember` | composite key `(contactId, groupId)` |
| `Invitation` | `id`, `instrumentId`, `emails` (JSON array), `sentAt` |

EF Core entity classes live in `apps/backend/Models/`. Schema is created
by `EnsureCreated()` on startup; no migration files.

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

We're **not** using any external starter. All sample data is authored by us.
The canonical seed lives in `apps/backend/Data/Seeder.cs`. The frontend's mock data mirror (used in unit tests) lives in `apps/frontend/src/app/mock.ts`. The goal is a
dataset rich enough to exercise every requirement without being noisy.

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

### Conventions for the seed

- Stable, readable IDs (`contact_alice`, `group_eu_banks`) — makes tests
  and screenshots easier to reason about.
- No real people's emails. Use fabricated domains like
  `@example-bank.com`, `@demo-corp.eu`.
- Seed is **idempotent**: the seeder checks `db.Contacts.Any()` and no-ops
  if data is already present.
- Keep the seed as a single self-contained file — no JSON imports, no
  external data files. Easy to diff, easy to extend.

---

## Code conventions

- TypeScript **strict** on the frontend; C# `<Nullable>enable</Nullable>` on the backend.
- Angular: standalone components, signals over RxJS where possible,
  OnPush change detection, prefer `inject()` over constructor params.
- C# backend: thin controllers, no service layer (simple enough not to need
  one), DTOs with Data Annotations, EF Core for persistence.
- C# naming: PascalCase classes/properties, file-scoped namespaces, primary
  constructors for DI.
- Frontend file naming: `kebab-case.ts`, component class `PascalCase`.
- No `any` in TypeScript. Use `unknown` + narrow if you must.
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

- Real email sending.
- Authentication & multi-tenancy.
- Editing the address book from the invite dialog.
- Persisting ad-hoc emails back into the address book.

---

## Running

```bash
docker compose up --build
```

- Frontend → http://localhost:4200
- Backend  → http://localhost:3000

The C# backend calls `EnsureCreated()` + `Seeder.SeedAsync()` on every start
(both are idempotent). The SQLite file lives inside the container; uncomment
the `volumes` block in `docker-compose.yml` to persist it across restarts.

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

## UI implementation notes

- **Loading skeleton** — while contacts/groups load from the API, the dialog shows shimmer placeholder rows. Uses a single CSS `@keyframes shimmer` animation declared directly in the dialog component styles.
- **Auto-focus** — `AdHocEmailInputComponent` calls `.focus()` on `#inputEl` in `AfterViewInit` so the user can type immediately without clicking.
- **Responsive stacking** — below 600 px the address book and recipients panels stack vertically. The breakpoint is in the dialog component's inline styles — no global media query.

---

## Open questions / TODOs

- [x] Scaffold the project (Angular frontend + ASP.NET Core backend)
- [x] Wire the `InvitationStore` with unit tests for `finalEmails`
- [x] Build the three zones of the dialog
- [x] Implement the review + send step
- [x] Polish per the styleguide
- [x] Add Docker / docker-compose config
- [ ] Smoke-test the full flow end to end (`docker compose up --build`, open :4200, exercise all 5 requirements manually)
