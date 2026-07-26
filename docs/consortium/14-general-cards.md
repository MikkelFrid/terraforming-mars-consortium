# Consortium — Phase 14: General cards

Branch: `feat/consortium-terrain-general`  
Date: 2026-07-26  
Base: `main` after Frontier merge (same branch as terrain)

## Theme

Twelve curve-fillers that give the expansion economic texture. Most touch
iridium or megastructures lightly rather than being about them.

## Cards (CN44–CN55)

| Card | Cost | Tags | Notes |
|------|-----:|------|-------|
| Escrow Account | 5 | Earth | +3 M€, draw 1 |
| Standard Gauge | 8 | Building | +1 steel prod (RW) |
| Bonded Freight | 10 | Space, Earth | +1 titanium, +1 iridium |
| Consortium Levy | 12 | Earth | +2 M€ / Structure tag |
| Tender Process | 14 | Earth | Look at top 4, keep 2 |
| Mineral Rights | 16 | Prospecting, Earth | +1 M€ per crater-field iridium gained |
| Refit Yard | 18 | Building, Structure | Action: 3 M€ → 1 steel + 1 titanium |
| Iridium Reserve | 20 | Structure | +2 iridium; iridium pays at 5 M€ |
| Joint Venture | 22 | Earth, Structure | ≥1 MS contribution; +4 M€ prod |
| Charter Revision | 24 | Earth, Science | Draw 3; +1 M€ prod; 1 VP |
| Guild Arbitration | 27 | Earth | 3 Earth tags; +8 M€; 2 VP |
| Ledger of Claims | 30 | Earth, Structure | 1 VP / 3 crater∪highland∪frontier tiles |

## Payment composition

| Card | Channel |
|------|---------|
| Scarp Foundry (terrain) | `steelRate` on megastructure payments only |
| Iridium Reserve | `Player.iridiumValue` (default 4 → 5) for **all** pays |

Together: 2 steel + 1 iridium on a segment = `2×3 + 1×5 = 11`, never double-counted.
Ordinary building-card steel stays at 2 while Scarp Foundry is in play.

## Mineral Rights

Hook: `ICard.onCraterIridiumGained`, fired from `Game.grantPlacementBonuses`
immediately after the crater iridium grant.

## Acceptance evidence

- Lint + stylelint clean.
- Server tests **7317** (above 7242); client **457** (above 455).
- Unit file per card; Ledger of Claims category + floor(/3); RW for Standard
  Gauge (Building production). Joint Venture / Charter Revision have no
  Building tag — not RW targets.
- Screenshots: `/opt/cursor/artifacts/screenshots/general-cards-all-twelve.png`
- Branch: `feat/consortium-terrain-general`; no PR (merged to main when green).
