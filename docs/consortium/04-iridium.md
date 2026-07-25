# Consortium — Phase 04: Iridium

Branch: `cursor/consortium-iridium-9ea9`  
Date: 2026-07-25  
Base: `main` after art generator merge (`549cdd9ed`)

## Design (locked)

Iridium is a **standalone player field**, not a member of `Units` / `ALL_RESOURCES` /
`Resource`. Putting it in Units would silently change Robinson, Ryu, Collector,
Merchant, Generalist, and surface a production row — unbounded correctness risk.

| Aspect | Rule |
|--------|------|
| Storage | `player.iridium` (plain number) |
| Production | **None** — no production slot |
| Bank | Shared `game.iridiumBank`, starts **full** at `IRIDIUM_BANK_CAPACITY` (28) when Consortium is on |
| Conservation | Total iridium in the system is conserved: bank ↔ players only. Nothing enters or leaves |
| Spend → bank | **One place:** `Iridium.spend` (easy to invert later) |
| MC value | `IRIDIUM_VALUE = 4` (steel 2, titanium 3) |
| Spendable on | Structure tag, Prospecting tag, megastructure segments (future), Core Sampling — **not** universal |
| End of game | Held iridium = **0 VP**. Currency, not score |
| Excluded | Alloy protection, Sol Bank, every steel/titanium-specific path |

Balance knobs (named constants in `src/common/constants.ts`):

- `IRIDIUM_BANK_CAPACITY = 28`
- `IRIDIUM_VALUE = 4`
- `CORE_SAMPLING_COST = 6`

## Sources and sinks

| Direction | Mechanism |
|-----------|-----------|
| Bank → player | Crater field placement grant (1, once per space); Core Sampling standard project |
| Player → bank | Paying with iridium (`Player.pay` → `Iridium.spend`) |

Empty bank: crater grant marks `craterBonusClaimed` but grants 0; Core Sampling `canAct` is false.

## Core Sampling

Standard project (`CardName.CORE_SAMPLING_STANDARD_PROJECT`), registered under
`ConsortiumCardManifest.standardProjects` only. **`projectCards` stays `{}`.**

Pay `CORE_SAMPLING_COST` M€ → gain 1 iridium if the bank has any.

## Requirement

Descriptor key `iridium?: number` → `IridiumRequirement` / `RequirementType.IRIDIUM`.

## Logging

Gains and spends use the same pattern as corruption:

- `${0} gained ${1} iridium`
- `${0} spent ${1} iridium`

## UI notes

- Player panel shows stock only (no production, **no M€ value badge**).
- Sitting next to steel/titanium may still imply universal spendability; payment
  dialog is the real gate. **No new clarifying UI in this phase.**
- Payment dialog offers iridium only for Structure / Prospecting cards.

## Art

`assets/resources/iridium.png` (331×331) from
`tools/consortium-art/build_assets.py` → `build_iridium`. Do not hand-draw.

## Follow-ups (debt, accepted)

1. **Card-render item for iridium** — no `CardRenderItemType.IRIDIUM` /
   `CardRenderer.iridium()` / `.card-resource-iridium` CSS yet. Cards cannot
   display an iridium cost or requirement icon. Needed for Siderophile Extraction
   and megastructure cards.
2. **`SelectPaymentDeferred` `canUseIridium`** — for megastructure segment pays.
3. Panel copy / tooltip clarifying tag-gated spendability (if playtests confuse).

## Files touched

See the approved revised list (~30). Manifest: `projectCards: {}` unchanged
except registration of the Core Sampling standard project.
