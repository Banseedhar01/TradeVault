# TradeVault deployment

TradeVault runs on two Vercel projects connected to the same GitHub repository.
MongoDB Atlas stores application data in separate production and development
databases. GitHub Actions runs checks; Vercel deploys Git changes automatically.

## Projects and stable URLs

| Project | Root directory | Framework | Production branch |
| --- | --- | --- | --- |
| `trade-vault` | `frontend` | Vite | `main` |
| `tradevault-api` | `backend` | FastAPI | `main` |

| Environment | Frontend | Backend | Database |
| --- | --- | --- | --- |
| Production | https://trade-vault-six.vercel.app | https://tradevault-api.vercel.app | `tradevault` |
| Development Preview | https://trade-vault-git-develop-banseedhar01s-projects.vercel.app | https://tradevault-api-git-develop-banseedhar01s-projects.vercel.app | `tradevault_dev` |

Bookmark these stable URLs. Unique deployment URLs are immutable and keep the
API configuration from when they were built. Older Preview links can point to
the production API even after current Preview settings have been separated.

## Backend settings

Set the Root Directory to `backend` in Vercel's Build and Deployment settings,
and select FastAPI. Under Settings → Environments → Production → Branch Tracking,
select `main`. Connect `Banseedhar01/TradeVault` under Settings → Git.

The backend uses Python 3.12 and the native `app/main.py:app` entrypoint.
`backend/vercel.json` sets the function's maximum duration to 60 seconds.

| Environment | Variable | Value |
| --- | --- | --- |
| Production | `MONGODB_URI` | Atlas connection secret |
| Production | `APP_ENV` | `production` |
| Preview | `MONGODB_URI` | Atlas connection secret |
| Preview | `APP_ENV` | `development` |

The URI selects the Atlas cluster; `APP_ENV` selects the database in
`backend/app/database.py`. Currently both environments share the cluster and
connection secret. Separate Atlas users restricted to each database can provide
additional credential isolation. Never commit connection strings or passwords.

## Frontend settings

Set the frontend project's Root Directory to `frontend`, framework to Vite, and
Production Branch to `main`.

| Environment | Variable | Value |
| --- | --- | --- |
| Production | `VITE_API_URL` | `https://tradevault-api.vercel.app/api` |
| Preview | `VITE_API_URL` | `/api` |
| Preview | `PREVIEW_BACKEND_URL` | `https://tradevault-api-git-develop-banseedhar01s-projects.vercel.app` |
| Preview | `PREVIEW_BACKEND_BYPASS_SECRET` | Backend automation credential, stored as a Secret |

Keep Vercel Authentication enabled for Preview. Frontend Preview requests go
through `frontend/api/preview-proxy.js`, which forwards supported paths to the
protected development backend. The bypass credential stays server-side; never
give it a `VITE_` prefix. The proxy returns 404 in Production.

Redeploy the affected environment whenever its variables change. Existing
deployment URLs keep their original builds and configuration.

Recent dashboard responses are cached in the current tab's `sessionStorage` for
up to five minutes. Reloads show those results immediately and fetch fresh data
in the background; the navbar shows Updating during requests. The cache is scoped
to the frontend origin and API URL, cleared during writes, and excludes sample
fallbacks. First visits, closed tabs, and expired caches still wait for the API.

## Development and release workflow

1. Develop locally or on a feature branch, using a local development `.env`.
2. Push changes to `develop` to deploy frontend and backend Previews.
3. Verify the Preview UI, API reads, and create/edit/delete operations.
4. Merge the tested changes into `main` to deploy Production.

CI runs frontend tests and its production build, plus a Python 3.12 backend
import check. Vercel deployments are separate from CI; confirm both project
deployments show Ready for the expected commit.

## Verification and rollback

- Production `/health` should return `success: true` with `status: healthy`.
- After Vercel sign-in, Preview frontend `/api/health` checks its backend through
  the proxy.
- Check JSON `success` values, not just HTTP statuses. API error envelopes can
  use HTTP 200, and frontend sample-data fallbacks can hide failed requests.
- Confirm development test records never appear in Production. Remove temporary
  test records after verification. Do not run `backend/seed.py` against Production;
  it deletes existing records.

To roll back, restore a previously verified Vercel deployment in the affected
project's deployment history. Preserve the Production API URL and Preview proxy
settings. Avoid historical builds pointing to retired hosting. Code rollback
does not roll back database records.

## Retiring legacy hosting

The repository no longer contains the Render deployment workflow or uses its
backend URL. Complete these account-level cleanup steps:

1. Stop or delete the old TradeVault backend service in the Render dashboard.
2. Remove `RENDER_DEPLOY_HOOK_URL` from GitHub repository Settings → Secrets and
   variables → Actions.

Retain the Atlas cluster and Vercel environment variables: both current
environments still need them.
