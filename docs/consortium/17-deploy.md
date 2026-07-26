# Consortium — Phase 17: Railway deploy

Branch: `feat/consortium-rules` (verification)  
Date: 2026-07-26  
Account checked: `mikkel.frid@live.dk` (workspace *Mikkel Frid Nørgaard's Projects*)

## Status (verified via Railway CLI)

**No Terraforming Mars / Consortium service exists on this Railway account.**

After CLI login, `railway list` / GraphQL show exactly one project:

| Project | Purpose | Public domains |
|---------|---------|----------------|
| `content-caring` (`5201b3fe-…`) | VeloVision / Medusa (`MikkelFrid/VeloVision.dk`) | `api.velovision.dk`, `admin.velovision.dk`, `wonderful-nurturing-production-b6ec.up.railway.app`, Meilisearch |

Services in that project: `wonderful-nurturing`, `medusa-worker`, `Postgres`, `Redis`, `meilisearch`. None are this repo. There are no deleted projects under the workspace either.

Earlier phase notes that claimed a live instance were aspirational; the previous agent stopped at missing secrets and never created a TFM deploy.

## What to do in the dashboard (you must create / confirm)

Per `.cursor/rules/consortium.mdc` Railway guardrails, this agent will **not** create a new paid project, Postgres, or service without an explicit go-ahead.

If you want a public Consortium instance, in the Railway dashboard:

1. **New project** (do not reuse `content-caring` / VeloVision).
2. **GitHub service** → `MikkelFrid/terraforming-mars-consortium`, branch `main` (or `feat/consortium-rules` if testing rulebook before merge).
3. Root `Dockerfile` is the build path (Node 22 multi-stage → `npm start`).
4. **Disable scale-to-zero** / keep ≥1 replica.
5. **Add Postgres** with a persistent volume.
6. On the web service, set:

| Variable | Value | Why |
|----------|-------|-----|
| `PORT` | *(leave unset — Railway injects)* | `server.ts` uses `process.env.PORT \|\| 8080` |
| `POSTGRES_HOST` | `${{Postgres.DATABASE_URL}}` | Server keys off `POSTGRES_HOST`, not `DATABASE_URL` |
| `MAX_GAME_DAYS` | `36500` | Default purge is **10 days** |
| `POSTGRES_TRIM_COUNT` | `0` | Keep full save history |
| `GAME_CACHE` | `sweep=manual` | Avoid idle eviction mid-game |
| `SERVER_ID` | long random secret | Admin routes |
| `STATS_ID` | long random secret | Stats route |

7. Generate a public domain, deploy, then verify:
   - Lobby shows Consortium when the expansion is enabled
   - One full generation plays
   - Game still loads after a service restart
   - Variables above (especially `MAX_GAME_DAYS`) are present

## Alternative

If the deploy lives on **another Railway account or workspace**, paste the project URL
(`https://railway.com/project/<id>/…`) or invite `mikkel.frid@live.dk` / provide a
project token so this agent can read logs and status without creating resources.

## Dockerfile notes

Existing root `Dockerfile`:

- Builds with `npm run build` (CSS + server `tsc` + client webpack)
- Runs `npm start` → `node build/src/server/server.js`
- Honors `PORT` at runtime
- No credentials baked into the image
