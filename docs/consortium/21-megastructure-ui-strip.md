# Consortium — Phase 21: Megastructure UI strip

Branch: `cursor/megastructure-ui-strip-eb6d`  
Date: 2026-07-31

## Changes (UI + additive API fields only)

- Megastructures panel **always open** (collapse removed)
- Compact **grid strip** under the board with outcome one-liners
- Hover Bridge → highlight that sector’s frontier spaces on the map
- Locked frontier spaces dimmed via `SpaceModel.locked`

## Save safety

- No GameOptions / serialize changes
- New optional SpaceModel fields (`bridge`, `locked`) and MegastructureModel `outcome`
  are additive API payload only — existing DB games load unchanged
- Redeploy may restart the Node process; Postgres-backed games reload from DB
