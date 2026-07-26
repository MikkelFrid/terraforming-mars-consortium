# Consortium — Phase 10: Structure cards, milestones, awards

Branch: `feat/consortium-structure-cards`  
Date: 2026-07-26  
Base: `main` after prospecting merge

## Part 1 — Structure cluster (14 cards)

All carry `Tag.STRUCTURE`. Registered in `CONSORTIUM_CARD_MANIFEST.projectCards`
(24 project cards total with Prospecting).

| Card | Cost | Tags | Notes |
|------|-----:|------|-------|
| Scaffold Yard | 8 | Structure, Building | One-shot −3 M€ on next segment this generation |
| Survey Stake | 10 | Structure | Draw 2; keep one Structure; discard other |
| Modular Truss | 12 | Structure, Building | +1 steel prod (RW-compatible) |
| Site Foreman | 13 | Structure | Permanent −2 M€ on segments while in play |
| Bonded Labour | 15 | Structure, Earth | +4 M€ per megastructure contributed to |
| Highland Anchor | 17 | Structure, Building | Req own highland; place special tile; +2 iridium |
| Segment Prefabrication | 19 | Structure, Building | Action: 2 steel → 1 iridium |
| Consortium Charter | 21 | Structure, Earth | Req 2 Structure; +1 M€ prod; 1 VP |
| Keystone Rights | 23 | Structure | Req 1 iridium; +3 VP once for a keystone |
| Union Hall | 24 | Structure, Building, City | City; +1 M€ prod per completed megastructure |
| Structural Engineers | 26 | Structure, Science | Owner-only highland foundation bypass; 1 VP |
| Load Bearing Study | 27 | Structure, Science | Draw 3; +2 iridium; 1 VP |
| Grand Contractor | 30 | Structure, Earth | Req 3 Structure; 1 VP per MS with ≥2 segments owned |
| Monument Financing | 33 | Structure, Earth | +2 M€ prod; 1 VP / 3 Structure tags |

### Design locks

- **Scaffold Yard + Site Foreman stack.** Intentional balance knob for phase 8.
  Knobs: `MEGASTRUCTURE_BALANCE.SCAFFOLD_YARD_DISCOUNT` (3),
  `SITE_FOREMAN_DISCOUNT` (2) in `src/common/consortium/MegastructureConstants.ts`.
- **Structural Engineers** bypasses highland foundation only when the card is in
  that player's tableau (`Megastructures.meetsFoundation`).
- **Keystone Rights** sets `card.data = true` on the first keystone the owner
  places; further keystones do not add VP (`KEYSTONE_RIGHTS_EXTRA_VP` = 3).

## Part 2 — Milestones and awards

Consortium had none. Fixed board registration follows other maps
(`milestoneManifest.boards` / `awardManifest.boards` +
`MilestoneAwardSelector` `NONE` switch for `BoardName.CONSORTIUM`).

### Names

Architect / Founder collided with existing MAs. Final names are crafts/roles
in the game's own register: **Mason** (milestone), **Underwriter** (award).
Pathfinder, Assayer, Cartographer, Refiner were free. Save renames map
`C. Architect`→`Mason` and `C. Founder`→`Underwriter`.

### Milestones

| Name | Rule | Threshold constant |
|------|------|--------------------|
| Mason | Total segments contributed | `CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS` **= 5** |
| Pathfinder | Owned tiles with `space.bridge` set | `PATHFINDER_FRONTIER_TILES` **= 3** |
| Assayer | Prospecting + Structure tags | `ASSAYER_TAG_TOTAL` **= 6** |

### Awards

| Name | Score |
|------|-------|
| Underwriter | Most megastructure segments contributed |
| Cartographer | Most owned tiles in frontier zones |
| Refiner | Most iridium spent over the game (`player.iridiumSpent`) |

### Guessed thresholds (tune in phase 8)

All three milestone thresholds live in
`src/common/consortium/MegastructureConstants.ts` → `CONSORTIUM_MA_BALANCE`:

| Knob | Value | Rationale (first pass) |
|------|------:|------------------------|
| `ARCHITECT_SEGMENTS` | 5 | Slightly above one full bridge (4); forces multi-track play |
| `PATHFINDER_FRONTIER_TILES` | 3 | Board has many `bridge`-tagged spaces; 3 is a mid claim |
| `ASSAYER_TAG_TOTAL` | 6 | Half of the 24 Consortium project cards' tag pool; mid-game |

Awards have no numeric threshold (relative). Synergy weights for fan/random MA:
`Mason`↔`Underwriter` 9, `Pathfinder`↔`Cartographer` 9, `Assayer`↔`Refiner` 2
in `MilestoneAwardSynergies.ts`.

### Iridium spent tracking

`IPlayer.iridiumSpent` / `SerializedPlayer.iridiumSpent`, incremented in
`Iridium.spend`. Used by Refiner; also useful for balance analysis.

## Art

| Asset | Generator |
|-------|-----------|
| `assets/tiles/special_tile_icons/highland_anchor.png` | `build_highland_anchor` in `tools/consortium-art/build_assets.py` |

## Hooks

| Mechanism | Where |
|-----------|--------|
| Segment discounts | `Megastructures.segmentDiscountMc` / `effectiveSegmentCostMc` |
| Scaffold Yard clear | on `placeSegment`; also `Game.startGeneration` |
| Foundation bypass | `Megastructures.meetsFoundation` + Structural Engineers |
| Keystone Rights claim | `Megastructures.placeSegment` when keystone |
| Frontier tiles | `space.bridge !== undefined` + owned tile |

## Acceptance evidence

| Criterion | Result |
|-----------|--------|
| Lint (incl. stylelint) | `npm run lint` passed |
| Server / client tests | **7205** / **453** |
| Codegen | `make:cards` + `make:css` |
| Screenshots | `/opt/cursor/artifacts/screenshots/structure-cards-all-fourteen.png`, `consortium-milestones-awards.png`, `consortium-ma-cardlist.png` |
