# Consortium — Phase 12: Frontier cards

Branch: `cursor/consortium-frontier-cards-981e`  
Date: 2026-07-26  
Base: `main` after Structure / Mason·Underwriter merge

## Theme

Frontier is a **theme**, not a tag. These ten cards are about the land beyond
the chasms. Most are weak or unplayable until a bridge opens a sector — holding
a dead card because you believe someone will fund the bridge is intentional.

## Helper

`src/server/consortium/Frontier.ts`

| Method | Meaning |
|--------|---------|
| `countOpenSectors(game)` | Bridges with `completed === true` (0–3) |
| `isFrontierSpace(space)` | `space.bridge !== undefined` |
| `isFormerChasm(space)` | `sector` set, no `bridge`, `LAND` (post-unlock) |
| `availableFrontierSpaces` | Unlocked frontier land the player may place on |
| `availableFormerChasmSpaces` | Former-chasm land the player may place on |
| `countOwnedFrontierTiles` | Owned tiles with `bridge` set |

## Cards (CN25–CN34)

| Card | Cost | Tags | Notes |
|------|-----:|------|-------|
| Trailhead Camp | 6 | Building | Special tile on legal frontier space |
| Frontier Survey | 9 | Science | Draw 1 + 1 per open sector |
| Rim Outpost | 12 | Building | Req ≥1 open sector; frontier tile; +2 M€ prod (RW) |
| Chasm Descent | 14 | Building | Req ≥1 bridge complete; former-chasm tile only; +3 iridium |
| Overland Convoy | 16 | Space | +2 M€ per owned frontier tile |
| Sector Claim | 18 | — | Req ≥1 open sector; −4 M€ frontier placements (rebate) |
| Deep Reach Rover | 20 | Science, Building | Action: +1 iridium if you own a frontier tile |
| Far Side Boomtown | 23 | Building, City | Req ≥1 open sector; city on frontier; +2 M€ prod; 1 VP (RW) |
| Wayfarer Compact | 25 | Earth | Req ≥2 open sectors; +3 M€ prod; 1 VP |
| Frontier Charter | 28 | Earth | 1 VP / 2 owned frontier tiles |

No Structure tags on this cluster.

## Sector Claim rebate

`SECTOR_CLAIM_REBATE` = 4 in `MEGASTRUCTURE_BALANCE`. Implemented as
`onTilePlaced` → +4 M€ when the owner places on a frontier space (Gordon /
`place6mc` pattern). City/greenery SP base costs are paid before space choice;
the rebate is what the player experiences as “costs 4 less.”

## Art

| Asset | Generator |
|-------|-----------|
| `trailhead_camp.png` | `build_trailhead_camp` |
| `rim_outpost.png` | `build_rim_outpost` |
| `chasm_descent.png` | `build_chasm_descent` |

## Prior rename (landed on main)

Milestone **Mason** (was C. Architect), award **Underwriter** (was C. Founder).
