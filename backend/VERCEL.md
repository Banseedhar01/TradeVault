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
- Render remains available for rollback during observation.

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

Verification on November 17, 2026 found the same pre-existing account/trade
schema validation failures on Render and Vercel, and an empty firms collection
on both. MongoDB connectivity, health, analytics, and frontend CORS passed.
The existing data was not modified as part of deployment.

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

## Validation and frontend cutover

1. Verify `/health`, `/api/firms`, `/api/accounts`, `/api/trades`, and all
   `/api/analytics` routes on the deployed backend. Check JSON `success` values,
   not just HTTP status codes.
2. Test writes using an isolated development deployment. Do not run `seed.py`
   against production: it deletes existing records.
3. Compare cold and warm request times with Render. Verify browser access from
   the frontend, including CORS and Vercel Deployment Protection settings.
4. Set `VITE_API_URL` in the frontend project's Production environment to the
   verified backend origin followed by `/api`, then redeploy the frontend.
5. Update `frontend/.env.production` and the frontend build URL in
   `.github/workflows/ci.yml` to the verified URL.
6. Keep Render available during observation. Once migration is verified,
   retire its service, `.github/workflows/deploy-backend.yml`, and the
   `RENDER_DEPLOY_HOOK_URL` repository secret.

The frontend has mock fallbacks that can hide API errors. Confirm real API
responses and browser network requests when validating the migration.

## Rollback

Restore the frontend Production `VITE_API_URL` to
`https://tradevault-sexf.onrender.com/api` and redeploy the frontend (or restore
the previous frontend deployment). Render and Vercel must use the same
production Atlas database for this rollback; no database restore is needed.
