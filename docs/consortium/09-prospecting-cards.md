# Consortium — Phase 09: Prospecting cards

Branch: `feat/consortium-prospecting-cards`  
Date: 2026-07-26  
Base: `main` after megastructure effects merge (`bbe9c37cf`)

## Part 1 — Card render iridium

Debt from phase 04 is cleared:

| Layer | Change |
|-------|--------|
| `CardRenderItemType.IRIDIUM` | New render token |
| `CardRenderer.iridium()` | Builder API (mirrors steel/titanium) |
| `CardRenderItemComponent` | CSS class `card-resource-iridium` |
| `cards_v2.less` | `url(./assets/resources/iridium.png)` |
| Behavior | `behavior.iridium` grants from the shared bank via `Iridium.grant` |

Requirement icons already pointed at `card-resource-iridium`; the CSS now exists.

## Part 2 — Prospecting cluster (10 cards)

All carry `Tag.PROSPECTING`. Registered in `CONSORTIUM_CARD_MANIFEST.projectCards`.

| Card | Cost | Tags | Notes |
|------|-----:|------|-------|
| Siderophile Extraction | 32 | Prospecting, Science | No building tag. Crater-field ownership req. +2 iridium; `onGenerationStart` +1 if bank has any. 2 VP |
| Salvage Claim | 7 | Prospecting | Event. +1 iridium, draw 1 |
| Assay Rights | 9 | Prospecting | Event. Look top 3; take one Structure/Prospecting |
| Core Sample Survey | 11 | Prospecting | +2 iridium |
| Deep Crust Mapping | 12 | Prospecting, Science | Draw 2, +1 iridium |
| Impact Basin Claim | 14 | Prospecting, Building | Special tile on crater field, +2 iridium |
| Regolith Sifters | 16 | Prospecting, Building | +1 steel prod, +1 iridium (RW-compatible) |
| Prospector's Camp | 18 | Prospecting, Building | +1 iridium per owned crater field tile |
| Meteoritic Refinery | 20 | Prospecting, Building | Req 1 iridium. When you spend iridium, +2 M€. 1 VP |
| Iridium Cartel | 24 | Prospecting, Earth | Req 2 Prospecting tags. +3 iridium. 1 VP / 2 Prospecting tags |

## Hooks

| Mechanism | Where |
|-----------|--------|
| Start-of-generation iridium | `ICard.onGenerationStart` → `Game.startGeneration` (same timing as Mohole) |
| Spend-iridium effect | `ICard.onIridiumSpent` → after `Iridium.spend` in `Player.pay` |
| Stock gain on cards | `behavior.iridium` in `Executor` |

## Art

`assets/tiles/special_tile_icons/impact_basin.png` from
`tools/consortium-art/build_assets.py` → `build_impact_basin`.

## Invariants

- Siderophile Extraction must **not** gain a building tag or a production box
- No iridium production slot exists or will exist
- Robotic Workforce can copy Regolith Sifters steel production only among this cluster
