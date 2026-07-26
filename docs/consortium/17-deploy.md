# Consortium — Phase 17: Railway deploy

Branch: `feat/consortium-validation`  
Date: 2026-07-26  
Prerequisite: Phase 16 validation reported **zero crashes**

## Status

**Blocked on secrets.** This environment has no Railway token and no Postgres
credentials. Do not put credentials in the repository. Complete the steps
below in your Railway project (or paste a `RAILWAY_TOKEN` into the agent
environment and re-run).

## Why these variables

The server does **not** read `DATABASE_URL`. Postgres is selected when
`POSTGRES_HOST` is set (see `src/server/database/Database.ts`). The value may
be a full `postgres://…` connection string (SSL is enabled automatically when
the string starts with `postgres`).

Required / recommended env vars (from `.env.sample` + wiki “dot env”):

| Variable | Value | Why |
|----------|-------|-----|
| `PORT` | *(injected by Railway)* | `server.ts` uses `process.env.PORT \|\| 8080` |
| `POSTGRES_HOST` | Railway Postgres URL | Enables PostgreSQL backend |
| `MAX_GAME_DAYS` | e.g. `36500` (100 years) | Default purge is **10 days**; official TFM flushes ~15d — set high so games persist |
| `POSTGRES_TRIM_COUNT` | `0` | Disable save-trimming |
| `GAME_CACHE` | `sweep=manual` | Avoid idle eviction mid-game; no scale-to-zero interaction |
| `SERVER_ID` | long random secret | Admin endpoints |
| `STATS_ID` | long random secret | Stats endpoint |
| `ASSET_CACHE_MAX_AGE` | e.g. `86400` | Optional CDN-ish caching |

Do **not** enable scale-to-zero / serverless sleep on the web service.

## Exact steps (Railway UI)

1. **Create project** (or open existing) on [railway.app](https://railway.app).
2. **Add service from GitHub**
   - New → GitHub Repo → `terraforming-mars-consortium`
   - Branch: `main` (after this validation branch merges) or `feat/consortium-validation`
   - Railway detects `Dockerfile` at repo root (multi-stage Node 22 build).
3. **Disable scale-to-zero**
   - Service → Settings → set replicas ≥ 1 / turn off app sleeping.
4. **Add Postgres**
   - New → Database → PostgreSQL
   - Attach a **persistent volume** (Railway Postgres volumes are persistent by
     default; confirm volume is attached and not ephemeral).
5. **Wire env vars on the web service**
   - `POSTGRES_HOST` = `${{Postgres.DATABASE_URL}}` (Railway reference variable)
   - `MAX_GAME_DAYS=36500`
   - `POSTGRES_TRIM_COUNT=0`
   - `GAME_CACHE=sweep=manual`
   - `SERVER_ID=<generate>`
   - `STATS_ID=<generate>`
   - Do **not** set `PORT` manually — Railway injects it.
6. **Deploy** and wait for healthy listen on `$PORT`.
7. **Verify Consortium in lobby**
   - Open the public URL
   - Create Game → enable **Consortium** expansion
   - Confirm Consortium board / corps appear
   - Start a solo (or 2p) game and play through **one full generation**
     (pass all players once; generation counter advances)

## Exact steps (Railway CLI)

Once you have a token:

```bash
# Local machine or agent with secret injected (never commit the token)
export RAILWAY_TOKEN=...          # account/project token from Railway
npm i -g @railway/cli             # or: npx @railway/cli

railway login --browserless       # if interactive
railway link                      # select project
railway add --database postgres   # if not already present
railway variables set \
  POSTGRES_HOST='${{Postgres.DATABASE_URL}}' \
  MAX_GAME_DAYS=36500 \
  POSTGRES_TRIM_COUNT=0 \
  GAME_CACHE='sweep=manual' \
  SERVER_ID="$(openssl rand -hex 24)" \
  STATS_ID="$(openssl rand -hex 24)"
railway up                        # deploy Dockerfile service
railway domain                    # attach public domain if needed
```

## What this agent still needs from you

1. **`RAILWAY_TOKEN`** (or invite the agent’s GitHub deploy key / Railway project access)
2. Confirmation the GitHub repo is connected to Railway
3. Optional: preferred service/project name and public domain

Until those are provided, deploy cannot be executed or verified from this
environment. Validation (Phase 16) is green and safe to merge independently.

## Dockerfile notes

Existing root `Dockerfile`:

- Builds with `npm run build` (CSS + server `tsc` + client webpack)
- Runs `npm start` → `node build/src/server/server.js`
- Exposes 8080; runtime still honors `PORT`
- No credentials baked into the image
