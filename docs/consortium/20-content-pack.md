# Consortium — Phase 20: Content pack (preludes, CEOs, GEs, colonies)

Branch: `cursor/consortium-content-pack-eb6d`  
Date: 2026-07-31

## Contents

| Type | Count | Notes |
|------|------:|-------|
| Preludes | 8 | CNP1–CNP8; in pool when Consortium + Prelude |
| CEOs | 4 | CNL1–CNL4; dealt when Consortium + CEO |
| Global events | 4 | Turmoil pool when Consortium + Turmoil |
| Colonies | 3 | Psyche, Vesta, Davida — **gated**, never in BASE |

## Save / ongoing-game safety

- **No new GameOptions fields** — old saves keep loading with existing `??` defaults.
- **Project/prelude/CEO decks** are frozen at game create; new cards appear only in **new** games.
- **Global event decks** serialize by name; in-progress Turmoil games do not inject new GEs mid-run.
- **Colonies:** `CONSORTIUM_COLONIES_TILES` is concatenated only when `consortiumExpansion` (or a custom list names one). Non-Consortium colonies games are unchanged. Consortium+colonies games that load after deploy may see the three new tiles in `discardedColonies` (Aridor / “add from discarded”) — active colony rows come from the save and are unchanged.
- **No renames / removals** of existing CardNames.

## Iridium guardrails

- No iridium production on any new card.
- Colonies use titanium / cards / steel only (no recurring iridium).
- Iridium Embargo returns spent iridium to the bank via `Iridium.spend`.

## UI

- `PreludesFilter.vue` — auto-includes consortium preludes when expansion is on.
- `ColoniesFilter.vue` — Consortium group.
- Colony planet art from `tools/consortium-art/build_assets.py`.
