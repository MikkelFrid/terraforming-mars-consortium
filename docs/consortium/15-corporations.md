# Consortium — Phase 15: Corporations

Branch: `feat/consortium-corporations`  
Date: 2026-07-26  
Base: `main` after terrain/general merge

## Theme

Six corporations built last, on strategies that emerged from the 55 project
cards. Each makes a different deck viable.

## Corporations (CNC1–CNC6)

| Corp | Cost | Tags | Notes |
|------|-----:|------|-------|
| Siderite Holdings | 38 | Prospecting, Earth | Start 4 iridium; may spend iridium on any card (this player only) |
| Keystone Consortium | 44 | Structure, Earth | Start 2 iridium; −3 M€ segment cost; +1 M€ prod on keystone |
| Rimward Expeditions | 40 | Space, Earth | −3 M€ frontier place; +4 M€ + draw on any bridge complete |
| Massif Group | 45 | Building | Place highland special tile; −4 M€ on highland-requirement cards |
| Iridium Authority | 42 | Earth | Start 2 iridium; +1 M€ whenever anyone takes iridium from bank |
| Charter Syndicate | 36 | Earth, Structure | Structure/Prospecting ×2 for requirements only, not scoring |

## Stacking

| Case | Behavior |
|------|----------|
| Keystone + Site Foreman + Scaffold Yard | Three segment discounts; `effectiveSegmentCostMc` floors at 0 |
| Siderite + Iridium Reserve + Scarp Foundry | Tag gate lift + rate + steel-on-MS; no double-count of resources |
| Charter Syndicate vs scoring | `TagCardRequirement` doubles; awards/VP (`tags.count`, Iridium Cartel, Grand Contractor, Monument Financing, Ledger of Claims) use raw counts |

## Hooks

| Corp | Hook |
|------|------|
| Siderite Holdings | `Player.paymentOptionsForCard` + client `SelectProjectCardToPlay` |
| Keystone Consortium | `Megastructures.segmentDiscountMc` / `placeSegment` (keystone → prod) |
| Rimward Expeditions | `onTilePlaced` frontier rebate; `MegastructureEffects` bridge `global` |
| Massif Group | `bespokePlay` → `TileType.MASSIF_GROUP`; `getCardDiscount` highland-req set |
| Iridium Authority | `Iridium.grant` (includes self; starting grant → 43 M€) |
| Charter Syndicate | `TagCardRequirement.getScore` |

## Acceptance evidence

- Lint + stylelint clean (eslint, i18n, vue-tsc, stylelint).
- Server tests **7343** (above 7317); client **459** (above 457).
- Unit file per corp; stacking cases covered (Siderite gate, three discounts floor, Charter req vs score, Authority on opponent crater, Rimward free-ride).
- Screenshots: `/opt/cursor/artifacts/screenshots/consortium-corporations-all-six.png`,
  `consortium-corporations-search.png` (`/cards#~mn~tc`).
- Branch: `feat/consortium-corporations`; no PR (merged to main when green).
