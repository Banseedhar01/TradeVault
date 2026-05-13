# TradeVault — Deployment, CI/CD & Environment Management Guide

## Context
Deploy TradeVault frontend (React/Vite) to Vercel and backend (FastAPI/Python) to Render. Set up GitHub Actions CI/CD, manage dev/prod environment variables cleanly, and enforce proper MongoDB Atlas database separation. Currently there are no CI/CD configs, no vercel.json, no render.yaml, and MongoDB credentials are committed directly in `.env` (security issue to fix first).

---

## Current State Audit

| Item | Status |
|------|--------|
| `.env` committed with real credentials | ⚠️ Fix immediately |
| Frontend `VITE_API_URL` env var pattern | ✅ Already correct |
| Backend `APP_ENV` → DB name selection | ✅ Already in `app/database.py` |
| CORS: localhost-only origins | ⚠️ Must add production domain |
| CI/CD configs | ❌ None exist |
| `render.yaml` / `vercel.json` | ❌ None exist |

---

## Phase 0 — Security Fix (Do This First)

**1. Rotate MongoDB credentials** — current password is committed in `backend/.env`. Go to MongoDB Atlas → Database Access → edit user → generate new password.

**2. Verify `.gitignore` excludes `.env`:**
```
# Add to backend/.gitignore
.env
__pycache__/
*.pyc
.venv/

# Add to frontend/.gitignore
.env
.env.local
.env.production.local
dist/
node_modules/
```

**3. If `.env` was ever committed**, remove it from git history:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

## Phase 1 — Environment Files

### Frontend (`frontend/`)

**`frontend/.env`** — dev only, gitignored:
```
VITE_API_URL=http://localhost:8000/api
```

**`frontend/.env.production`** — committed (safe, no secrets):
```
VITE_API_URL=https://tradevault-api.onrender.com/api
```
> Vite automatically loads `.env.production` during `vite build`. No code changes needed — `import.meta.env.VITE_API_URL` already works.

### Backend (`backend/`)

**`backend/.env`** — dev only, gitignored:
```
MONGODB_URI=mongodb+srv://<user>:<password>@tradevault.yusmvyl.mongodb.net/?appName=tradevault
APP_ENV=development
```

**Never commit a production `.env`** — inject via Render dashboard env vars only.

---

## Phase 2 — Update CORS for Production

**File:** `backend/app/main.py`

Add the Vercel domain to `allow_origins`:
```python
allow_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "https://tradevault.vercel.app",     # ← your production URL
    "https://*.vercel.app",              # ← covers Vercel preview deploys
]
```
> Replace `tradevault.vercel.app` with actual URL after first Vercel deploy.

---

## Phase 3 — Render Setup (Backend)

### Create `render.yaml` at repo root
```yaml
services:
  - type: web
    name: tradevault-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGODB_URI
        sync: false        # fill manually in Render dashboard — never in code
      - key: APP_ENV
        value: production
    healthCheckPath: /health
    autoDeploy: true       # auto-deploys on push to main
```

### Render Dashboard Steps (first deploy)
1. New → Web Service → connect GitHub repo
2. Root Directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars manually:
   - `MONGODB_URI` = production MongoDB Atlas URI (new credentials)
   - `APP_ENV` = `production`
6. Note: Free tier spins down after 15 min idle → upgrade to Starter ($7/mo) for always-on

---

## Phase 4 — Vercel Setup (Frontend)

### Create `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
> The `rewrites` rule is required — without it, refreshing any route returns 404 since Vercel serves static files and doesn't know about client-side routing.

### Vercel Dashboard Steps (first deploy)
1. New Project → Import GitHub repo
2. Root Directory: `frontend`
3. Framework: Vite (auto-detected)
4. Environment Variable (Production): `VITE_API_URL` = `https://tradevault-api.onrender.com/api`
5. Deploy → Vercel auto-deploys on every push to `main`

---

## Phase 5 — GitHub Actions CI/CD

### Create `.github/workflows/ci.yml` at repo root
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  frontend:
    name: Frontend Build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: https://tradevault-api.onrender.com/api

  backend:
    name: Backend Import Check
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: pip
      - run: pip install -r requirements.txt
      - run: python -c "from app.main import app; print('OK')"
        env:
          MONGODB_URI: mongodb://localhost:27017/test   # dummy — just checks imports
          APP_ENV: development
```

**CI does:** Verifies frontend builds and backend imports on every push/PR.  
**Deployment is handled by:** Vercel (webhook on push to main) + Render (`autoDeploy: true`). No extra deploy steps in CI needed.

---

## Phase 6 — MongoDB Atlas Dev/Prod Separation

The split is already implemented in `backend/app/database.py`:
```python
db_name = "tradevault" if os.getenv("APP_ENV") == "production" else "tradevault_dev"
```

**Result:**
- Local dev (`APP_ENV=development`) → `tradevault_dev` database
- Render (`APP_ENV=production`) → `tradevault` database

**Atlas Network Access:**
- Dev: add your local IP in Atlas → Network Access
- Production: add `0.0.0.0/0` (allow all) — acceptable with strong credentials on Atlas

**Backups:**
- Enable Atlas continuous backups on `tradevault` (production cluster)
- `tradevault_dev` needs no backup

---

## Phase 7 — Branch & Deploy Strategy

```
main      → auto-deploys to Vercel + Render (production)
develop   → local development, manual testing only
feature/* → PR to main → CI checks → merge → auto-deploy
```

**Workflow:**
1. Create `feature/my-change` branch
2. Develop locally (`.env` dev file, `tradevault_dev` DB)
3. Push → open PR to `main` → CI runs
4. CI passes → merge → Vercel + Render auto-deploy within ~2 min

---

## Files to Create

| File | Location | Committed? |
|------|----------|------------|
| `render.yaml` | repo root | ✅ Yes |
| `frontend/vercel.json` | frontend dir | ✅ Yes |
| `.github/workflows/ci.yml` | repo root | ✅ Yes |
| `frontend/.env.production` | frontend dir | ✅ Yes (no secrets) |
| `backend/.env` | backend dir | ❌ No (gitignored) |
| `frontend/.env` | frontend dir | ❌ No (gitignored) |

## Code Changes

| File | Change |
|------|--------|
| `backend/app/main.py` | Add Vercel domain to `allow_origins` |
| `backend/.gitignore` | Ensure `.env` is excluded |
| `frontend/.gitignore` | Ensure `.env*` is excluded |

---

## First-Deployment Order

1. Rotate MongoDB credentials, fix `.gitignore`
2. Push repo to GitHub
3. Deploy backend on Render → note the service URL (e.g. `https://tradevault-api.onrender.com`)
4. Set `VITE_API_URL` in `frontend/.env.production` to that URL
5. Update CORS in `backend/app/main.py` with future Vercel URL (can use `*.vercel.app` wildcard initially)
6. Deploy frontend on Vercel → note the app URL
7. Update CORS with exact Vercel URL, redeploy backend
8. Verify: Vercel app → Render API → MongoDB Atlas (production DB)

---

## Verification Checklist

- [ ] `https://tradevault-api.onrender.com/health` returns `{"status":"ok"}`
- [ ] Vercel app loads without blank screen
- [ ] No CORS errors in browser console
- [ ] Adding a trade in production writes to `tradevault` DB in Atlas (not `tradevault_dev`)
- [ ] Local dev still writes to `tradevault_dev`
- [ ] GitHub Actions CI passes on push to `main`
- [ ] Vercel preview deploy works on PR branches
