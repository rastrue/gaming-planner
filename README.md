# QuestSync

**Plan multiplayer sessions. Fill rosters. Track attendance.**

QuestSync is a full-stack event planning platform for gaming communities. Organizers create events, define roster slots, and manage registrations. Players discover sessions, set weekly availability, and join the games they care about.

Built as a TypeScript monorepo with a React client, Express API, and PostgreSQL database.

---

## Highlights

| For organizers | For players |
| --- | --- |
| Organizer dashboard with stats and pending registrations | Browse, search, filter, and paginate events |
| Create, edit, publish, and delete events | Set weekly availability windows |
| Define roster slots per event | Register for open sessions |
| Approve registrations and assign roles via drag-and-drop | Re-register after a declined or cancelled registration |
| Two-step roster flow: event picker and board | View and cancel eligible registrations |
| Generate PDF/DOCX reports and email delivery | Theme and preference controls in the app header |

---

## Tech stack

**Frontend** — React 18 · Vite · TypeScript · Tailwind CSS · Redux Toolkit (synchronous only) · React Router

**Backend** — Express · TypeScript · Prisma · PostgreSQL · Zod · JWT (httpOnly cookies)

**Reports** — jsPDF · docx · Nodemailer

**State & networking** — API calls live in `client/src/services/`; Redux holds client-side state and `localStorage` sync only (no `createAsyncThunk` or RTK Query).

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

The database uses exactly **8 tables** in strict 3NF (`Role`, `User`, `Game`, `Event`, `EventSlot`, `Registration`, `AvailabilityWindow`, `ReportRequest`).

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

Optional: add SMTP settings if you want to test **email delivery** on the Reports page. See `.env.example` for Gmail, Outlook, SendGrid, and other provider templates.

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

After login, organizers land on `/dashboard`; players land on `/events`.

---

## Routes

### Auth (public)

| Path | Page |
| --- | --- |
| `/login` | Sign in |
| `/register` | Create account |

### Shared (authenticated)

| Path | Page |
| --- | --- |
| `/events` | Event catalog with search, filters, sort, pagination |
| `/events/:id` | Event details and registration |
| `/availability` | Weekly availability planner |
| `/my-registrations` | Registration history and statuses |

### Organizer only

Protected by role checks on both client and server.

| Path | Page |
| --- | --- |
| `/dashboard` | Organizer dashboard |
| `/organizer/events` | Event management list |
| `/organizer/events/new` | Create event |
| `/organizer/events/:id/edit` | Edit event |
| `/organizer/roster` | Roster event picker |
| `/organizer/roster/:eventId` | Drag-and-drop roster board |
| `/reports` | Report generation, export, and history |

### Other

| Path | Behavior |
| --- | --- |
| `/` | Redirect to role default (`/dashboard` or `/events`) or `/login` |
| `*` | 404 placeholder |

There is **no `/settings` page**. Theme toggle and application reset live in the authenticated app header (`AppShell`).

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
│   │   ├── hooks/
│   │   ├── i18n/           # Russian UI labels
│   │   ├── types/
│   │   └── utils/          # routes, storageKeys
│   └── .env.development    # Dev API URL override
├── server/                 # Express API
│   ├── prisma/             # Schema, migrations, seed
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       ├── validators/
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
| Slots | Nested under `/events/:eventId/slots`; mutations on `/event-slots/:id` |
| Registrations | CRUD — cancel, approve/decline, slot assignment, attendance |
| Availability | Weekly window CRUD on `/availability` |
| Reports | Generate, download (PDF/DOCX), and email delivery |

Organizer-only routes are protected server-side with role-based access control.

---

## Roles

QuestSync has two distinct roles — no separate admin account:

- **Organizer** — dashboard, event management, roster boards, reports. Default route: `/dashboard`.
- **Player** — event discovery, availability, registrations. Default route: `/events`. No dashboard or reports in navigation.

Navigation, landing routes, and permissions differ materially between roles. Roster slot assignment respects each slot's `requiredCount` on both client and server.

---

## Client preferences

Theme, sidebar state, and catalog filters persist in `localStorage` under the `questsync:` prefix.

From the authenticated header:

1. **Theme toggle** — Sun/Moon icon; preference is saved automatically.
2. **Reset application settings** — removes all `questsync:` keys, resets Redux slices, and restores the active session user.

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

**Report email shows success but nothing arrives**

Email delivery requires SMTP settings in the root `.env` file. Without `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`, the API cannot send mail.

Restart the API server after changing `.env`. If delivery fails, check the report history **Failed reason** field for the SMTP error.

### Gmail

1. Enable 2-Step Verification on your Google account.
2. Create an [App Password](https://myaccount.google.com/apppasswords) for QuestSync.
3. Add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.address@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=QuestSync <your.address@gmail.com>
```

### Other SMTP providers

QuestSync uses standard SMTP — testers can plug in any provider they already have. Copy `.env.example` to `.env` and uncomment one block, or use this reference:

| Provider | `SMTP_HOST` | `SMTP_PORT` | Notes |
| --- | --- | --- | --- |
| Gmail | `smtp.gmail.com` | `587` | App Password required; see above |
| Outlook / Microsoft 365 | `smtp.office365.com` | `587` | Use account or app password |
| Yahoo Mail | `smtp.mail.yahoo.com` | `587` | App Password recommended |
| SendGrid | `smtp.sendgrid.net` | `587` | `SMTP_USER=apikey`, `SMTP_PASS` = API key |
| Mailgun | `smtp.mailgun.org` | `587` | Use SMTP credentials from Mailgun dashboard |
| Custom / hosting | your host's SMTP host | `587` or `465` | Ask your host for host, port, and credentials |

**For testers:** use your own credentials in a local `.env` file only. Do not commit `.env` or share SMTP passwords in issues or pull requests. Reports can be sent to **any recipient email** — only the outbound SMTP account is configured server-side.

**Port 465:** if `587` is blocked on your network, try `465` instead. The API enables TLS automatically when port `465` is used.

---

## License

MIT © 2026 Rasul — see [LICENSE](LICENSE) for details.
