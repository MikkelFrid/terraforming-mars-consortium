# Consortium — Phase 17: Railway deploy

Branch verified against: `main` @ `b0cb6d673`  
Date: 2026-07-26  
Account: `mikkel.frid@live.dk`

## What is actually deployed

| Item | Value |
|------|-------|
| Project | `incredible-heart` (`de35a201-2f8d-4af2-9a61-6520c59e23bb`) |
| Environment | `production` (`915fc07d-072c-4f35-a0e1-fe7277137ed9`) |
| App service | `terraforming-mars-consortium` (`5ad68a8b-faac-4134-9cd3-60ab717d64ae`) |
| Database | `Postgres` (`1c3427e4-f5cf-41af-9169-a2135dc91c88`) — **running**, volume attached |
| Latest app deploy | `8bd365b6-…` **SUCCESS** (Dockerfile build from `main`) |
| Replicas | 1 configured / 1 running / 0 crashed |
| Scale-to-zero | off (`sleepApplication: false`) |
| Public domain | **none** (`url: null`) |

### Build log (latest)

Dockerfile multi-stage build completed. Webpack emitted size warnings only
(vendors.js / chunks). No build errors.

### Runtime log (latest)

```
Connecting to SQLite database.
Starting server on port 8080
Server is ready.
"type": "SQLite",
"path": "/usr/src/app/db/game.db"
```

Postgres exists in the project but the app is **not** using it. The container
filesystem SQLite file will be wiped on restart — games will not persist until
`POSTGRES_HOST` is wired.

## Misconfigured — change these in the Railway dashboard

Do **not** ask the agent to set secrets. In the dashboard, open
`incredible-heart` → service `terraforming-mars-consortium` → **Variables**:

| Variable | Set to | Why |
|----------|--------|-----|
| `POSTGRES_HOST` | `${{Postgres.DATABASE_URL}}` | Server selects Postgres only when this is set (not `DATABASE_URL`) |
| `MAX_GAME_DAYS` | `36500` | Default purge is **10 days** |
| `POSTGRES_TRIM_COUNT` | `0` | Keep full save history |
| `GAME_CACHE` | `sweep=manual` | Avoid idle eviction mid-game |
| `SERVER_ID` | long random secret | Admin routes |
| `STATS_ID` | long random secret | Stats route |

Leave `PORT` unset (Railway injects it). After saving variables, Railway will
redeploy; the runtime log should then say `PostgreSQL` (or similar), not
`SQLite`.

Also:

1. **Settings → Networking → Generate domain** on the app service (currently no
   public URL).
2. Confirm the generated domain targets the service HTTP port (usually the
   injected `PORT`).
3. Optional: after `feat/consortium-rules` merges, redeploy so the player
   rulebook is on the live instance (`/assets/consortium/rulebook.html`).
   Current deploy is `main` without that commit.

## Verification checklist (after the variables + domain)

- [ ] Deployment status SUCCESS, 1 replica, no crash loop
- [ ] Runtime log shows Postgres, not SQLite
- [ ] `MAX_GAME_DAYS` present on the service
- [ ] Lobby → enable Consortium → board/corps appear
- [ ] Play one full generation
- [ ] Restart the app service → same game still loads

## Guardrails

Railway access from agents: logs, status, redeploys of the existing service.
Never create new paid resources without asking. Never commit credentials —
use Railway variable references such as `${{Postgres.DATABASE_URL}}`.
