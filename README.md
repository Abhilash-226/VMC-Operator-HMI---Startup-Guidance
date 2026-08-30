# VMC Operator HMI — Startup Guidance

A **production-ready**, guided startup and operation workflow for the **VMC-03** Vertical Machining Centre. Operators are walked through five sequential stages before machining can begin, with every step persisted to a PostgreSQL database.

---

## 🏗️ Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19 · TypeScript · Vite 8    |
| Backend  | Node 22 · Express 4 · TypeScript  |
| Database | PostgreSQL (via `pg` / node-postgres) |
| Tests    | Vitest (unit — no live DB needed) |
| Tooling  | npm workspaces · concurrently · tsx |

---

## 📋 Workflow Stages

| # | Stage          | Items |
|---|----------------|-------|
| 1 | Machine Checks | 7     |
| 2 | Required Tools | 4     |
| 3 | Workpiece Setup| 5     |
| 4 | Ready Review   | summary roll-up |
| 5 | Operation      | Start / Stop with event log |

State is persisted per session — operators can safely refresh and resume exactly where they left off.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 22
- PostgreSQL database (local or hosted — [Supabase](https://supabase.com) / [Neon](https://neon.tech) both work with the included SSL config)

### 1. Clone & Install

```bash
git clone <repo-url>
cd vmc-operator-hmi
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the **server** directory and fill in your values:

```bash
cp server/.env.example server/.env
```

```dotenv
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/vmc_hmi?sslmode=require
DEMO_PIN=1234
```

### 3. Seed the Database

This creates the schema and inserts the default VMC-03 session with all 16 checklist items:

```bash
npm run seed --workspace=server
```

### 4. Run in Development

Starts both the Vite dev server (port 5173) and the Express API server (port 3001) concurrently:

```bash
npm run dev
```

Open **http://localhost:5173** in a browser or tablet.

### 5. Production Build

```bash
npm run build
```

Compiled outputs:
- **Server**: `server/dist/` (run with `node dist/index.js`)
- **Client**: `client/dist/` (serve as static files via Express or a CDN)

---

## 🧪 Running Tests

Unit tests for all state-transition guards run **without a live database** (fully mocked):

```bash
npm run test
```

Test coverage:
- ✅ Block stage advancement if any checklist items are unconfirmed
- ✅ Advance to next stage when all items confirmed
- ✅ Start operation from READY state (logs START event)
- ✅ Block start if already RUNNING
- ✅ Stop operation and log STOP event

---

## 🔌 API Reference

### Auth
| Method | Path               | Description                              |
|--------|--------------------|------------------------------------------|
| POST   | `/api/auth/login`  | Validate PIN, return session + cookie    |

### Session
| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/api/session`          | Get current session with all items       |
| POST   | `/api/session/advance`  | Advance to next stage (guards enforced)  |

### Checklist
| Method | Path                           | Description              |
|--------|--------------------------------|--------------------------|
| POST   | `/api/checklist/:id/confirm`   | Mark item as confirmed   |

### Operation
| Method | Path                    | Description                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/api/operation/start`  | Set status → RUNNING, log START event    |
| POST   | `/api/operation/stop`   | Set status → STOPPED, log STOP event     |

---

## 🗄️ Database Schema

```sql
sessions (id, machine_id, work_order, current_stage, operation_status, ...)
checklist_items (id, session_id, stage, item_key, label, meta, confirmed, confirmed_at, sort_order)
operation_log (id, session_id, event ['START'|'STOP'], at)
```

---

## 🔒 Security Notes

- The `DEMO_PIN` is loaded from `.env` — never commit `.env` to source control
- The `.gitignore` excludes `.env` by default
- For production, replace the PIN system with a proper auth mechanism (e.g. operator badge + LDAP)

---

## 📂 Project Structure

```
.
├── client/                  # React + TS frontend (Vite)
│   └── src/
│       ├── api/             # Fetch wrappers
│       ├── components/      # StageProgress, ChecklistItemRow, PrimaryButton, StatusPill
│       ├── screens/         # LoginScreen, MachineChecks, Tools, Workpiece, ReadyReview, Operation
│       └── state/           # useSession hook (polling + actions)
├── server/                  # Express + TS backend
│   └── src/
│       ├── db/              # schema.sql, seed.ts, pool.ts
│       ├── middleware/       # auth.ts (session cookie / Bearer token)
│       ├── routes/          # auth, session, checklist, operation
│       └── services/        # sessionService.ts (business logic + state guards)
└── package.json             # npm workspaces root
```
