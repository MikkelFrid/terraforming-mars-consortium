# Consortium — Phase 01: Empty module skeleton

Branch: `feat/consortium-module-skeleton`  
Date: 2026-07-25

## What changed

Registered a completely empty expansion module `consortium` (zero cards).
Naming follows Star Wars: module key `consortium`, flat flag
`consortiumExpansion`, manifest `CONSORTIUM_CARD_MANIFEST`.

### Server

- `src/common/cards/GameModule.ts` — `EXPANSIONS` / `MODULE_NAMES` / `DEFAULT_EXPANSIONS`
- `src/server/game/GameOptions.ts` — `consortiumExpansion` + `expansions.consortium`
- `src/server/cards/consortium/ConsortiumCardManifest.ts` — empty `projectCards: {}`
- `src/server/cards/AllManifests.ts`, `GameCards.ts`, `CardFactorySpec.ts`
- `src/server/Game.ts` — synthesize `expansions.consortium`; **`?? false` on deserialize**
  (and fill `expansions.consortium` if missing) so pre-Consortium saves still load
- `src/server/routes/ApiCreateGame.ts`, `models/ServerModel.ts`,
  `turmoil/globalEvents/GlobalEventDealer.ts`

### Client

- `CreateGameForm.vue` — lobby checkbox
- `json.ts` / `JSONProcessor.ts` — legacy key `consortiumExpansion`
- `GameSetupDetail.vue` — setup icon (div, no rulebook link required)
- `CardListModel.ts` — filter abbrev `'n'`
- `src/styles/cards.less` — `.consortium-icon` / `.expansion-icon-consortium`
- `assets/expansion_icons/expansion_icon_consortium.png` — iridium gem on dark disc (from `build_assets.py`)
- `src/client/utils/WikiLinks.ts` — `RULEBOOK_URLS.consortium` placeholder
  (required: type is `Record<GameModule, string>`)

### Tests / docs

- Fixture updates: `ApiCreateGame.spec.ts`, `ApiGame.spec.ts`,
  `JSONProcessor.spec.ts`, `PlayerTags.spec.ts`
- `tests/consortium/ConsortiumExpansionOption.spec.ts` — enable, round-trip,
  backward-compat missing fields, module-off
- This file

## Differs from the recon list

1. **`?? false` in `Game.deserialize`** — required by task +
   `.cursor/rules/consortium.mdc`. Star Wars does not do this for its flag;
   Consortium does.
2. **`WikiLinks.ts` was not optional** — `vue-tsc` fails without
   `RULEBOOK_URLS.consortium` because the type is `Record<GameModule, string>`.
   Recon listed HelpRulebooks/WikiLinks as optional chrome; WikiLinks is
   mandatory for typecheck. HelpRulebooks was still skipped (manual array).
3. **Manifest filename** — `ConsortiumCardManifest.ts` (Star Wars /
   recon naming). Task text said “ConsortiumManifest” casually.
4. **`PlayerTags.spec.ts` fixture** also gained a missing `deltaProject: false`
   so the expansions object is complete for the current `Expansion` set.
5. **GameSetupDetail** uses a plain `<div>` icon (no wiki `<a>`), since there
   is no real Consortium rulebook yet. Create form still has an info link to
   the placeholder wiki URL.

## Acceptance evidence

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Lint clean | `npm run lint` passed (server, i18n, client, css) |
| 2 | Tests ≥ baseline | **Server 7053** (was 7049, +4 new specs); **client 439** (unchanged) |
| 3 | Codegen | `npm run make:static` + `npm run make:cards` run; CSS includes `.expansion-icon-consortium` |
| 4 | Checkbox in create form | Browser: teal icon + “Consortium” between Star Wars and Underworld |
| 5 | Create with module on | Browser create succeeded; API `POST /api/creategame` with `expansions.consortium: true` → `GET /api/game` returns `expansions.consortium: true` |
| 6 | Round-trip | Unit: serialize → deserialize keeps `consortiumExpansion` / `expansions.consortium` true. API create+fetch also confirms persistence in the live game loader |
| 7 | Create with module off | Browser + API: game creates; `expansions.consortium: false` |
| 8 | Backward compatibility | Unit: delete `consortiumExpansion` and `expansions.consortium` from a serialized game → deserialize yields both `false` |

Note: “Great Escarpment Consortium” on the corp-select screen is a **base**
card name, not Consortium-module content. The empty module adds no cards;
option presence is verified via `gameOptions`, not card titles.

## Cleanup noted (not done)

- `HelpRulebooks.vue` does not list Consortium (manual array; optional).
- `GameCards.ts` still omits `deltaProject` (pre-existing; Delta is wired
  elsewhere). Not touched.
- Placeholder wiki URL `/wiki/Consortium` does not exist upstream.
- Placeholder icon should be replaced with a real asset later.
