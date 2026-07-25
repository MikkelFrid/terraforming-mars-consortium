# Consortium Expansion — Reconnaissance Report

Investigation against the current tree at `09fdb63de` (fork `main` tip).
Wiki pages are treated as a list of concerns only; all paths below are from the live repo.

---

## 0. Fork hygiene

### Remotes

```
origin  https://github.com/mikkelfrid/terraforming-mars-consortium
```

**`upstream` is not configured.** There is no remote pointing at
`terraforming-mars/terraforming-mars`.

### Ahead / behind

| Ref | Commit |
|-----|--------|
| `origin/main` | `09fdb63de0ca2b8569f9c8ca96780eac5945d8f4` |
| `terraforming-mars/terraforming-mars` `main` (via `git ls-remote`) | `09fdb63de0ca2b8569f9c8ca96780eac5945d8f4` |

**In sync:** fork `main` is 0 commits ahead and 0 commits behind upstream `main`
at the time of this report.

### Commands to add upstream

```bash
git remote add upstream https://github.com/terraforming-mars/terraforming-mars.git
git fetch upstream
git rev-list --left-right --count upstream/main...origin/main
# left = commits on upstream not in origin; right = commits on origin not in upstream
```

Thereafter: `git fetch upstream` then merge or rebase `upstream/main` into your
working branch as needed.

---

## 1. Build pipeline and codegen

### Scripts and outputs

| npm script | Entrypoint | Artifacts written |
|------------|------------|-------------------|
| `make:cards` | `src/server/tools/export_card_rendering.ts` | `src/genfiles/cards.json`, `events.json`, `colonies.json`, `milestones.json`, `awards.json` |
| `make:json` | `src/tools/make_static_json.ts` | `src/genfiles/settings.json`, `src/genfiles/translations.json`, `assets/locales/<lang>.json` |
| `make:css` | `lessc src/styles/common.less` + `src/server/tools/gzip.js` | `build/styles.css`, `.gz`, `.br` |
| `make:static` | `make:css` then `make:json` | CSS + settings/translations/locales |
| `watch:cards` | `scripts/watchcards.ts` | Re-runs `make:cards` on `src/server/cards/**/*.ts` |
| `watch:less` | `scripts/watchcss.ts` | Re-runs `make:css` on Less changes |
| `build:client` | `make:cards` then webpack | Genfiles + `build/main.js`, `vendors.js`, chunks |
| `build:server` | `tsc` + `tsc-alias` | `build/src/**` (copies genfiles via `resolveJsonModule`) |
| `build` | `make:static` → `build:server` → `build:client` | Full pipeline |
| `dev` | `scripts/dev.sh` | Parallel: `dev:server`, `dev:client`, `watch:less`, `watch:cards` — **no** `make:json` watcher |

`make:cards` walks `ALL_MODULE_MANIFESTS` and writes client-facing card/event/colony/MA JSON
(`export_card_rendering.ts` ~L201–216).

### Gitignored generated artifacts

From [`.gitignore`](.gitignore):

- `build/`
- `src/genfiles/`
- `assets/locales`

Hand-authored sources that are **not** generated: `src/locales/<lang>/*.json`,
`src/styles/**/*.less`, `assets/tags/*.png`, card classes, manifests.

### Client imports of genfiles

Webpack/client imports `@/genfiles/*.json` directly, e.g.:

- `src/client/cards/ClientCardManifest.ts` → `cards.json`
- `src/client/turmoil/ClientGlobalEventManifest.ts` → `events.json`
- `src/client/colonies/ClientColonyManifest.ts` → `colonies.json`
- `src/client/MilestoneAwardManifest.ts` → `milestones.json`, `awards.json`
- Several Vue components → `settings.json`
- `src/server/server.ts` → `../genfiles/settings.json`

Locales are **fetched** at runtime (`assets/locales/${lang}.json`), not webpack-bundled.
`build/styles.css` is served by the Node server, not webpack.

### What to rerun after changes

| Change | Must regenerate | Notes |
|--------|-----------------|-------|
| New card (class + CardName + manifest) | `npm run make:cards` | Or rely on `watch:cards` / `npm run dev` / `build:client`. Server unit tests of card logic do not need genfiles; client tests and webpack do. |
| New tag | Hand-edit `Tag.ts`, CSS, PNG, UI ORDER lists; then `make:css` + `make:cards` | No tag-specific codegen. Cards carrying the tag re-export into `cards.json`. |
| New module | Hand-edit GameModule / GameOptions / manifest / UI; then `make:cards` | Also `make:css` if new styles/icons; `make:json` if new locale strings. |
| New locale strings under `src/locales/` | `npm run make:json` | **Not** watched by `npm run dev`. |

Practical full refresh: `npm run make:static && npm run make:cards`.

`watch:cards` only watches `src/server/cards` and does **not** auto-rebuild for
global-event / colony / MA changes outside that tree (see comment in
`scripts/watchcards.ts`).

---

## 2. Layout

### Three layers

| Layer | Path | Role |
|-------|------|------|
| Common | `src/common/` | Shared types, enums, DTOs. No client/server runtime deps. |
| Server | `src/server/` | Game engine, cards, boards, routes, DB. |
| Client | `src/client/` | Vue 3 SPA (Options API), Webpack-bundled. |

`@/` import alias → `./src/` (tsconfig + webpack).

Notable common subdirs: `cards/`, `models/`, `boards/`, `game/`, `inputs`/`input/`,
`colonies/`, `turmoil/`, `moon/`, `pathfinders/`, `ares/`, `underworld/`, `ma/`,
plus `Resource.ts`, `Units.ts`, `TileType.ts`, `constants.ts`.

Notable server subdirs: `cards/<module>/`, `behavior/`, `deferredActions/`,
`inputs/`, `database/`, `routes/`, `boards/`, `awards/`, `milestones/`, plus
expansion folders (`ares/`, `colonies/`, `moon/`, …).

Notable client subdirs: `components/` (screens, inputs, `card/`, boards,
expansions), `directives/`, `mixins/`, `plugins/`.

Styles: `src/styles/` (Less). Locales (hand-authored): `src/locales/`.
Tests mirror under `tests/`.

### Scoped test commands

Full suites: `npm run test`, `npm run test:server`, `npm run test:client`,
`npm run test:integration`.

**One server card test:**

```bash
npx mocha --import=tsx --require tests/testing/setup.ts "tests/cards/base/Algae.spec.ts"
```

**One server directory:**

```bash
npx mocha --import=tsx --require tests/testing/setup.ts "tests/cards/starwars/**/*.spec.ts"
```

**One client test:**

```bash
cross-env NODE_ENV=development mochapack --require tests/client/components/setup.ts "tests/client/components/Board.spec.ts"
```

Keep the same `--import=tsx` / `--require` (server) or `mochapack` + client setup
flags as the npm scripts.

---

## 3. Conventions (CLAUDE.md + CONTRIBUTING.md)

### Architecture / cards

- Prefer declarative `behavior` / `action` on `Card` over imperative `play()` overrides.
- Card wiring: class under `src/server/cards/<module>/` → `CardName` enum →
  `<Module>CardManifest.ts` → `AllManifests.ts`.
- Cross-expansion deps via `compatibility` on `CardFactorySpec`.
- Render with `CardRenderer.builder()` in `metadata.renderData`.
- Tests: `testGame()` + `TestPlayer`, Mocha + Chai `expect`.

### Process (CONTRIBUTING)

- Discuss substantial work (e.g. a new expansion) with owners before a large PR
  (issue / Discord / email).
- Prefer many small PRs; one issue per PR when practical.
- PRs must be human-owned and understood by the submitter; AI-only agent PRs are
  closed per project policy.
- Non-trivial behavior needs tests; “how do you know this is correct?” is the bar.
- Style: match neighboring files; keep code readable.
- i18n: exact-string matching via `v-i18n`; translations are a separate process.

---

## 4. Template module: `starwars`

**Recommendation: use Star Wars as the template for a cards-only expansion shell.**

| Candidate | Why not (or why yes) |
|-----------|----------------------|
| **starwars** | **Best.** 9 project cards; no `src/server/starwars/` rules engine; no `src/client/components/starwars/`; standard ModuleManifest → GameCards path; create-game checkbox + icon only. |
| community | Small card count but pulls in community colonies + a global event — more registration surface. |
| promo | Same “cards-only” pattern, but ~95 cards — bad as a minimal copy template. |
| ceo | Introduces a whole card category, draft UI, filters. |
| deltaProject | Fewest cards, but custom track board, custom `PlayerInput`, α WIP — worst complexity-per-card. |

Caveats when copying Star Wars: three cards use `compatibility` (`colonies` /
`turmoil` / `venus`); `CloneTroopers` uses `CardResource.CLONE_TROOPER`;
`ReySkywalker` places `TileType.REY_SKYWALKER`. Those are optional extras, not
required for the empty-module pattern.

---

## 5. Star Wars end-to-end file list

### Dual naming (easy to get wrong)

| Layer | Property |
|-------|----------|
| `GameModule` / `expansions` map key | `'starwars'` (lowercase, one word) |
| Flat `GameOptions` flag | `starWarsExpansion` (camelCase, capital **W**) |
| Legacy JSON import key | `'starWarsExpansion'` via `STARWARSEXPANSION` in `json.ts` |
| Manifest export | `STAR_WARS_CARD_MANIFEST` |
| CSS | `.starwars-icon`, `.expansion-icon-starwars` |

There is **no** `gameOptions.starWars`.

### Ordered registration flow

1. **`src/common/cards/GameModule.ts`** — `'starwars'` in `EXPANSIONS` / `GAME_MODULES`; `MODULE_NAMES.starwars = 'Star Wars'`; `DEFAULT_EXPANSIONS.starwars = false`.
2. **`src/common/cards/CardName.ts`** — enum entries for the 9 cards.
3. **`src/common/game/NewGameConfig.ts`** — client→server payload; `expansions: Record<Expansion, boolean>`.
4. **`src/common/models/GameOptionsModel.ts`** — client options model exposes `expansions` (no flat `starWarsExpansion`).
5. **`src/server/game/GameOptions.ts`** — `starWarsExpansion: boolean` + `expansions.starwars` in `DEFAULT_GAME_OPTIONS`.
6. **`src/server/cards/starwars/StarwarsCardManifest.ts`** — `module: 'starwars'`, 9 project cards.
7. **`src/server/cards/AllManifests.ts`** — registers `STAR_WARS_CARD_MANIFEST`.
8. **`src/server/GameCards.ts`** — includes deck iff `[gameOptions.starWarsExpansion, STAR_WARS_CARD_MANIFEST]` (~L62).
9. **`src/server/cards/CardFactorySpec.ts`** — `case 'starwars': return gameOptions.starWarsExpansion` (~L46–47).
10. **`src/server/Game.ts`** — when synthesizing `expansions` from legacy flags: `starwars: partialOptions.starWarsExpansion ?? false` (~L274); merges `{...DEFAULT_GAME_OPTIONS, ...partialOptions}` (~L279).
11. **`src/server/routes/ApiCreateGame.ts`** — `starWarsExpansion: gameReq.expansions.starwars` (~L173).
12. **`src/server/models/ServerModel.ts`** — `expansions.starwars: options.starWarsExpansion` (~L433).
13. **`src/server/turmoil/globalEvents/GlobalEventDealer.ts`** — `starwars: gameOptions.starWarsExpansion` (~L73).
14. **`src/server/tools/export_card_rendering.ts`** — exports cards with `module: 'starwars'` via manifests.
15. **`src/client/components/create/defaultCreateGameModel.ts`** — seeds form from `DEFAULT_EXPANSIONS`.
16. **`src/client/components/create/CreateGameForm.vue`** — checkbox `v-model="expansions.starwars"` (~L161–164); POSTs `NewGameConfig`.
17. **`src/client/components/create/json.ts`** + **`JSONProcessor.ts`** — legacy import maps `starWarsExpansion` → `expansions.starwars`.
18. **`src/client/components/GameSetupDetail.vue`** — shows icon when `gameOptions.expansions.starwars`.
19. **`src/client/components/cardlist/CardListModel.ts`** — filter hash abbrev `starwars: 'w'`.
20. **`src/client/components/card/CardExpansion.vue`** — renders `starwars-icon` from `card.module`.
21. **`src/styles/cards.less`** — `.starwars-icon` / `.expansion-icon-starwars`.
22. **`assets/expansion_icons/expansion_icon_starwars.png`** — expansion icon asset.
23. **`src/client/utils/WikiLinks.ts`**, **`HelpRulebooks.vue`** — help / wiki chrome.
24. **Locales** — `src/locales/*/ui.json` (or `UI.json`) for `"Star Wars"`; `src/locales/*/starwars_cards.json` for card text.
25. **Tests** — `tests/cards/starwars/*.spec.ts`; fixtures in `tests/routes/ApiCreateGame.spec.ts`, `ApiGame.spec.ts`, `JSONProcessor.spec.ts`, etc. that enumerate all expansions.

Card implementations live under `src/server/cards/starwars/*.ts` (manifest + 9 cards).
Card-specific extras (not required for empty module): `TileType.REY_SKYWALKER`,
`CardResource.CLONE_TROOPER`, board/render CSS for those.

**Flow summary:** UI toggles `expansions.starwars` → POST → `ApiCreateGame` sets both
`expansions` and `starWarsExpansion` → `GameCards` / `CardFactorySpec` gate on
`starWarsExpansion` → `ServerModel` exposes back as `expansions.starwars`.

---

## 6. Card pipeline

### How pieces fit

1. **`CardName` enum** (`src/common/cards/CardName.ts`) — every card needs a unique
   string value. TypeScript does **not** catch duplicate string values.
2. **Card class** extends `Card` (or implements `IProjectCard` etc.), sets
   `type`, `name`, `tags`, `cost`, optional `behavior` / `action`, and
   `metadata.renderData` via `CardRenderer.builder()`.
3. **Module manifest** maps `CardName` → `{Factory, compatibility?}` in a
   `ModuleManifest` with `module: GameModule`.
4. **`AllManifests.ts`** aggregates manifests; `GameCards` includes the deck when
   the expansion flag is on; `export_card_rendering.ts` serializes metadata for
   the client into `cards.json`.
5. **Client** loads `cards.json` via `ClientCardManifest` and renders with shared
   card components (`CardRenderItemComponent`, etc.).

Prefer declarative `behavior` when possible; override `bespokePlay` /
`bespokeCanPlay` for imperative effects (as Trade Embargo does below).

### Representative card (full file)

`src/server/cards/starwars/TradeEmbargo.ts`:

```typescript
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {IPlayer} from '../../IPlayer';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';

export class TradeEmbargo extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.TRADE_EMBARGO,
      tags: [Tag.SPACE],
      cost: 4,

      metadata: {
        cardNumber: 'SW01',
        renderData: CardRenderer.builder((b) => {
          b.text('Nobody may trade for the rest of this generation.', {size: Size.LARGE});
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    player.game.tradeEmbargo = true;
    return undefined;
  }
}
```

Registered in `StarwarsCardManifest.ts` as:

```typescript
[CardName.TRADE_EMBARGO]: {Factory: TradeEmbargo, compatibility: 'colonies'},
```

---

## 7. Board system

### How Tharsis / Hellas / Elysium are defined

- Board names: `src/common/boards/BoardName.ts` (`THARSIS`, `HELLAS`, `ELYSIUM`, …).
- Factory: `src/server/GameSetup.ts` maps `BoardName` → board class.
- Layouts are **inline** in each board class via `BoardBuilder` row-by-row API —
  not external JSON:
  - `src/server/boards/TharsisBoard.ts`
  - `src/server/boards/HellasBoard.ts`
  - `src/server/boards/ElysiumBoard.ts`
- Builder methods: `land()`, `ocean()`, `volcanic()`, `restricted()`, `cove()`,
  `deflectionZone()` in `src/server/boards/BoardBuilder.ts`.

### Data structures

**`SpaceType`** (`src/common/boards/SpaceType.ts`):

```typescript
export enum SpaceType {
    LAND = 'land',
    OCEAN = 'ocean',
    COLONY = 'colony',
    LUNAR_MINE = 'lunar_mine',
    COVE = 'cove',
    RESTRICTED = 'restricted', // Amazonis Planitia
    DEFLECTION_ZONE = 'deflection', // Hollandia
}
```

**Server `Space`** (`src/server/boards/Space.ts`): `id`, `x`, `y`, `spaceType`,
optional `tile`, `player`, `bonus`, `volcanic`, adjacency / underworld fields, etc.

**Server `Board`** (`src/server/boards/Board.ts`): holds `spaces`, adjacency map,
`volcanicSpaceIds`. Client receives `SpaceModel[]` (`src/common/models/SpaceModel.ts`);
there is no separate common `Board` type.

### Placement validation

Entry: `MarsBoard.getAvailableSpacesForType` → dispatches to land / ocean /
greenery / city helpers.

Critical filters:

- `Board.getAvailableSpacesOnLand` (~L224–248) — selects **only**
  `SpaceType.LAND`, empty or coverable Ares hazard, not Noctis-reserved, affordable.
- `Board.canPlaceTile` (~L275–277) — requires `tile === undefined && spaceType === LAND`.

Cities / greenery / specials go through land spaces; oceans through `OCEAN`
(plus `COVE` on some boards). Deferred actions and `behavior` placement use the
same APIs.

### Can anything block *all* placement?

**Yes — `SpaceType.RESTRICTED` is a first-class “nothing may be placed” space.**

- Defined in `SpaceType.ts` (comment: Amazonis Planitia).
- Created via `BoardBuilder.restricted()` (`BoardBuilder.ts` ~L67–71).
- Used on Amazonis center hex (`AmazonisBoard.ts` ~L28).
- Placement APIs never select it (they filter `LAND` / `OCEAN` only).
- Also excluded from Underworld identify/excavate
  (`UnderworldExpansion.ts` checks `SpaceType.RESTRICTED`).
- UI: empty RESTRICTED spaces get no land/ocean CSS class (`BoardSpaceTile.vue`).

This is **not** modeled as a tile or a “blocked land that only allows X.” Other
space types (`LAND`, `OCEAN`, `COVE`, `DEFLECTION_ZONE`) only restrict *which*
tile / rules apply. Ares hazards are coverable; Noctis is still `LAND` but
reserved for a specific card.

**For Consortium chasms:** `RESTRICTED` is the existing primitive to reuse or
extend. Uncertain whether a dedicated new space type is desirable for clarity /
board-specific rules — but “no placement at all” already exists.

**Caveat / uncertain:** Whether crater fields (iridium yield) and highlands
(structure foundations) should be new `SpaceType` values, new `SpaceBonus`
values, or tile overlays is not decided by existing code. Closest patterns:
`SpaceBonus` for resource yields on land; custom placement filters (volcanic,
isolated) for foundation-like restrictions.

---

## 8. Resource system (highest risk)

There is **no** `PAYMENT_RESOURCES` list. Payment taxonomy lives in
`src/common/inputs/Spendable.ts`; stock/production live on the separate
6-field `Units` / `Resource` / `ALL_RESOURCES` axis.

### Architecture

| Concept | What it is | Key files |
|---------|------------|-----------|
| Standard resources | MC, steel, titanium, plants, energy, heat — stock **and** production | `Resource.ts`, `Units.ts`, `Stock`/`Production` |
| Spendable / payment | Things that can pay M€ cost | `Spendable.ts` → `Payment.ts` |
| Alloys | Steel + titanium only (protection, theft, awards) | Named checks throughout |
| Tag-gated payment | Steel ↔ `Tag.BUILDING`, titanium ↔ `Tag.SPACE` | `Player.paymentOptionsForCard` |

Closest payment list (`Spendable.ts` L6–17):

```typescript
export const SPENDABLE_STANDARD_RESOURCES = [
  'megacredits',
  'heat',       // Helion
  'steel',      // building tags
  'titanium',   // space tags / LTF
  'plants',     // Martian Lumber + building
] as const;
```

Energy is a standard resource but **never** spendable as payment. Graphene /
seeds / etc. are spendable **card** resources, not `Units` fields.

### Exhaustive checklist for a 4th payment alloy like iridium

#### A. Core types (must if full standard resource)

1. `src/common/Resource.ts` — enum, `ALL_RESOURCES`, `StandardResource`
2. `src/common/Units.ts` — type fields, `EMPTY`, `keys`, `of`, `every`, `negative`, `isEmpty` (**hard-coded field lists**)
3. `src/common/inputs/Spendable.ts` — if spendable
4. `src/common/inputs/Payment.ts` — `Payment` type, `EMPTY`, `of`, `DEFAULT_PAYMENT_VALUES`
5. `src/common/constants.ts` — default exchange value if alloy-like
6. `src/common/cards/Types.ts` — `StandardProjectCanPayWith` if std projects
7. `src/common/cards/render/CardRenderItemType.ts`
8. `src/common/models/PlayerModel.ts`
9. `src/common/models/PlayerInputModel.ts`
10. `src/common/boards/SpaceBonus.ts` — only if boards grant iridium (**numeric enum — append only, do not reorder**)

#### B. Server player / economy

11. `src/server/player/StockBase.ts`, `Stock.ts`, `Production.ts`
12. `src/server/Player.ts` — getters, values, **hard-coded** `finishProductionPhase` (~L615–621), `paymentOptionsForCard` (~L731–746), `pay`, serialize/deserialize, alloy protection
13. `src/server/IPlayer.ts`
14. `src/server/SerializedPlayer.ts`
15. `src/server/models/ServerModel.ts` — client model + protection maps
16. `SelectPayment.ts`, `SelectPaymentDeferred.ts` — parallel `canUseSteel` / `canUseTitanium` boolean API
17. `SelectCardToPlay.ts`, `SelectStandardProjectToPlay.ts`
18. `GainResources.ts`, `SelectResource.ts`, `SelectResources.ts` (+ client Vue twins)
19. `src/server/behavior/Executor.ts` — named `spend.steel` / `spend.titanium`; value hooks
20. `src/server/behavior/Behavior.ts` — `Spend` extends `Units`

#### C. Payment UX (must if spendable)

21. `SelectPayment.vue`, `SelectProjectCardToPlay.vue` — **duplicates** tag rules from server; `canUse` switch with `default: throw`
22. `PaymentWidgetMixin.ts`, `PaymentDefaults.ts`, `PaymentLedger.ts`, `PaymentForm.vue`, `PaymentUnit.vue`
23. `PlayerResources.vue` / `PlayerResource.vue` — **hard-coded six columns**; value badge for steel/titanium/heat

#### D. Renderer / CSS / assets

24. `CardRenderer.ts`, `CardRenderItemComponent.vue`
25. `src/styles/resources.less` (`@resource_types`), `cards.less`, `cards_v2.less`
26. `assets/resources/iridium.png` (new)
27. Locales (`log_messages.json`, `ui.json`, …)

#### E. Named steel/titanium paths (will NOT auto-pick up a new Units key)

28. Alloy protection / steal / remove (Sabotage, HiredRaiders, etc.)
29. Awards/milestones: Miner, Blacksmith, Smith, Metallurgist; **Generalist** (hard-coded 6 productions); **Merchant** (`Units.every(2)` — **auto-grows** if Units gains a key, making claim harder)
30. Mining cards / `SpaceBonus` STEEL|TITANIUM / `Game.grantSpaceBonus`
31. Sol Bank trigger: hard-coded MC/steel/titanium triple (`Player.ts` ~L828–830)
32. PriceWars / AdvancedAlloys / RegoPlastics / LunarSteel / PhoboLog / Unity / MarsFirst (value modifiers)
33. Colony titanium trade; LastResortIngenuity; UtopiaInvest; MarketCard
34. Moon `reserveUnits: {steel/titanium}` cards
35. Underworld excavation tokens mapping to steel/titanium

#### F. Iteration patterns

| Generic (often auto-extends) | Named (must edit) |
|------------------------------|-------------------|
| `Units.keys` / `Units.values` | `StockBase.adjust` / `override` / `has` |
| `ALL_RESOURCES` loops | `Units.of` / `every` / `negative` / `isEmpty` |
| `SPENDABLE_RESOURCES` | `finishProductionPhase`, serialize fields |
| | Sol Bank / FocusedOrganization metal triples |
| | Alloy protection (steel **or** titanium only) |
| | Client `canUse` switches |

### Risk framing (findings only — not a decision)

| Approach | Scope | Risk |
|----------|-------|------|
| **A. Full standard resource + payment alloy** (like steel) | Everything above | Highest — Units is foundational; Merchant/Generalist semantics change; saves; UI density |
| **B. Spendable-only** (like graphene) without Units | Spendable + Payment + UI + corp that holds it | Medium — no production/stock/Merchant impact |
| **C. Stock-only standard resource, not spendable** | Resource/Units/Stock/UI/serialization | High for Units plumbing, lower for payment |

**Pessimistic notes:**

- Server + client tag payment rules are **duplicated**; both must stay in sync.
- Production can exist for a resource with no natural production cards
  (Robinson Industries / SelectResource), but production phase / serialization /
  UI silently drop fields that are missing from hard-coded lists.
- Old saved games store flat player JSON; missing new fields need defaults on
  deserialize (optional typing + `??`, same pattern as other player fields).
- Design intent (“hard supply cap, essentially no production”) may favor a
  non-Units approach — but that is a design choice, not something the codebase
  already models for alloys.

---

## 9. Tag system

### Flow: enum → icon → counter

1. **Enum + list:** `src/common/cards/Tag.ts` — `Tag` enum + `ALL_TAGS`.
   String values are the CSS/asset slug (`building`, `space`, …).
   Current tags: building, space, science, power, earth, jovian, venus, plant,
   microbe, animal, city, moon, mars, crime, wild, event, clone.
   **No `STRUCTURE`.** Closest existing: `BUILDING`.

2. **Card declaration:** `tags: [Tag.X]` on the card class → exported into
   `cards.json` by `make:cards`.

3. **Icon CSS / assets:**
   - Class: `tag-${slug}` (`Tag.vue`, `CardTag.vue`)
   - CSS: `src/styles/cards.less` (`.tag-building { background-image: url("./assets/tags/building.png"); }` etc.)
   - PNG: `assets/tags/<slug>.png`

4. **Player counters:**
   - Server: `src/server/player/Tags.ts` — `countAllTags()` over `ALL_TAGS`;
     `game.tags` is the union of tags present in decks at game creation
     (`Game.ts` ~L309–316).
   - Client: `src/client/components/overview/PlayerTags.vue` — `ORDER` list
     drives display; expansion tags gated by `game.tags.includes(tag)`.

5. **Card list filter:** `CardList.vue` / `CardListModel.ts`
   (`TAG_ABBREVIATIONS` hash keys).

### Places that count *distinct* tags

Adding tags that appear in play raises `tagsInGame()` (the cap) and can make
fixed thresholds easier to hit.

| What | Path | How |
|------|------|-----|
| Core API | `src/server/player/Tags.ts` `distinctCount` (~L243–294), `tagsInGame` (~L228–234) | Unique tags + wilds, capped by tags in game |
| **Diversifier** (need 8) | `src/server/milestones/Diversifier.ts` | `distinctCount('milestone')` |
| **Diversity** GE (need 9) | `src/server/turmoil/globalEvents/Diversity.ts` | `distinctCount('globalEvent') + influence >= 9` |
| **Interplanetary Trade** | `src/server/cards/promo/InterplanetaryTrade.ts` | `distinctCount('default', Tag.SPACE)` → MC production |
| **Aridor** | `src/server/cards/colonies/Aridor.ts` | Own `Set<Tag>`; +1 MC prod per new tag type (~L61–69) |
| Multi-tag req helper | `Tags.playerHas` | Used by Luxury Foods, CardRequirements |

**Not distinct** (easy to confuse):

- **Ecologist** — `src/server/milestones/Ecologist.ts`: sum of plant/animal/microbe
  via `multipleCount`, threshold 4 — not unique types.
- **Biologist** award — same style.

Also update when adding tags: `ALL_TAGS`, `PlayerTags.vue` `ORDER`,
`CardListModel` abbreviations, CSS + PNG, any MarsBot / Underground tag pickers.

**Impact for Consortium:** two new tags (Structure, Prospecting) that appear on
cards in the deck will increase `tagsInGame()` and make Diversifier / Diversity /
Aridor / Interplanetary Trade easier for players who take those tags. Design
should account for this (or restrict when the tags enter `game.tags`).

---

## 10. Robotic Workforce

### Files

- Card: `src/server/cards/base/RoboticWorkforce.ts`
- Shared logic: `src/server/cards/base/RoboticWorkforceBase.ts`
- Sibling: `src/server/cards/promo/CyberiaSystems.ts` (same base)
- Tests: `tests/cards/base/RoboticWorkforce.spec.ts`
  (+ per-card “Compatible with Robotic Workforce” tests elsewhere)

### Selection logic

`RoboticWorkforceBase.isCardApplicable` (~L31–67):

1. Exclude events unless Odyssey is in play.
2. **Require `Tag.BUILDING` or `Tag.WILD`** — otherwise return `false` immediately.
3. Then require a copyable production box (`productionBox` or `behavior.production`).

### Confirmed: production box, no building tag → out of reach

Yes. Explicit negative test in `RoboticWorkforce.spec.ts`:

> Should not work with Solar Wind Power (no building tag, but has production)

**Implication for Consortium:** a Structure-tagged card with a production box but
**without** `Tag.BUILDING` / `Tag.WILD` is **not** copyable by Robotic Workforce.
If a Structure card also has a building tag, it *is* in scope.

---

## 11. Serialization / GameOptions

### Storage

- `SerializedGame.gameOptions: GameOptions` — `src/server/SerializedGame.ts`
- Full type + defaults: `src/server/game/GameOptions.ts` (`DEFAULT_GAME_OPTIONS`)
- Client projection: `ServerModel.getGameOptionsAsModel` maps flat flags →
  `expansions` record

### Serialize / deserialize

- **Serialize:** `Game.serialize()` stores `gameOptions: this.gameOptions` wholesale.
- **Deserialize:** `Game.deserialize(d)` uses `d.gameOptions` **as-is** —
  **no** merge with `DEFAULT_GAME_OPTIONS` (`Game.ts` ~L1700–1719). Only
  normalizes `boardName`.

### Defaults / backward compatibility

| Layer | Pattern |
|-------|---------|
| **New games** | `{...DEFAULT_GAME_OPTIONS, ...partialOptions}` (`Game.ts` ~L279); builds `expansions` from legacy flat flags if missing (~L260–278) |
| **Loaded GameOptions** | Not default-filled; missing new fields stay `undefined`. Call sites often treat falsy / `=== true` as off |
| **Top-level SerializedGame fields** | Explicit `??` defaults (e.g. `undoCount ?? 0`, `tradeEmbargo ?? false`) |
| **Player deserialize** | Same `??` style for newer fields |
| **Renames** | `normalizeBoardName`, `maybeRenamedMilestone`, `maybeRenamedAward`; occasional ad-hoc migrations with TODO remove-by dates |

**Practical takeaway for `consortiumExpansion`:**

- Add to `GameOptions` type + `DEFAULT_GAME_OPTIONS` (covers **new** games).
- On **load**, either rely on optional/falsy-as-default consumers
  (`if (gameOptions.consortiumExpansion === true)`), or add an explicit
  `?? false` / merge at deserialize if the field must always be defined.
- Keep both the flat flag and `expansions.consortium` in sync the same way
  Star Wars does (`ApiCreateGame` write, `ServerModel` read, `Game.ts`
  synthesize-from-legacy path).

---

## 12. Collision check

| Term | Status |
|------|--------|
| **Consortium / consortium** | **Card names taken** (3 base cards): `Asteroid Mining Consortium`, `Great Escarpment Consortium`, `Power Supply Consortium`. Module id `'consortium'` and expansion label are **free** in `GameModule`. Display name “Consortium” is fine as an expansion title but will coexist with those card titles in search/UI. |
| **iridium / Iridium** | **No exact match** in `.ts`/`.vue` source. Near-miss: moon card `SINUS_IRDIUM_ROAD_NETWORK = 'Sinus Irdium Road Network'` (likely misspelling of lunar Sinus Iridum). Some locale *translations* use “Iridium” for that card. |
| **structure as a tag** | **Free.** No `Tag.STRUCTURE`. Unrelated English “structure” appears in comments only. Infrastructure card names exist (`POWER_INFRASTRUCTURE`, etc.) — different concept. |
| **prospecting / Prospecting** | **Taken as CardName:** `PROSPECTING = 'Prospecting'` — underworld prelude (`src/server/cards/underworld/Prospecting.ts`, tags `[Tag.SPACE]`). A **tag** named Prospecting is still free as `Tag.PROSPECTING = 'prospecting'`, but a card named “Prospecting” would collide. |
| **megastructure / Megastructure** | **Free** (zero matches). |
| **keystone / Keystone** | **Free** (zero matches). |

### GameModule

Current modules: `base`, `corpera`, `promo`, `venus`, `colonies`, `prelude`,
`prelude2`, `turmoil`, `community`, `ares`, `moon`, `pathfinders`, `ceo`,
`starwars`, `underworld`, `deltaProject`. No consortium / iridium / structure /
prospecting / megastructure / keystone module names.

### Warning

`CardName.ts` has **no duplicate-value detection**. TypeScript will not error on
two enum members with the same string value. Grep before adding names; prefer
unique display strings (e.g. avoid a second card literally named `Prospecting`).

---

## Proposed empty-module registration order

Ordered file-change list for registering a completely empty module named
`consortium` with a working lobby checkbox and no cards. Modeled on Star Wars.

Naming convention to follow (mirror starwars):

| Layer | Proposed name |
|-------|---------------|
| Module / expansions key | `'consortium'` |
| Flat GameOptions flag | `consortiumExpansion` |
| Manifest export | `CONSORTIUM_CARD_MANIFEST` |
| CSS | `.consortium-icon`, `.expansion-icon-consortium` |

### Ordered changes

1. **`src/common/cards/GameModule.ts`** — add `'consortium'` to `EXPANSIONS`,
   `MODULE_NAMES` (e.g. `'Consortium'`), `DEFAULT_EXPANSIONS` (`false`).
2. **`src/server/game/GameOptions.ts`** — add `consortiumExpansion: boolean` to
   the type and to `DEFAULT_GAME_OPTIONS` (`false`); add `consortium: false` under
   `expansions`.
3. **`src/server/cards/consortium/ConsortiumCardManifest.ts`** — new file;
   empty `ModuleManifest` with `module: 'consortium'` and empty
   `projectCards: {}` (no CardName entries yet).
4. **`src/server/cards/AllManifests.ts`** — import and append
   `CONSORTIUM_CARD_MANIFEST` to `ALL_MODULE_MANIFESTS`.
5. **`src/server/GameCards.ts`** — import manifest; add
   `[gameOptions.consortiumExpansion, CONSORTIUM_CARD_MANIFEST]` to the include list.
6. **`src/server/cards/CardFactorySpec.ts`** — `case 'consortium': return gameOptions.consortiumExpansion`.
7. **`src/server/Game.ts`** — in the synthesize-`expansions`-from-legacy-flags
   block (~L260–277), add `consortium: partialOptions.consortiumExpansion ?? false`.
8. **`src/server/routes/ApiCreateGame.ts`** — map
   `consortiumExpansion: gameReq.expansions.consortium`.
9. **`src/server/models/ServerModel.ts`** — expose
   `expansions.consortium: options.consortiumExpansion`.
10. **`src/server/turmoil/globalEvents/GlobalEventDealer.ts`** — add
    `consortium: gameOptions.consortiumExpansion` to the includes map (even with
    zero global events).
11. **`src/client/components/create/CreateGameForm.vue`** — checkbox
    `v-model="expansions.consortium"` + label + expansion icon class (mirror
    starwars block ~L161–164).
12. **`src/client/components/create/json.ts`** + **`JSONProcessor.ts`** — optional
    but recommended: legacy JSON key `consortiumExpansion` → `expansions.consortium`
    for import/export parity.
13. **`src/client/components/GameSetupDetail.vue`** — show icon when
    `gameOptions.expansions.consortium`.
14. **`src/client/components/cardlist/CardListModel.ts`** — filter abbreviation
    for `consortium` (pick an unused single-letter hash key).
15. **`src/styles/cards.less`** — `.consortium-icon` and
    `.expansion-icon-consortium` (background → expansion icon PNG).
16. **`assets/expansion_icons/expansion_icon_consortium.png`** — new icon asset.
17. **Optional chrome:** `HelpRulebooks.vue`, `WikiLinks.ts`, locale
    `ui.json` / `UI.json` entries for the display name `"Consortium"`.
18. **Test fixtures** that enumerate every expansion key — update so create-game /
    API tests keep compiling:
    - `tests/routes/ApiCreateGame.spec.ts`
    - `tests/routes/ApiGame.spec.ts`
    - `tests/client/components/create/JSONProcessor.spec.ts`
    - `tests/client/components/overview/PlayerTags.spec.ts`
    - any other fixture with a full `expansions: { … }` object

### Explicitly not required for the empty shell

- No `CardName` entries
- No card class files
- No `make:json` / locale card files
- No board / resource / tag changes

### After wiring

```bash
npm run make:cards   # manifest still exported (empty projectCards is fine)
# smoke: npm run dev → open create-game → toggle Consortium checkbox → create game
```

TypeScript should fail-closed if any `Record<Expansion, boolean>` or
`satisfies Record<Expansion, …>` site is missed when `'consortium'` is added to
`EXPANSIONS` — use that as a checklist for remaining call sites.
