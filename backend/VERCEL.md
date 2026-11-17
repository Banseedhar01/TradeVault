# Backend deployment on Vercel

The backend runs as a native FastAPI Vercel Function using `app/main.py:app`
and Python 3.12. MongoDB remains on Atlas; no data migration is required.

## Current deployment

- Backend: https://tradevault-api.vercel.app
- Frontend: https://trade-vault-six.vercel.app
- Git deployment is configured with Root Directory `backend`, the FastAPI
  framework preset, and Production Branch `main`.
- To verify auto-deployment, push a change under `backend/` and confirm the
  matching commit appears in the backend project's Deployments list. Check
  `/health` after its status becomes Ready.

## Production and Preview separation

| Frontend environment | API route | Backend environment | Database |
| --- | --- | --- | --- |
| Production (`main`) | `https://tradevault-api.vercel.app/api` | `APP_ENV=production` | `tradevault` |
| Preview (`develop`) | Same-origin `/api` server-side proxy | `APP_ENV=development` | `tradevault_dev` |

Both databases currently use the same Atlas cluster and connection secret.
Database selection is controlled by the backend's `APP_ENV`, not by the frontend.
Separate database-scoped Atlas users can additionally restrict credentials.

Vercel Authentication stays enabled for the Preview frontend and backend.
The frontend's `api/preview-proxy.js` function forwards only supported API paths to
the stable develop backend alias. Its automation credential stays on the server
and is never included in browser JavaScript. The proxy returns 404 in Production.

Configure these frontend **Preview-only** variables:

- `VITE_API_URL=/api`
- `PREVIEW_BACKEND_URL=https://tradevault-api-git-develop-banseedhar01s-projects.vercel.app`
- `PREVIEW_BACKEND_BYPASS_SECRET`: a backend Protection Bypass for Automation
  credential, stored as a Secret. Never prefix it with `VITE_`.

Keep the frontend Production `VITE_API_URL` pointed at the production backend.
Redeploy the relevant environment after changing variables. Preview `/api/health`
checks the development backend through the protected proxy.

Verification on November 17, 2026 confirmed protected Preview reads and writes
use the development database. A temporary development record was absent from
Production and removed after testing. Production's existing account/trade schema
validation errors are a separate issue from deployment and environment routing.

## Project setup

Create a separate Vercel project from the TradeVault repository. Set its Root
Directory to `backend`, Framework Preset to FastAPI, and Production Branch to
`main`. Keep the existing frontend project rooted at `frontend`.

For a CLI deployment from this directory, run `vercel link` and then
`vercel deploy --prod`. The CLI must be authenticated to the correct account.

## Environment variables

Set these in the backend project's Vercel Environment Variables settings:

| Environment | Variable | Value |
| --- | --- | --- |
| Production | `MONGODB_URI` | Existing production Atlas connection string |
| Production | `APP_ENV` | `production` |
| Preview | `MONGODB_URI` | Shared Atlas connection secret (or a development-scoped Atlas user) |
| Preview | `APP_ENV` | `development` |

Production uses the `tradevault` database. Preview and local development use
`tradevault_dev`. Do not put secrets in Git. Keep `APP_ENV=production` scoped to
Production and `APP_ENV=development` scoped to Preview. Redeploy after changing
environment variables.

Ensure Atlas network access permits the deployed function to connect. Select a
Vercel function region near Atlas. Keep MongoDB connection limits in mind when
scaling; each function instance initializes its own client at startup.

## Deployment validation

1. Verify `/health`, `/api/firms`, `/api/accounts`, `/api/trades`, and all
   `/api/analytics` routes on the deployed backend. Check JSON `success` values,
   not just HTTP status codes.
2. Test writes using an isolated development deployment. Do not run `seed.py`
   against production: it deletes existing records.
3. Verify browser access from the frontend, including CORS and Vercel Deployment
   Protection settings. Check nested edit/delete operations through Preview's proxy.
4. Confirm frontend Production calls the production backend and frontend Preview
   calls its same-origin `/api` proxy.
5. Use the stable frontend URLs in [DEPLOYMENT.md](../DEPLOYMENT.md). Immutable
   older deployment URLs retain their original API settings.

The frontend has mock fallbacks that can hide API errors. Confirm real API
responses and browser network requests when validating the migration.

## Rollback

Use Vercel's deployment history to restore a previously verified Vercel deployment
for the affected frontend or backend project. Keep the frontend Production API
URL set to `https://tradevault-api.vercel.app/api`; Preview must keep its separate
proxy configuration. Do not roll back to a historical deployment that points at
the retired backend. Restoring application code does not restore database data.
