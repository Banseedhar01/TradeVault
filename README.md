# TradeVault

A personal prop trading dashboard to track prop firm accounts, log trades, and monitor performance across Forex and US Futures markets.

**Live:** [trade-vault-six.vercel.app](https://trade-vault-six.vercel.app)

---

## Features

- **Prop Firm Management** — Add and track multiple prop firms and accounts with stage-based challenges
- **Trade Log** — Log trades with entry/exit prices, direction, size, and P&L
- **Trading Calendar** — Visual daily P&L heatmap with per-day trade breakdown
- **Performance Analytics** — Win rate, profit factor, average RR, equity curve
- **Risk Calculator** — Real-time lot size and risk calculations
- **Market Clock** — Live session times for Forex and Futures markets
- **Account Detail Pages** — Per-account scoped view of all cards and metrics

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS v4, Zustand, TanStack Query |
| Backend | FastAPI, Python 3.12, Beanie ODM, Motor |
| Database | MongoDB Atlas |
| Deployment | Vercel (frontend and backend) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
TradeVault/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── api/       # Fetch wrappers for each resource
│   │   ├── components/
│   │   │   ├── cards/ # Dashboard cards (TradeLog, Calendar, Performance…)
│   │   │   ├── forms/ # Add firm/account/trade slide-overs
│   │   │   ├── layout/# Navbar, Layout, AccountSelectorBar
│   │   │   ├── pages/ # AccountDetailPage
│   │   │   └── ui/    # Badge, Button, Input, ProgressBar…
│   │   ├── hooks/     # TanStack Query hooks
│   │   ├── store/     # Zustand global state
│   │   └── types/     # TypeScript types
│   └── .env.production
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── models/    # Beanie ODM models (PropFirm, Account, Trade, DailyStats)
│   │   ├── routers/   # API routes (firms, accounts, trades, analytics)
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .python-version
├── .github/
│   └── workflows/
│       └── ci.yml     # Tests and build checks; Vercel handles deployments
└── DEPLOYMENT.md      # Full deployment guide
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.12
- MongoDB Atlas account

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (see `.env.example`):
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=tradevault
APP_ENV=development
```

```bash
uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000` · Swagger docs at `http://localhost:8000/docs`

Trade writes use transactions so the trade and its statistics stay consistent.
Atlas already provides a replica set. For local MongoDB, start it with a replica
set (for this workspace: `tradevault-local`) and include
`?replicaSet=tradevault-local` in the local URI. The isolated database tests are
documented in [backend/tests/README.md](backend/tests/README.md).

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api
```

```bash
npm run dev
```

App runs at `http://localhost:5174`

---

## Deployment

| Service | URL |
|---------|-----|
| Frontend | [trade-vault-six.vercel.app](https://trade-vault-six.vercel.app) |
| Backend | [tradevault-api.vercel.app](https://tradevault-api.vercel.app) |

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel setup and
[backend/VERCEL.md](backend/VERCEL.md) for backend configuration and rollback.

### Branch Strategy

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production | Vercel frontend and backend |
| `develop` | Staging / active development | Vercel preview |
| `feature/*` | Feature branches | Vercel preview (on PR) |

---

## Environment Variables

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

### Backend
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `APP_ENV` | `development` → `tradevault_dev` DB · `production` → `tradevault` DB |
