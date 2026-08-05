# Consortium — Borbarad feedback (UI + all maps)

Branch: `cursor/borbarad-feedback-maps-4d4a`  
Date: 2026-08-02  
Base: `main`

## Scope

Feedback from Borbarad (Christian): corp title overlap, corp effect icons,
Mars grid offset, parameter tracks (already fixed), locked frontier clarity
(already fixed), MA density, and map compatibility.

Upstream / official-app beta is deferred until more playtesting.

## Changes

| Item | Fix |
|------|-----|
| Corp names vs tags | Six `'css'` logo entries + fixed-width wrap in `cards_v2.less` |
| Corp effect icons | New `CardRenderItemType`s: bridge, highland, megastructure segment, keystone segment; Siderite uses card + asterisk |
| Mars grid one line low | `OFFSET_Y += PITCH_Y` in `build_board.py`; regenerated PNG / LESS / JSON |
| MA 5+5 | Consortium NONE keeps themed 3+3, pads to 5+5 from modular pool; Venus/Ares/Moon still append |
| All maps | Lobby + API allow any board with Consortium on; non-native boards get `applyConsortiumOverlay` |

## Overlay (standard / fan maps)

`GameSetup.newBoard` stamps highland / crater / chasm / locked frontier onto
land spaces when `consortiumExpansion && !isConsortiumBoard(boardName)`.

Compressed Massif-scale targets on 61-hex boards: 4 highlands, 6 craters,
9 chasms (3×3 sectors), 12 locked frontier (4×3). Native Massif / Rift /
Archipelago JSON is unchanged.

Locked placement rules moved to `Board` / `MarsBoard` so overlay boards share
them with `ConsortiumBoard`.

## MA policy

With Consortium on and `randomMA: NONE`, selection always uses the Consortium
themed set (Mason / Pathfinder / Assayer + Underwriter / Cartographer /
Refiner), including on overlay boards — not the host map’s Tharsis/Hellas/…
set. Two fillers each come from the modular pool gated by active expansions.

## Files

| Concern | Path |
|---------|------|
| Overlay | `src/server/consortium/ConsortiumMapOverlay.ts` |
| Board factory | `src/server/GameSetup.ts` |
| MA pad | `src/server/ma/MilestoneAwardSelector.ts` |
| Lobby | `src/client/components/create/CreateGameForm.vue` |
| API | `src/server/routes/ApiCreateGame.ts` |
| Logos | `CardCorporationLogo.vue`, `cards_v2.less` |
| Icons | `CardRenderItemType.ts`, `CardRenderer.ts`, `CardRenderItemComponent.vue`, corp files |
| Grid | `tools/consortium-art/build_board.py` (+ generated assets) |
