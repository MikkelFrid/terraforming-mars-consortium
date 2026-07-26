# Consortium — Phase 18: Player-facing rules

Branch: `feat/consortium-rules`  
Date: 2026-07-26  
Base: `main` after harness-honesty merge

## Where the rulebook lives

The player rulebook is **not** a GitHub wiki page. It is served from this
game instance:

| Location | Role |
|----------|------|
| `assets/consortium/rulebook.html` | Canonical player-facing rulebook |
| URL `/assets/consortium/rulebook.html` | Opened from Help → Rulebooks → Consortium |
| `src/client/utils/WikiLinks.ts` → `RULEBOOK_URLS.consortium` | Shared URL used by Help and setup chrome |

`ServeAsset` allows `.html` only under `assets/consortium/` (png/jpg/json
remain the general asset allowlist).

## Wiring

- `HelpRulebooks.vue` — Consortium listed under Fan Expansions
- `GameSetupDetail.vue` — Consortium expansion icon links to the same URL
- `HelpIconology.vue` — documents Structure, Prospecting, and Iridium
- `.iridium` resource class in `cards.less` for the iconology tile

CardHelp (`CardHelpText.ts`) is per-card FAQ text and does not need tag or
resource entries; iconology covers those.

## Contents covered

Iridium (sources, payment gate, 28 bank, no production), megastructures
(segments, keystone, completion, unfinished = 0 VP), three Bridges / frontier
unlock, chasm / crater field / highland, Structure & Prospecting tags, Core
Sampling, Mason / Pathfinder / Assayer, Underwriter / Cartographer / Refiner.
