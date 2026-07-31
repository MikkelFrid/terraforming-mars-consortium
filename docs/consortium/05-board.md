# Consortium — Phase 05: Board map

Branch: `feat/consortium-board`  
Date: 2026-07-25  
Base: `main` after iridium merge (`24b0137cf`)

## Generator

`python3 tools/consortium-art/build_board.py` (Pillow only) produces:

| Output | Spec |
|--------|------|
| `assets/board/mars_consortium.png` | **1782×1720** RGBA (2×). CSS paints it at 891×860 via `background-size` so hex coords stay put. Planet disc = EDSR neural upscale of `mars.png`; chrome (tracks/labels/icons) is redrawn crisp in the generator — not soft-upscaled 620px text. |
| `src/styles/board_positions.less` | 127 CSS margin rules (`.board-space-001` …) |
| `src/server/boards/consortiumSpaces.json` | 127 space records |

Confirmed: **127 spaces**, hex field **634×542**, field origin **137, 134**
(centred on the planet disc). Massif (default) types: land 72 / crater 12 /
chasm 24 / ocean 13 / highland 6.

Three terrain variants share this geometry — see `docs/consortium/19-maps.md`
(Massif / Rift Basin / Archipelago).

Do not hand-edit generated files — change the generator and rerun.

## Board module

`ConsortiumBoard` loads JSON (not `BoardBuilder`'s 9-row grid). Mapping:

| JSON `type` | `SpaceType` | Rules |
|-------------|-------------|--------|
| `land` | `LAND` | Normal land |
| `ocean` | `OCEAN` | Core ocean-reserved (13); parameter never gated behind a bridge |
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

`.board-cont.board-consortium` is logically 891×860 with
`background-size: 891px 860px` on the 2× `mars_consortium.png`.
Inner `.board` is full-size (hex margins include the generator OFFSET).
Ocean / oxygen / temperature tracks and colony tiles are scaled from the
Tharsis 620×600 chrome (`transform: scale(891/620, 860/600)`), pinned to the
`.board-cont` origin. Tharsis / Hellas / Elysium / Amazonis keep the default
600×488 / 670px container — pixel-identical.

### Board scale preference

Settings → **Consortium board scale** (`consortium_board_scale`, default
**0.85**, range 0.7–1.0 step 0.05). Applied as:

```css
transform: scale(var(--consortium-board-scale, 1));
transform-origin: top center;
margin-bottom: calc((var(--consortium-board-scale, 1) - 1) * 900px);
```

At 0.85 the board paints at ~757×731 and fits a 1080p page with the player
panel; at 1.0 it is full size for 1440p+. Hit-testing uses element
`onclick` on each space (no raw coordinates), so the CSS transform does not
skew selection.

## Lobby

`CreateGameForm.boards()` appends `BoardName.CONSORTIUM` only when
`expansions.consortium` is true.

## Follow-ups

1. Bridge megastructures → `isFrontierUnlocked`
2. Space bonus layout
3. Legend labels (optional)
