# Consortium — Phase 06: Megastructures

Branch: `feat/consortium-megastructures`  
Date: 2026-07-25  
Base: `main` after board merge (`8eefea725`)

## Design

Five structures per game:

| Slot | Source |
|------|--------|
| 3× Bridge | Always present — one per board sector (0, 1, 2) |
| 2× Grand | Drawn at random from Space Elevator, L1 Magnetic Shield, Mohole, Solar Mirror, Arcology |

Players contribute **one segment per standard action**. Segments accept M€, steel,
titanium and iridium. The last segment is the **keystone** and always requires a
minimum iridium spend (hard gate — cannot be paid without it).

Completion order:

1. Each contributor scores VP per segment they paid for
2. Keystone player scores an additional bonus
3. Stub `onComplete` fires (global + per-contributor) — logs only until phase 6c

Incomplete structures at game end score **nothing** (sunk cost).

Foundation: Space Elevator, Mohole and Solar Mirror require the contributing
player to own a tile on a highland space before their **first** segment on that
structure. Bridges, L1 Shield and Arcology have no foundation gate.

## Balance knobs

All live in `src/common/consortium/MegastructureConstants.ts` as
`MEGASTRUCTURE_BALANCE`:

| Knob | Default | Meaning |
|------|---------|---------|
| `BRIDGES_PER_GAME` | 3 | Bridges always in play |
| `GRAND_STRUCTURES_PER_GAME` | 2 | Grand structures drawn per game |
| `BRIDGE_SEGMENT_COUNT` | 4 | Segments on a Bridge |
| `BRIDGE_SEGMENT_COST_MC` | 12 | Cost of Bridge segments 1–3 |
| `BRIDGE_KEYSTONE_COST_MC` | 8 | Cost of Bridge keystone |
| `BRIDGE_KEYSTONE_MIN_IRIDIUM` | 2 | Min iridium on Bridge keystone |
| `GRAND_SEGMENT_COUNT` | 6 | Segments on a grand structure |
| `GRAND_SEGMENT_COST_MC` | 16 | Cost of grand segments 1–5 |
| `GRAND_KEYSTONE_COST_MC` | 12 | Cost of grand keystone |
| `GRAND_KEYSTONE_MIN_IRIDIUM` | 3 | Min iridium on grand keystone |
| `VP_PER_SEGMENT` | 1 | VP per owned segment on completion |
| `VP_KEYSTONE_BONUS` | 2 | Extra VP for keystone player |

Iridium M€ value remains `IRIDIUM_VALUE` in `src/common/constants.ts` (currently 4).

## Code map

| Concern | Path |
|---------|------|
| Balance knobs | `src/common/consortium/MegastructureConstants.ts` |
| Kinds / ids / foundation set | `src/common/consortium/MegastructureKind.ts` |
| State, contribute, complete, VP, serialize | `src/server/consortium/Megastructures.ts` |
| Stub onComplete effects | `src/server/consortium/MegastructureEffects.ts` |
| Serialized shape | `src/server/consortium/SerializedMegastructuresData.ts` |
| Game field | `game.megastructuresData` (`IGame` / `Game` / `SerializedGame`) |
| Action menu | `Player.getActions` → `Megastructures.contributeAction` |
| Payment iridium flag | `SelectPaymentDeferred` `canUseIridium` |
| VP fold-in | `calculateVictoryPoints` → `Megastructures.calculateVictoryPoints` |

## Out of scope (this phase)

- UI
- Real onComplete effects (`TODO(consortium): phase 6c`)
- Frontier unlock from completed bridges
- Cards (manifest `projectCards` stays `{}`)

## Backward compatibility

`SerializedGame.megastructuresData` is optional. Saves without it deserialize to
`undefined` and remain playable.
