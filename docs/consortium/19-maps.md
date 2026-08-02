# Consortium — Three maps

Branch: `cursor/consortium-three-maps-d5a9`  
Date: 2026-07-27  
Base: `main`

## Variants

Same hex geometry (radius 6, 127 spaces, shared PNG + `board_positions.less`).
Terrain overlays differ:

| Map | `BoardName` | Feel | Highlands | Chasms | Locked frontier | Craters |
|-----|-------------|------|----------:|-------:|----------------:|--------:|
| **Massif** | `consortium` | Balanced default | 6 | 24 | 27 | 12 |
| **Rift Basin** | `rift basin` | Iridium hunger; bridges open rich rim | 6 (clustered) | 30 | 33 | 13 |
| **Archipelago** | `archipelago` | Structure / foundation play | 9 | 18 | 21 | 12 |

All keep **13 oceans** in the core (never gated by a bridge).

## Generator

```bash
python3 tools/consortium-art/build_board.py
```

Writes:

- `assets/board/mars_consortium.png` (shared)
- `src/styles/board_positions.less` (shared)
- `src/server/boards/consortiumSpaces.json` (Massif)
- `src/server/boards/consortiumRiftSpaces.json`
- `src/server/boards/consortiumArchipelagoSpaces.json`
- `assets/consortium/maps/massif.png` / `rift.png` / `archipelago.png` (terrain previews)

Do not hand-edit JSON/LESS/PNG — change `VARIANTS` in the generator and rerun.

## Previews

Terrain previews (Mars disc + hex overlays + legend) are used by:

- Player rulebook §2 (`assets/consortium/rulebook.html#board`, anchors `#massif` / `#rift-basin` / `#archipelago` / `#consortium`)
- Lobby create-game board column when Consortium is enabled
- Lobby board ⓘ → rulebook anchors (not upstream wiki — see below)

Paths come from `consortiumBoardPreviewUrl()` in `src/common/boards/ConsortiumBoards.ts`.

### Upstream wiki Maps#consortium

https://github.com/terraforming-mars/terraforming-mars/wiki/Maps has no Consortium
section yet, and this fork cannot write that wiki. Paste-ready markdown (absolute
Railway image URLs): `docs/consortium/wiki-Maps-consortium.md`.

## Lobby / API

- Consortium expansion on → three native maps **plus** every other board
  (standard / fan). Non-native boards get a terrain overlay
  (`ConsortiumMapOverlay.ts`) — see `docs/consortium/24-borbarad-feedback.md`
- Default selection unchanged when enabling the checkbox (current board kept)
- API keeps an explicit board pick (Tharsis + Consortium is valid overlay)
- Random `ALL` without Consortium filters Consortium maps out

## Code map

| Concern | Path |
|---------|------|
| Board ids + labels | `src/common/boards/BoardName.ts`, `ConsortiumBoards.ts` |
| Load JSON by board | `src/server/boards/ConsortiumBoard.ts` |
| Factory | `src/server/GameSetup.ts` |
| MA set (shared) | `Milestones.ts`, `Awards.ts`, `MilestoneAwardSelector.ts` |
