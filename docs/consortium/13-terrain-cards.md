# Consortium — Phase 13: Terrain cards

Branch: `feat/consortium-terrain-general`  
Date: 2026-07-26  
Base: `main` after Frontier merge

## Theme

Nine cards that exploit the three new space types (crater field, highland,
former chasm). Tags are existing ones — no new tags. Structure appears only
on Scarp Foundry.

## Helper

`src/server/consortium/Terrain.ts`

| Method | Meaning |
|--------|---------|
| `ownsCraterTile` / `ownsHighlandTile` | Ownership gates |
| `availableHighlandSpaces` | Legal highland land placements |
| `availableSpacesAdjacentToCrater` | Adjacent to any crater-field space |
| `availableFormerChasmGreenerySpaces` | Greenery-legal ∩ former chasm |
| `countCraterFieldTilesOnMars` | All crater tiles (any owner) |
| `countOwnedTerrainClaimTiles` | Crater + highland + frontier owned |

## Cards (CN35–CN43)

| Card | Cost | Tags | Notes |
|------|-----:|------|-------|
| Crater Sifting | 7 | Prospecting, Building | Own crater tile → +2 iridium |
| Highland Terrace | 11 | Building, Plant | Own highland → +1 plant prod, +1 plant (RW) |
| Basalt Quarry | 13 | Building | Special tile on highland; +1 steel prod (RW) |
| Ejecta Blanket | 15 | Building | Special tile adjacent to crater; +2 steel, +1 iridium |
| Scarp Foundry | 17 | Building, Structure | Own highland; segment steel @ 3 M€ |
| Plateau Reservoir | 19 | Building | 3 oceans; highland tile; +2 plant prod (RW) |
| Talus Reclamation | 21 | Building | ≥1 bridge done; greenery on former chasm only |
| Impact Glass Works | 23 | Building, Science | 1 iridium / crater tile on Mars, max 4; 1 VP |
| Rimwall Habitat | 26 | Building, City | Own highland; city on highland; +2 M€ prod; 1 VP (RW) |

## Design locks

- Scarp Foundry is **segment-scoped** (`getMegastructureSteelValue`); ordinary
  card steel spends stay at `getSteelValue()`.
- Impact Glass Works counts **all** crater tiles on Mars, not just yours.
- Talus Reclamation is the only greenery path onto converted chasm; targets
  must be `Frontier.isFormerChasm`.

## Art

| Asset | Generator |
|-------|-----------|
| `basalt_quarry.png` | `build_basalt_quarry` |
| `ejecta_blanket.png` | `build_ejecta_blanket` |
| `plateau_reservoir.png` | `build_plateau_reservoir` |

## Acceptance evidence

- Lint + stylelint clean.
- Server tests above 7242; client above 455.
- Unit file per card; Scarp Foundry + Iridium Reserve composition; Talus
  former-chasm gate; Impact Glass Works cap; RW for production Building cards.
- Codegen rerun; screenshots under `/opt/cursor/artifacts/screenshots/`.
- Branch: `feat/consortium-terrain-general`; no PR (merged to main when green).
