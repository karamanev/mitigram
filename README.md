# Mitigram - Invite Counterparties Workflow

A redesigned "Invite counterparties" feature for Mitigram, built as a
full-stack monorepo: Angular 17 frontend and ASP.NET Core 10 backend.

---

## Requirements covered

| # | Requirement | Where |
|---|---|---|
| 1 | Invite individual counterparties from an address book | `Individuals` tab -> click to add -> chip in Recipients panel |
| 2 | Invite groups from an address book | `Groups` tab -> click to add -> group card in Recipients panel |
| 3 | Exclude individual group members from the invitation | Expand a group card -> uncheck a member -> removed from final count |
| 4 | Invite ad-hoc individuals not in the address book | Type email in the top input -> Enter / comma / Tab -> dashed chip |
| 5 | See all emails being invited before sending | `Send invitations` -> review panel with every email and its source |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17.3, standalone components, signals, OnPush |
| Backend | ASP.NET Core 10, Entity Framework Core 9, SQLite |
| Types | `apps/frontend/src/app/types.ts` |
| Styling | Plain SCSS and CSS custom properties |
| Tests | Jest frontend unit tests and xUnit backend API tests |

---

## Running with Docker

The quickest way to run the full stack:

```bash
docker compose up --build
```

- Frontend: http://localhost:4200
- Backend: http://localhost:3000

On startup the backend calls `EnsureCreated()` and seeds demo contacts and groups.

---

## Running checks locally

```bash
# Frontend
cd apps/frontend
npm install
npm run lint
npm run test:unit
npm run build

# Backend
dotnet test apps/backend.Tests/MitigramApi.Tests.csproj
dotnet build apps/backend/MitigramApi.csproj -c Release
```

---

## Project structure

```text
apps/
  backend/         ASP.NET Core API
  backend.Tests/   xUnit API tests
  frontend/        Angular app
```

Backend code lives under:

- `apps/backend/Controllers`
- `apps/backend/Data`
- `apps/backend/Dtos`
- `apps/backend/Models`

Frontend code lives under:

- `apps/frontend/src/app/components`
- `apps/frontend/src/app/services`
- `apps/frontend/src/app/store`
- `apps/frontend/src/app/types.ts` — domain interfaces
- `apps/frontend/src/app/mock.ts` — test fixtures

---

## API

```text
GET  /api/contacts
GET  /api/groups
POST /api/instruments/:id/invitations
```

`POST /api/instruments/:id/invitations`

- Request body: `{ emails: string[] }`
- `201`: invitation created
- `400`: validation error
- `409`: one or more recipients were already invited for the same instrument

The backend receives a flat deduplicated `emails[]` list. Group handling and
member exclusion are resolved in the frontend store before the request is sent.

---

## Notes

- Duplicate invites for the same instrument are rejected by the backend.
- The frontend surfaces duplicate-invite conflicts as a toast-style alert in the review step.
- SQLite is used for the demo. The default connection string is in `apps/backend/appsettings.json`.
