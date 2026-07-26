# Consortium — Phase 17: Railway deploy

Date: 2026-07-27  
Account: `mikkel.frid@live.dk`

## Live instance (verified)

| Item | Value |
|------|-------|
| Project | `incredible-heart` (`de35a201-2f8d-4af2-9a61-6520c59e23bb`) |
| Environment | `production` |
| App service | `terraforming-mars-consortium` (`5ad68a8b-…`) |
| Database | Postgres with volume (`1c3427e4-…`) |
| Public URL | https://terraforming-mars-consortium-production.up.railway.app |
| Branch deployed | `main` |
| Replicas | 1 running / 0 crashed |
| Scale-to-zero | off |

### Runtime (after config)

```
Connecting to Postgres database.
Server is ready.
"type": "POSTGRESQL"
Preloaded 1 IDs.
0 games to be purged.
GameLoader loaded game g8b52ab597d0a into memory from database
```

### Verification performed

- Deployment **SUCCESS**, no crash loop
- Build log clean (webpack asset-size warnings only)
- Lobby/API: created solo game with `expansions.consortium: true`, board `consortium`
- Dealt **Keystone Consortium** corporation (module live)
- Played through generation 1 → generation 2 research
- **Redeployed** service; same game reloaded at gen 2 with Keystone Consortium still in tableau
- `MAX_GAME_DAYS=36500` set (`0 games to be purged`)

### Variables on the app service

| Variable | Value |
|----------|-------|
| `POSTGRES_HOST` | Railway Postgres URL (from `Postgres.DATABASE_URL`) |
| `MAX_GAME_DAYS` | `36500` |
| `POSTGRES_TRIM_COUNT` | `0` |
| `GAME_CACHE` | `sweep=manual` |
| `SERVER_ID` | set (random) |
| `STATS_ID` | set (random) |
| `PORT` | unset (Railway injects; process logs port 8080) |

## Note on rulebook

Player rulebook + Help wiring live on branch `feat/consortium-rules`.
The Railway service tracks `main`, so `/assets/consortium/rulebook.html` and
Help → Rules → Consortium are **not** on the live URL until that branch is
merged to `main` and Railway redeploys.

## Guardrails

Logs, status, redeploys of the existing service only. No new paid resources
without asking. No credentials in the repo — use Railway variable references.
