# Consortium — Phase 05: Board map

Branch: `feat/consortium-board`  
Date: 2026-07-25  
Base: `main` after iridium merge (`24b0137cf`)

## Generator

`python3 tools/consortium-art/build_board.py` (Pillow only) produces:

| Output | Spec |
|--------|------|
| `assets/board/mars_consortium.png` | 891×860 RGBA (mars.png upscaled 1.44× with grain) |
| `src/styles/board_positions.less` | 127 CSS margin rules (`.board-space-001` …) |
| `src/server/boards/consortiumSpaces.json` | 127 space records |

Confirmed: **127 spaces**, hex field **634×542**, field origin **137, 134**
(centred on the planet disc), types land 85 / crater 12 / chasm 24 / highland 6.

Do not hand-edit generated files — change the generator and rerun.

## Board module

`ConsortiumBoard` loads JSON (not `BoardBuilder`'s 9-row grid). Mapping:

| JSON `type` | `SpaceType` | Rules |
|-------------|-------------|--------|
| `land` | `LAND` | Normal land |
| `highland` | `HIGHLAND` | No ocean |
| `crater` | `CRATER_FIELD` | One-time iridium grant |
| `chasm` | `CHASM` | Unplaceable |

Frontier spaces with `locked: true` are unplaceable until their bridge completes.
Bridges do not exist yet: `isFrontierUnlocked` always returns false for locked
spaces (`TODO(consortium)`).

Space bonuses: none yet — `spaceBonuses()` is an empty hook.

Adjacency uses axial `(q, r)` neighbors (Board's rectangular algorithm does not
apply to a radius-6 hexagon). `SpaceId` accepts 3-digit ids (`001`–`127`).

## CSS sizing (Consortium-scoped)

`.board-cont.board-consortium` is 891×860 with `mars_consortium.png`.
Inner `.board` is full-size (hex margins include the generator OFFSET).
Ocean / oxygen / temperature tracks and colony tiles are scaled from the
Tharsis 620×600 chrome (`transform: scale(891/620, 860/600)`), pinned to the
`.board-cont` origin. Tharsis / Hellas / Elysium / Amazonis keep the default
600×488 / 670px container — pixel-identical.

At a typical 1280×800 viewport the 891×860 board does not leave room for the
player panel without scrolling — the map may simply be too large.

## Lobby

`CreateGameForm.boards()` appends `BoardName.CONSORTIUM` only when
`expansions.consortium` is true.

## Follow-ups

1. Bridge megastructures → `isFrontierUnlocked`
2. Space bonus layout
3. Legend labels (optional)
