# Consortium — Phase 08: Megastructure completion effects

Branch: `feat/consortium-megastructure-effects`  
Date: 2026-07-26  
Base: `main` after megastructure UI merge (`9f2f918fc`)

## UI fix

Next-segment cost always shows the full ask. When the next cell is the
keystone: `Next: 8 M€ + min 2 iridium (keystone)`. The keystone cell itself
always shows its iridium gate (`N Ir`) even when it is not yet the next
segment.

## Bridge unlock

On bridge completion for sector N:

1. Frontier spaces with `locked === true` and `bridge === N` clear `locked`
2. Chasm spaces with `sector === N` become `SpaceType.LAND`
3. Other sectors are untouched

`isFrontierUnlocked` is now simply `space.locked !== true`.
`Game.addTile` still rejects `locked === true`.

Chasm/frontier `sector` is stored on `Space` and survives serialization, so a
save after one bridge completes reloads with exactly that sector open.

## Completion effects (first-pass playtest)

All numbers live in `MEGASTRUCTURE_BALANCE` and are marked balance knobs.

| Structure | Global | Contributor |
|-----------|--------|-------------|
| Bridge | Opens its sector | +`BRIDGE_MC_PRODUCTION_PER_SEGMENT` M€ prod / segment |
| Space Elevator | −`SPACE_ELEVATOR_SPACE_TAG_DISCOUNT` M€ on space tags (all) | Titanium prod: max(1, floor(segs / `SPACE_ELEVATOR_TITANIUM_PROD_PER_SEGMENTS`)) |
| L1 Magnetic Shield | −`L1_SHIELD_GREENERY_DISCOUNT` plants for greenery (all) | Plant prod: max(1, floor(segs / `L1_SHIELD_PLANT_PROD_PER_SEGMENTS`)) |
| Mohole | +`MOHOLE_GLOBAL_HEAT_PRODUCTION` heat prod (all) | +`MOHOLE_IRIDIUM_PER_SEGMENT` iridium / seg now; +`MOHOLE_GENERATION_IRIDIUM` each generation (1/player, bank-gated) |
| Solar Mirror | Temperature +`SOLAR_MIRROR_TEMPERATURE_STEPS` | Heat prod: max(1, floor(segs / `SOLAR_MIRROR_HEAT_PROD_PER_SEGMENTS`)) |
| Arcology | +`ARCOLOGY_GLOBAL_MC_PRODUCTION` M€ prod (all) | +`ARCOLOGY_EXTRA_VP_PER_SEGMENT` VP / seg at end (stacks with base `VP_PER_SEGMENT`) |

## New balance knobs

| Knob | Default |
|------|--------:|
| `BRIDGE_MC_PRODUCTION_PER_SEGMENT` | 1 |
| `SPACE_ELEVATOR_SPACE_TAG_DISCOUNT` | 2 |
| `SPACE_ELEVATOR_TITANIUM_PROD_PER_SEGMENTS` | 2 |
| `L1_SHIELD_GREENERY_DISCOUNT` | 1 |
| `L1_SHIELD_PLANT_PROD_PER_SEGMENTS` | 2 |
| `MOHOLE_GLOBAL_HEAT_PRODUCTION` | 1 |
| `MOHOLE_IRIDIUM_PER_SEGMENT` | 1 |
| `MOHOLE_GENERATION_IRIDIUM` | 1 |
| `SOLAR_MIRROR_TEMPERATURE_STEPS` | 1 |
| `SOLAR_MIRROR_HEAT_PROD_PER_SEGMENTS` | 2 |
| `ARCOLOGY_GLOBAL_MC_PRODUCTION` | 1 |
| `ARCOLOGY_EXTRA_VP_PER_SEGMENT` | 1 |

## Hooks

| Effect | Where |
|--------|--------|
| Space Elevator discount | `Player.getCardCost` → `spaceElevatorDiscountFor` |
| Mohole generation iridium | `Game.startGeneration` → `Megastructures.grantMoholeGenerationIridium` |
| Arcology extra VP | `Megastructures.calculateVictoryPoints` |
| Bridge unlock | `unlockBridgeSector` from `MegastructureEffects.bridge.global` |

## Invariants

- `CONSORTIUM_CARD_MANIFEST.projectCards` stays `{}`
- Tharsis board unchanged (no sector/locked fields; unlock is a no-op there)
