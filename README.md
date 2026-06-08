# QuestSync

**Plan multiplayer sessions. Fill rosters. Track attendance.**

QuestSync is a full-stack event planning platform for gaming communities. Organizers create events, define roster slots, and manage registrations. Players discover sessions, set weekly availability, and join the games they care about.

Built as a TypeScript monorepo with a React client, Express API, and PostgreSQL database.

---

## Highlights

| For organizers | For players |
| --- | --- |
| Create and publish events | Browse, search, and filter events |
| Define roster slots per event | Set weekly availability windows |
| Approve registrations & assign roles | Register for open sessions |
| Drag-and-drop roster board | Track registration history |
| Generate PDF/DOCX reports | Export personal participation reports |
| Mark attendance after events | Theme & preference controls |

---

## Tech stack

**Frontend** — React 18 · Vite · TypeScript · Tailwind CSS · Redux Toolkit · React Router

**Backend** — Express · TypeScript · Prisma · PostgreSQL · Zod · JWT (httpOnly cookies)

**Reports** — jsPDF · docx · Nodemailer

---

## Architecture

```mermaid
flowchart LR
  subgraph client [Client :5173]
    UI[React UI]
    Redux[Redux Store]
    Services[API Services]
  end

  subgraph server [API :3001]
    Routes[Express Routes]
    Auth[JWT + RBAC]
    Prisma[Prisma ORM]
  end

  DB[(PostgreSQL)]

  UI --> Redux
  UI --> Services
  Services -->|REST /api| Routes
  Routes --> Auth
  Auth --> Prisma
  Prisma --> DB
```

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9+ (workspaces)
- **PostgreSQL** 14+ running locally or remotely

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/rasxcore/gaming-planner.git
cd gaming-planner
npm install
```

### 2. Configure environment

Copy the example env file to the **repo root**:

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://YOUR_LOGIN:YOUR_PASSWORD@localhost:5432/questsync
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-in-production
```

### 3. Prepare the database

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start development

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:5173 |
| API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

---

## Demo accounts

All seeded users share the password **`Password123!`**

| Role | Username | Email |
| --- | --- | --- |
| Organizer | `org_alice` | alice.organizer@questsync.test |
| Organizer | `org_bob` | bob.organizer@questsync.test |
| Player | `player_carol` | carol.player@questsync.test |
| Player | `player_dave` | dave.player@questsync.test |
| Player | `player_eve` | eve.player@questsync.test |

Log in with **username or email** on the `/login` page.

---

## Project structure

```
gaming-planner/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI library & layout shell
│   │   ├── pages/          # Route-level pages
│   │   ├── services/       # REST API client modules
│   │   ├── store/          # Synchronous Redux slices
│   │   └── hooks/
│   └── .env.development    # Dev API URL override
├── server/                 # Express API
│   ├── prisma/             # Schema, migrations, seed
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       └── middleware/
├── .env.example            # Environment template (copy to .env)
└── package.json            # npm workspaces root
```

---

## Scripts

Run from the **repository root**:

| Command | Description |
| --- | --- |
| `npm run dev` | Start API + client concurrently |
| `npm run build` | Production build (server + client) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Load demo data |
| `npm run db:generate` | Regenerate Prisma client |

**Client only** — `npm run dev -w client` → http://localhost:5173

**Server only** — `npm run dev -w server` → http://localhost:3001

---

## API overview

All endpoints are prefixed with `/api`.

| Resource | Endpoints |
| --- | --- |
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` |
| Games | Full CRUD on `/games` |
| Events | Full CRUD on `/events` with search, filter, sort, pagination |
| Slots | Nested under `/events/:eventId/slots` |
| Registrations | CRUD + approve / decline / assign / attendance |
| Availability | Weekly window CRUD on `/availability` |
| Reports | Generate, download (PDF/DOCX), and email delivery |

Organizer-only routes are protected server-side with role-based access control.

---

## Roles

QuestSync has two distinct roles — no separate admin account:

- **Organizer** — event management, roster boards, event attendance reports
- **Player** — event discovery, availability, registrations, participation reports

Navigation, dashboards, and permissions differ materially between roles.

---

## Client preferences

Theme, sidebar state, and catalog filters persist in `localStorage` under the `questsync:` prefix. Reset everything from **Settings → Reset application settings**.

---

## Troubleshooting

**`DATABASE_URL` not found during migrate**

Ensure `.env` exists at the **repo root** (not inside `server/`). The migrate scripts load `../.env` automatically.

**`ERR_CONNECTION_REFUSED` on port 3001**

The API is not running. Start it with `npm run dev` or `npm run dev -w server`.

**Port 5173 or 3001 already in use**

Stop existing Node processes on those ports, then run `npm run dev` again.

**401 on `/api/auth/me` when logged out**

Expected — the app uses this to detect whether a session cookie exists.

---

## License

MIT © 2026 Rasul — see [LICENSE](LICENSE) for details.
