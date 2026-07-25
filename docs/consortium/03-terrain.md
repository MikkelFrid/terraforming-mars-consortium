# Consortium — Phase 03: Terrain space types (placement rules)

Branch: `feat/consortium-terrain`  
Date: 2026-07-25  
Base: `main` after `feat/consortium-tags` merge (`b89b12b19`)

## Board module followed

**Primary template: Amazonis / `SpaceType.RESTRICTED` + base `Board` / `MarsBoard` placement.**

| Concern | Module / path followed | Why |
|---------|------------------------|-----|
| Unplaceable space type | Amazonis `RESTRICTED` via `BoardBuilder.restricted()`, exclusion from land/ocean availability | Recon §7: first-class “nothing may be placed” |
| Land-like alternate types | Arabia Terra `COVE` / Hollandia `DEFLECTION_ZONE` pattern (folded into land availability) | Crater field and highland must accept cities/greenery/specials |
| Ocean-on-land filtering | `PlaceOceanTile` + hard reject in `Game.addTile` | Artificial Lake / Small Comet use `ocean: {on: 'land'}` |
| Tile-on-tile cover | **Not used** (Ares `canCover`) | This phase adds empty-space rules only; no covering behaviour |

`starwars` is cards-only and was not used.

## Chasm mechanism decision

**Chose a new enum value `SpaceType.CHASM`, not reusing the `RESTRICTED` enum value.**

Reuse of the **exclusion mechanism** (never offered by `getAvailableSpacesOnLand` / `canPlaceTile`; hard-rejected in `Game.addTile` via `Board.isUnplaceableSpaceType`):

```ts
Board.isUnplaceableSpaceType(t) ===
  t === SpaceType.RESTRICTED || t === SpaceType.CHASM
```

### Why not the same enum value as RESTRICTED

1. **Art:** Amazonis RESTRICTED is intentionally an empty hole (`BoardSpaceTile` has no CSS class). Chasms need distinct placeholder / final art.
2. **Future bridge unlock must retarget chasms only**, without turning the Amazonis hole into placeable land.

### Bridge unlock (not built — design note)

`Space.spaceType` is already mutable. When a bridge megastructure completes:

1. Find target chasm spaces (by id / adjacency to the bridge).
2. Set `space.spaceType = SpaceType.LAND` (or another placeable type).
3. Existing availability helpers immediately treat them as tileable land — **no parallel “unlocked” flag required**.

**Assessment:** Easy. Distinct `CHASM` makes unlock a one-line type mutation and keeps Amazonis untouched. Sharing the `RESTRICTED` enum would have forced a separate unlock flag or board-specific exceptions.

## Rules implemented

| Type | Placement | Extra |
|------|-----------|-------|
| **Chasm** | Nothing | Same exclusion path as RESTRICTED |
| **Crater field** | Land-like | On first `grantPlacementBonuses`, set `space.craterBonusClaimed = true`. `TODO(consortium): grant 1 iridium` — Iridium resource does not exist yet |
| **Highland** | Land-like except oceans | Filtered out of ocean-on-land prompts; `addTile` throws if `TileType.OCEAN` |

Builder helpers (for the future Consortium board): `BoardBuilder.chasm()`, `.craterField()`, `.highland()`.

## Hex graphics convention (locked before creating files)

| Item | Convention |
|------|------------|
| Format | PNG |
| Dimensions | **46 × 50** |
| Directory | `/workspace/assets/` |
| Naming | `hex_<name>.png` |
| CSS | `.board-space-type-<kebab>` in `src/styles/board.less` |
| Vue | Cases in `BoardSpaceTile.vue` when `tileType` is undefined |

### Exact asset paths (do not rename)

1. `assets/hex_chasm.png`
2. `assets/hex_crater_field.png`
3. `assets/hex_highland.png`

CSS classes: `.board-space-type-chasm`, `.board-space-type-crater-field`, `.board-space-type-highland`.

Placeholders are coloured hexes with X / circle / triangle marks so they read distinctly until real art replaces them **by the same filenames**.

## Files changed

- `src/common/boards/SpaceType.ts`
- `src/server/boards/Space.ts`, `SerializedBoard.ts`, `BoardBuilder.ts`, `Board.ts`, `MarsBoard.ts`
- `src/server/Game.ts`
- `src/server/deferredActions/PlaceOceanTile.ts`
- `src/server/underworld/UnderworldExpansion.ts` (treat CHASM like RESTRICTED for identify/excavate)
- `src/client/components/board/BoardSpaceTile.vue`
- `src/styles/board.less`
- `assets/hex_{chasm,crater_field,highland}.png`
- `tests/consortium/ConsortiumTerrain.spec.ts`
- `.cursor/rules/consortium.mdc`
- `docs/consortium/03-terrain.md`

**Not touched:** Consortium board layout, frontier zone, Iridium resource, megastructures, cards / manifest.

## Empty manifest

`src/server/cards/consortium/ConsortiumCardManifest.ts` still has `projectCards: {}` only.

## Acceptance evidence

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Lint clean (incl. stylelint) | `npm run lint` passed |
| 2 | Tests ≥ 7056 / 439 | **Server 7061**, **client 439** |
| 3 | Codegen | Not required (no card / locale / JSON static changes) |
| 4 | Chasm placement rejected | `ConsortiumTerrain.spec.ts` — `canPlaceTile` false, not in available land, `addTile` throws |
| 5 | Highland: ocean rejected, other tiles OK | Spec — ocean throws; city + greenery place |
| 6 | Crater hook once | Spec — `craterBonusClaimed` set on first place; setter not invoked on second |
| 7 | Distinct renders | Temp Tharsis spaces 15/16/17 → screenshot (reverted); see artifacts |
| 8 | Empty consortium manifest | Confirmed |

## Final test numbers

- Server: **7061** (+5 terrain specs)
- Client: **439**
- Lint: clean
