# Consortium — Phase 02: Structure and Prospecting tags

Branch: `feat/consortium-tags`  
Date: 2026-07-25

## Template tag

**CRIME** — newest simple non-special tag. Touches Tag enum + `ALL_TAGS`,
`PlayedCards.NO_TAGS`, `cards.less` + PNG, PlayerTags `ORDER` +
`game.tags.includes` gating (not an expansion flag), CardListModel
abbreviations/hash defaults. No planetary-track coupling (unlike MARS).

Structure and Prospecting follow the same pattern. They are **not** gated on
`expansions.consortium`; they appear in the player panel when any deck card
carries them (`game.tags.includes`).

## What changed

| File | Change |
|------|--------|
| `src/common/cards/Tag.ts` | `STRUCTURE`, `PROSPECTING` in enum + `ALL_TAGS` |
| `src/server/cards/PlayedCards.ts` | `NO_TAGS` entries |
| `assets/tags/structure.png`, `prospecting.png` | Placeholder coloured circles |
| `src/styles/cards.less` | `.tag-structure`, `.tag-prospecting` |
| `src/client/components/overview/PlayerTags.vue` | ORDER + `game.tags` gating |
| `src/client/components/cardlist/CardListModel.ts` | abbrevs `i`/`j` + hash defaults |
| `src/client/components/help/HelpIconology.vue` | Fan-tag documentation |
| `tests/consortium/StructureAndProspectingTags.spec.ts` | Wild + requirement coverage |
| `tests/common/utils/utils.spec.ts` | Expected Tag enum lists |
| `.cursor/rules/consortium.mdc` | Baseline → 7056 / 439 |

CardRenderer already draws tags generically (`tag-${slug}`); no renderer enum
change was required.

## Branch note

Created off `main`, then fast-forwarded / merged `feat/consortium-module-skeleton`
so the empty consortium module and ≥7053 baseline are present. Tags themselves
do not depend on the module.

## Empty manifest (criterion 8)

Confirmed at end of branch:

- `src/server/cards/consortium/ConsortiumCardManifest.ts` has `projectCards: {}`
  and no corporation/prelude entries
- Directory contains only `ConsortiumCardManifest.ts`
- `src/genfiles/cards.json` has **zero** cards with `module: 'consortium'`
- Temporary smoke-test corp (`ConsortiumTagSmokeTest` /
  `CONSORTIUM_TAG_SMOKE_TEST`) was used only for screenshots, then removed
  before the final commits (never left on the branch tip)

## Distinct-tag audit (report only — no numbers changed)

Adding tags that appear in decks raises `tagsInGame()` and makes fixed
distinct-tag thresholds easier for players who take those tags.

| Consumer | Path | Threshold / effect | Expansion / board |
|----------|------|--------------------|-------------------|
| **Diversifier** milestone | `src/server/milestones/Diversifier.ts` | **≥ 8** distinct (`distinctCount('milestone')`) | Hellas board MA; also modular random pool (`Milestones.ts`) |
| **Diversity** global event | `src/server/turmoil/globalEvents/Diversity.ts` | **≥ 9** distinct + influence → 10 M€ (`distinctCount('globalEvent')`, no wilds) | Turmoil |
| **Interplanetary Trade** | `src/server/cards/promo/InterplanetaryTrade.ts` | +1 M€ production per distinct tag including this | Promo |
| **Aridor** corporation | `src/server/cards/colonies/Aridor.ts` | +1 M€ production per new non-wild, non-event tag type | Colonies |
| **Agricola Inc** (related) | `src/server/cards/community/AgricolaInc.ts` | VP buckets per tag type present in `game.tags` | Community — not distinct-count, but **scales with more tag types in the game** |

Not distinct-tag (listed to avoid confusion): Ecologist (sum of bio tags),
Biologist award, Faraday, Diversity Support (resource types).

## Acceptance evidence

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Lint clean (incl. stylelint) | `npm run lint` passed |
| 2 | Tests ≥ 7053 / 439 | **Server 7056**, **client 439** |
| 3 | Codegen | `make:static` + `make:cards` |
| 4 | Both icons on a card | Screenshot of temporary smoke corp at `/cards` (removed after) |
| 5 | Player panel counts | After selecting smoke corp: `structure: 1`, `prospecting: 1` (API + screenshot) |
| 6 | Wild counts as both | Unit test in `StructureAndProspectingTags.spec.ts` |
| 7 | Structure tag requirement | Unit test: needs 2 structures fails at 0/1, passes at 2; wild satisfies count 1 |
| 8 | Empty consortium manifest | Confirmed — see above |

## Cleanup noted (not done)

- HelpIconology still omits Crime (pre-existing gap)
- Real tag art should replace the placeholder circles
- Balance decision on Diversifier / Diversity / Aridor / Interplanetary Trade
  thresholds is left to the owner
