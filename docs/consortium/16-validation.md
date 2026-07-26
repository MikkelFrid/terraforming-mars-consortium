# Consortium — Phase 16: Full-game validation

Branch: `feat/consortium-validation`
Date: 2026-07-26
Harness: `tools/consortium/validate.ts` (TypeScript via `npx tsx`)

## Why TypeScript

The game engine, `PlayerInput` resolution, and seeded `Game.newInstance`
are TypeScript. A `tsx` harness drives the same code path as production
and reuses the fake-DB pattern from `tests/testing/setup.ts`.

## Method

- Solo games to `Phase.END`, fixed seed set starting at **42000**
- **200** games per configuration
- Random actor biased toward Consortium plays, Core Sampling, megastructure contributions
- Retries alternate `OrOptions` on actor payment failures before counting a crash
- "Legally playable" = appeared in `getPlayableCards()` or a play-card menu
- **Board note:** Consortium map currently has **0 ocean spaces**. `PlaceOceanTile`
  soft-skips when no spaces exist (otherwise Prelude ocean cards crash).

## 1. Crashes

| Config | Games | Crashes | Notes |
|--------|------:|--------:|-------|
| baseline-no-consortium | 200 | 0 | ok |
| consortium | 200 | 0 | ok |
| consortium+corporate-era | 200 | 0 | ok |
| consortium+prelude | 200 | 0 | ok |
| consortium+colonies | 200 | 0 | ok |
| consortium+turmoil | 200 | 0 | ok |

**Zero crashes across all configurations.**

## 2. Unreachable cards

Union of playable Consortium project cards across all Consortium-enabled runs.
Listed cards were **never** legally playable in any run (may be legitimately rare).

| Metric | Value |
|--------|------:|
| Consortium project cards | 55 |
| Seen as playable (≥1 run) | 6 |
| Never playable | 49 |

| Card |
|------|
| Siderophile Extraction |
| Assay Rights |
| Core Sample Survey |
| Deep Crust Mapping |
| Impact Basin Claim |
| Regolith Sifters |
| Prospector's Camp |
| Meteoritic Refinery |
| Iridium Cartel |
| Scaffold Yard |
| Survey Stake |
| Site Foreman |
| Bonded Labour |
| Highland Anchor |
| Segment Prefabrication |
| Consortium Charter |
| Keystone Rights |
| Union Hall |
| Structural Engineers |
| Load Bearing Study |
| Grand Contractor |
| Monument Financing |
| Trailhead Camp |
| Frontier Survey |
| Rim Outpost |
| Chasm Descent |
| Overland Convoy |
| Sector Claim |
| Deep Reach Rover |
| Far Side Boomtown |
| Wayfarer Compact |
| Frontier Charter |
| Highland Terrace |
| Basalt Quarry |
| Ejecta Blanket |
| Scarp Foundry |
| Plateau Reservoir |
| Talus Reclamation |
| Impact Glass Works |
| Rimwall Habitat |
| Escrow Account |
| Bonded Freight |
| Consortium Levy |
| Tender Process |
| Refit Yard |
| Joint Venture |
| Charter Revision |
| Guild Arbitration |
| Ledger of Claims |

Note: solo random-actor coverage is incomplete by design — cards that need
multi-player interaction, rare tags, or ocean placement on the Consortium
board (which currently has **zero** `SpaceType.OCEAN` spaces) will appear here.

## 3. Megastructure completion rate

| Kind | Appearances (in play) | Completions | Rate | Mean gen when completed |
|------|----------------------:|------------:|-----:|------------------------:|
| bridge | 3000 | 2000 | 66.7% | 11.8 |
| space_elevator | 400 | 0 | 0.0% | — |
| l1_magnetic_shield | 200 | 0 | 0.0% | — |
| mohole | 200 | 0 | 0.0% | — |
| solar_mirror | 600 | 0 | 0.0% | — |
| arcology | 600 | 0 | 0.0% | — |

## 4. Bridge completion rate

| Config | Games (ok) | Games with ≥1 bridge | Rate ≥1 | Mean bridges completed / game |
|--------|-----------:|---------------------:|--------:|------------------------------:|
| consortium | 200 | 200 | 100.0% | 1.00 |
| consortium+corporate-era | 200 | 200 | 100.0% | 3.00 |
| consortium+prelude | 200 | 200 | 100.0% | 3.00 |
| consortium+colonies | 200 | 0 | 0.0% | 0.00 |
| consortium+turmoil | 200 | 200 | 100.0% | 3.00 |

**Design signal:** `consortium+colonies` completed ≥1 bridge in only 0.0% of games.
If this holds under human play, the frontier cluster is starved when Colonies competes for M€.

## 5. Iridium flow

Bank capacity: **28**.

| Config | Mean granted | Mean spent | Mean low-water | Games bank hit 0 |
|--------|-------------:|-----------:|---------------:|-----------------:|
| consortium | 11.0 | 11.0 | 24.0 | 0 |
| consortium+corporate-era | 16.0 | 10.0 | 22.0 | 0 |
| consortium+prelude | 10.0 | 10.0 | 26.0 | 0 |
| consortium+colonies | 5.0 | 5.0 | 27.0 | 0 |
| consortium+turmoil | 9.0 | 9.0 | 26.0 | 0 |

## 6. Game length (generations)

| Config | Games (ok) | Mean gen | Median gen | Min | Max |
|--------|-----------:|---------:|-----------:|----:|----:|
| baseline-no-consortium | 200 | 14.00 | 14 | 14 | 14 |
| consortium | 200 | 14.00 | 14 | 14 | 14 |
| consortium+corporate-era | 200 | 14.00 | 14 | 14 | 14 |
| consortium+prelude | 200 | 12.00 | 12 | 12 | 12 |
| consortium+colonies | 200 | 14.00 | 14 | 14 | 14 |
| consortium+turmoil | 200 | 14.00 | 14 | 14 | 14 |

Consortium vs baseline mean generation delta: **0.00**.

## Rerun

```bash
npx tsx tools/consortium/validate.ts --games=200 --seed-base=42000 --out=docs/consortium/16-validation.md
```
