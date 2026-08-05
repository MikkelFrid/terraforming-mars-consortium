# Consortium — Top-tier mobile client vision

Date: 2026-08-05  
Status: product / UX design analysis — no implementation in this document  
Supersedes: earlier “mobile shell around desktop components” framing in this file  
Audience: product owner deciding ambition; engineers scoping a first-class mobile client

---

## 0. Ambition statement

**Scaled desktop is not a mobile product.** Tabs wrapping the current
`PlayerHome` scroll stack are a useful *engineering bridge*, not the destination.

The destination is a **top-tier mobile Terraforming Mars client**: the kind of
experience players compare to Dire Wolf ports (Root, Everdell), MTG Arena
mobile, and the best Board Game Arena titles — and that beats the official
Fryx/Artefact TM app on clarity of turn flow, touch ergonomics, and async play.

Definition of done for “top tier”:

> A skilled player can take a full turn on a phone **one-handed, in portrait,
> at 100% page zoom**, without pinch-hunting for UI, and feel that the phone
> was the intended platform — not a compromise.

That requires **mobile-native information architecture, interaction models,
and presentation** — while keeping the same server, rules, and card data.

Desktop remains first-class and largely unchanged. Mobile is a **second client
surface** over the same `PlayerViewModel` / input protocol, not a CSS theme.

---

## 1. Why today’s client fails the bar (evidence)

### 1.1 Wrong product model

| Today | Top tier |
|-------|----------|
| One HTML page that is a digital table | A turn-taking **app** with modes |
| Browser pinch-zooms everything | Only the map has a camera |
| Actions buried mid-scroll | The turn **is** the primary UI |
| Hand is a display strip below | Hand is how you play cards |
| Hover reveals meaning | Tap / long-press reveals meaning |
| Viewport `width=1260` | `device-width`, app chrome, safe areas |

```html
<!-- assets/index.html — root cause of constant zoom -->
<meta name="viewport" content='width=1260, user-scalable=1' />
```

### 1.2 Interaction inventory is desktop-shaped

Almost every choice is **inline under Actions** via
`WaitingFor` → `PlayerInputFactory`. No task focus. Board lives far above.
Hand on `PlayerHome` is display/reorder only — you do not play by tapping a
card in hand; you open OrOptions → Play project → pick from another card grid.

Densest mobile failures (must be **redesigned**, not restyled):

| Rank | Flow | Why scale/tabs are not enough |
|------|------|-------------------------------|
| 1 | OrOptions → `projectCard` + payment | Nested radio tree + full hand + multi-resource pay |
| 2 | `SelectSpace` | Prompt in Actions; targets on distant fixed-pixel board |
| 3 | `SelectInitialCards` | Corp/prelude/CEO/projects as many 240px cards |
| 4 | Draft `SelectCard` | Repeated picks, no draft theater |
| 5 | Other player tableau | Inline dump of entire card piles |
| 6 | Megastructure contribute | Strip + OrOptions tree + payment; hover bridge preview |
| 7 | Party / colony / global event | Wide horizontal widgets |
| 8 | Create game | Separate mega-form |

### 1.3 What “good enough shell” gets wrong as an end state

A BottomNav that swaps between existing sections still:

- Presents OrOptions as a desktop radio list
- Plays cards through a second card grid, not the hand
- Confirms spaces with a tiny dialog after hunting hexes
- Shows cards at 240px art without a reading/play ritual
- Treats log, opponents, and board as equal peers instead of **context for the turn**

That can stop the zoom pain. It will not feel like a top-tier game.

---

## 2. Reference bar (what to steal)

| Reference | Steal | Avoid |
|-----------|-------|-------|
| **Dire Wolf (Root, Everdell)** | Tap-select / tap-confirm; long-press inspect; board camera; undo within turn; tutorial that teaches by doing | Cloning fantasy art language |
| **MTG Arena mobile** | Adaptive UI: same rules, different chrome density; hand as primary; card detail as full ritual; clear priority of “what can I do now” | F2P shop noise |
| **BGA UX guidelines** | Playable at 100% scale; action zone first on vertical; ≥40–44px targets; no hover-required play; player panels ≤¼ screen | Jump-link soup as the only IA |
| **Official TM digital** | Board as hero; modular panels for resources/cards | Crowded hitboxes, menu hopping, weak async cues |
| **Native iOS/Android patterns** | Bottom sheets, large titles, haptics, push when your turn, safe areas | Fighting the platform (custom gestures that conflict with OS) |

Consortium-specific brand: industrial frontier / iridium / megastructures —
the mobile chrome should feel **cold, precise, high-contrast utilitarian**, not
generic purple game UI and not a shrunk Spectre admin form.

---

## 3. Product principles

1. **Turn is the product.** When it is your turn, the UI is an action cockpit.
   When it is not, it is a beautiful waiting room with prep tools.
2. **One decision at a time.** Never nest Play → card grid → payment → confirm
   as one scrolling tree. Use a step stack with a visible back affordance.
3. **Hand is verb; board is stage; tableau is memory.**
4. **Map has a camera; UI does not zoom.**
5. **Inspect is free; commit is explicit.** Long-press / inspect sheet never
   spends resources. Primary CTAs say the verb (“Place city”, “Pay 12 M€”).
6. **Show only what changes the decision.** Collapse everything else behind
   progressive disclosure.
7. **Touch language is consistent everywhere:** tap select, tap confirm /
   primary button commit, long-press inspect, swipe dismiss sheet, pinch only
   on map.
8. **Desktop and mobile share protocol, not pixels.**
9. **Async-first.** Most TM games are not played in one sitting. Notifications,
   “what happened”, and resume-into-decision matter as much as animations.
10. **Consortium is first-class.** Iridium, terrains, megastructures are not
    afterthoughts bolted under More.

---

## 4. Dual-client architecture

```
                    ┌─────────────────────────────┐
                    │  Server (unchanged rules)   │
                    │  PlayerInputModel protocol  │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Shared view-model layer    │
                    │  (existing PlayerViewModel) │
                    └─────────────┬───────────────┘
               ┌──────────────────┴──────────────────┐
               │                                      │
    ┌──────────▼──────────┐              ┌────────────▼────────────┐
    │  DesktopClient      │              │  MobileClient           │
    │  PlayerHome (keep)  │              │  new route tree / shell │
    │  current Less       │              │  mobile components      │
    └─────────────────────┘              └─────────────────────────┘
```

### 4.1 Routing

Detect once at app boot (width + `pointer: coarse` + optional preference):

- `DesktopClient` → today’s `PlayerHome` / `SpectatorHome`
- `MobileClient` → new `mobile/` component tree

Do **not** try to make every existing component “responsive enough.” Fork the
presentation layer. Share:

- API clients / `WaitingFor` submit+poll logic (extract from UI)
- Card renderer (`Card.vue`) inside mobile frames
- Board space DOM or a future board renderer
- i18n strings
- Preferences that are semantic (`lang`, sound, learner mode)

### 4.2 Extract before UI rewrite

Pull out of `WaitingFor.vue`:

- Poll loop (`API_WAITING_FOR`)
- Submit (`PLAYER_INPUT`)
- Remount policy (today’s `screen='empty'` hack — reconsider)
- Notify (sound + Notification API)

Mobile and desktop both consume a `useTurnSession()` (or plain TS module).
Presentation becomes replaceable.

### 4.3 Input presenter registry (mobile)

Replace “one Vue file per type mounted inline” with a **step machine**:

```
Incoming PlayerInputModel
  → normalize (flatten learner-mode filters, label actions)
  → MobileInputRouter
       or        → ActionSheet (list of verbs)
       projectCard → PlayCardFlow (hand → detail → pay → confirm)
       card      → PickCardsFlow (draft/discard/sell/…)
       space     → PlaceTileFlow (board camera + confirm bar)
       payment   → PaySheet
       initialCards → SetupWizard
       and       → Wizard of children
       …         → specialized sheets
```

Each flow owns its chrome. Nested `or`/`and` become navigation, not indentation.

---

## 5. Mobile information architecture

### 5.1 Modes (not equal tabs)

| Mode | When | Job |
|------|------|-----|
| **Turn** | `waitingFor` is actionable | Complete the current decision stack |
| **Table** | Always available | Board camera + global parameters + M/A + megastructures |
| **Empire** | Always | Your hand, tableau, productions, tags, self-replicating robots |
| **Rivals** | Always | Opponent summary → drill-in |
| **Chronicle** | Always | Log, generation jumps, “since you left” |

Bottom nav: **Turn · Table · Empire · Rivals · More**  
(More = Chronicle, colonies, settings, help).

**Critical:** Turn mode is not “the WaitingFor block from desktop.” It is a
dedicated full-screen flow host. Badge on Turn when actionable; auto-enter Turn
when the poll returns `GO` (with a short, skippable “Your turn” pulse).

### 5.2 Persistent HUD (always)

Compact, ≤56px + safe-area:

- Generation + phase chip
- Temperature / oxygen / oceans (/ Venus) as tiny meters — tap opens Table focused on params
- Your M€ · steel · titanium · **iridium** · energy · heat · TR · VP estimate
- Acting-player color pip

HUD never includes the full tag row. Tags live in Empire → identity sheet.

### 5.3 Waiting room (not your turn)

Full-bleed Table (board at fit) with:

- “Waiting for **Red**…” + elapsed soft timer (optional)
- Prep: browse Empire, inspect Rivals, skim Chronicle
- Optional “notify me” OS permission CTA once
- No fake interactivity on disabled actions

---

## 6. Redesign of every critical flow

### 6.1 Play a project card (the heart)

**Today:** OrOptions radio → expand → another card grid → PaymentForm → Save.

**Top tier:**

```
Turn home
  └─ big verb tiles: Play card | Standard project | Card actions | …
        └─ Play card
              └─ Hand theater (fan / horizontal snap, affordances: cost, tags, can-pay)
                    └─ Card focus (full-screen art + rules text + warnings)
                          └─ Pay sheet (smart defaults, iridium first-class)
                                └─ Confirm (“Play Optimized Aerobraking for 12 M€ + 1 iridium”)
                                      └─ Success toast + board/log delta
```

Details:

- Hand shows **only playable** by default; toggle “Show unplayable”
- Unplayable cards stay visible but muted with reason (“Need 2 science”, “Need iridium”)
- Card focus supports pinch-zoom on art text (card-local, not page)
- Payment steppers are 48px hit targets; tapping the resource icon spends max useful
- Heat→MC, steel/titanium/iridium legal mixes explained inline, not in tooltips
- Back stack preserves selections until confirm

### 6.2 Standard projects & milestones/awards

Verb list with **cost + requirement state** on the row itself.
No hunting desktop buttons on the board chrome.
Claim milestone: row → confirm sheet (“Claim Builder for 8 M€?”).

### 6.3 Place a tile (`SelectSpace`)

**Today:** Red text in Actions + `GoToMap` scroll + click hex + confirm dialog.

**Top tier:**

1. Enter PlaceTileFlow → **Table mode takes over** with camera
2. Available hexes pulse; illegal hexes dim
3. Filters chips: Land · Ocean · Highland · Crater · Dedicated (greenery/city/…)
4. Tap hex → pin selection + bottom **Confirm bar** (“Place city on Tharsis Tholus”)
5. Optional “list mode” for a11y: searchable space names/ids
6. After place: brief camera linger on the tile + resource gains toast

Consortium terrains: chasms never selectable (already restricted); crater yield
and highland foundation callouts appear on the confirm bar when relevant.

Bridge megastructure preview: **tap** a bridge segment or contribute affordance
— never hover.

### 6.4 OrOptions action menu

Become a **verb grid / list**, not nested radios:

- Primary verbs large
- Secondary (sell patents, pass) visually quieter
- Destructive/pass separated (BGA: cancel/pass away from forward actions)
- Choosing a verb **navigates** into a flow; Back returns to verb list
- Learner mode filters apply before rendering verbs

### 6.5 Draft

Draft is theater:

- Centered pack / row of candidates at readable scale
- Timer or “waiting for others” if simultaneous
- Selected card flies to “drafted” tray
- Pass direction cue (left/right) when relevant
- Do not show the rest of Empire until the pick is done (reduce mis-taps)

### 6.6 Initial setup wizard

Multi-step wizard, one concern per screen:

1. Corporation (full card, swipe between options, compare sheet)
2. Preludes (pick N)
3. CEO if present
4. Projects (budget meter sticky)
5. Review → Confirm

MC math is a sticky footer, not a line lost under cards.

### 6.7 Payment (including iridium)

Dedicated Pay sheet used by standard projects, milestones, megastructures, cards:

- Resource order: M€ · steel · titanium · **iridium** · heat (as today legal)
- Each row: icon, stock, stepper (− / +), “max”
- Live remaining cost
- Illegal combinations disabled with reason
- Consortium: iridium scarcity messaging when paying the last units

This sheet is shared; do not fork payment UI per flow.

### 6.8 Card actions & blue cards

Empire → Actions filter, **or** Turn verb “Card actions”:

- List actionable cards with state (used this gen / resources on card)
- Tap → card focus → action confirm / target flow
- Targeting another player or card jumps into a constrained picker sheet

### 6.9 Megastructure contribute

First-class Turn verb **and** Table affordance:

- Table: megastructure strip as glanceable tracks; tap structure → sheet
  (segments, owners, next cost, keystone iridium gate, Contribute CTA)
- Contribute CTA only when `canContribute` and it is your action window;
  otherwise explain (`cannot_afford` / `missing_foundation` / not your turn)
- Payment uses shared Pay sheet
- On completion of a structure: ceremony (see Motion) + global effect toast +
  contributor bonus emphasis (design: weak global / strong contributor)

### 6.10 Opponents

Rivals mode:

- Compact rows: color, corp thumbnail, TR, VP, tag counts, resource totals,
  status (active/passed/drafting)
- Tap → opponent sheet: corp, productions, tags, tableau filters
  (active / automated / events), colonies ownership
- **Never** dump all cards inline on the home surface
- Compare sheet: you vs them on tags/productions (optional v2)

### 6.11 Log / Chronicle

- Default view: **Since your last turn** (delta summary)
- Full log beneath with generation scrubber
- Tap entity → inspect sheet (card / space fly-to on Table / colony)
- Space highlight uses camera pan on Table, not `scrollIntoView` on a 1260px page

### 6.12 Colonies, Turmoil, Moon, Pathfinders, Venus

Each is a **sub-board sheet** from Table → Overlays:

- Glance chips on Table HUD when the expansion is in the game
- Full interaction only when the current input needs it (colony trade input
  opens Colonies sheet automatically)
- Turmoil: current party + dominant + delegates summary first; full board second

### 6.13 Create game / lobby

Separate mobile IA (still dual-client):

- Create: stepped wizard (players → expansions → board → options → advanced)
- Expansion toggles as large cards with art, not a checkbox forest
- Lobby: big “Copy my link”, player seats as avatars, Start when ready
- Spectator link secondary

---

## 7. Board system (camera, not page)

### 7.1 Requirements

- Fit-to-screen default (“Home” camera)
- Pinch zoom, one-finger pan, double-tap zoom to hex
- 60fps transforms (`transform` + `will-change` carefully; avoid layout thrash)
- Selection layer above art
- Legend / bonuses readable at fit on tablet; on phone, legend becomes a toggle
  or tap-space inspect
- Moon / Venus / colony boards as alternate camera targets or sheets

### 7.2 Implementation strategy

| Phase | Approach |
|-------|----------|
| v1 | CSS hex board inside a camera container (`transform: translate + scale`), gesture controller, existing sprites |
| v2 | If legends/hit tests hurt: SVG board with `viewBox`, shared coordinates from `build_board.py` |
| Avoid v1 | Canvas rewrite — kills DOM `SelectSpace` and accessibility |

Consortium board generator already emits positions — camera math should use the
same coordinate space as `board_positions.less`.

### 7.3 Hit targets

At fit scale on a 390px phone, Consortium’s large board may still yield small
hexes. Compensate with:

1. Minimum scale floor while placing tiles (auto-zoom to cluster of valid spaces)
2. Magnetic selection (nearest valid hex within radius)
3. Confirm bar always shows selected space name before commit
4. List picker fallback

---

## 8. Cards as a mobile medium

Cards stay **fixed art** (240px pipeline, codegen, language hacks). Mobile
changes the **frame**, not the innards.

| Context | Presentation |
|---------|--------------|
| Hand theater | ~70–85% width snap carousel; peek next cards |
| Draft | Same, fewer cards, larger |
| Tableau browse | Thumbnail grid ~0.42 scale, filter chips |
| Focus / inspect | 92% width sheet, scale ≥1.0, scroll rules text if needed |
| Log reference | Thumbnail → focus |

Long-press anywhere a card appears → Focus (inspect).  
In Play flow, Focus has a primary **Play** CTA when legal.

Do not reflow card HTML into “responsive text cards.” That fights the art
pipeline and i18n hacks and will never look premium.

---

## 9. Visual & motion language

### 9.1 Visual

- Platform: system fonts for chrome (SF / Roboto) + keep Ubuntu/card fonts on
  cards only
- HUD: blur materials / solid high-contrast bars (test outdoors: TM is often
  played at tables with glare — prefer contrast over glass fashion)
- Color: player colors as strong identity; iridium as a distinct metallic accent
  already used in Consortium art — reuse, don’t invent neon
- Avoid: purple gradients, pill soup, emoji status, multi-shadow cards in chrome
- Density: desktop may stay dense; mobile chrome is airy, game content is rich

### 9.2 Motion (intentional, 2–5 signatures)

Ship a small choreography set — not random fades:

1. **Your turn pulse** — HUD pip + soft Turn tab attention (respect
   `prefers-reduced-motion`)
2. **Card fly** — hand → focus → tableau / discard
3. **Tile drop** — confirm → hex lands + bonus chips float
4. **Parameter tick** — temp/oxygen/ocean change
5. **Megastructure segment lock** — segment fill + keystone climax

Haptics: light impact on select, success on commit (where `navigator.vibrate`
or future Capacitor bridge exists).

No Vue page transitions today — introduce a minimal motion module; do not
animate the desktop remount hack.

---

## 10. Async, notifications, resume

Top-tier TM mobile is an **async multiplayer client**:

| Feature | Behavior |
|---------|----------|
| Push / OS notification | “Your turn — Generation 8” (opt-in) |
| Resume | Deep link opens into Turn mode on the pending decision |
| Delta summary | Chronicle top: what opponents did since your last submit |
| Dead man’s switch UX | Clear passed / active / disconnected states |
| Background tab | Today’s title animation is a stopgap; prefer Notification + optional sound |
| Service worker | Replace empty `sw.js` comment with real offline shell of static assets + push hook if product wants it |

Extract `notify()` from `WaitingFor` so desktop and mobile share policy.

---

## 11. Help, learner mode, trust

- Contextual rules: long-press resource / tag / parameter → plain-language sheet
- Learner mode: already hides some OrOptions — surface as “Guided” with
  recommended verbs highlighted, not removed without explanation
- Confirm copy always restates cost and effect in one sentence
- Undo: server may not support full undo; if not, do not fake it — offer
  “Review before confirm” strongly (double confirm only for pass / irreversible)
- Error/offline: full-screen calm retry, keep local UI state in the step stack

---

## 12. Accessibility & platform rules

- Targets ≥44×44 CSS px; WCAG 2.2 spacing
- Do **not** disable pinch on the document; map camera handles map zoom
- `prefers-reduced-motion` disables signature choreography
- Screen reader: verb list as listbox; card focus announces name, cost, tags,
  requirements
- Dynamic type: chrome respects; cards remain art (inspect sheet can show a
  text fallback rules block if needed later)
- Safe areas on HUD, bottom nav, confirm bars
- Landscape: Table can go immersive (hide nav until swipe); Turn flows stay
  portrait-optimized first

---

## 13. Performance budget

| Metric | Target |
|--------|--------|
| Turn mode interactive after resume | &lt; 1s on mid-tier phone |
| Board pan/zoom | 60fps on last two iPhone / Pixel classes |
| Card focus open | &lt; 100ms to first paint (reuse mounted Card) |
| Input submit → next UI | No full-app remount flash; replace today’s empty-screen remount |

Engineering implication: stop remounting the entire home via
`screen = 'empty'` for mobile; patch `waitingFor` in place.

---

## 14. Consortium-specific mobile requirements (non-negotiable)

1. **Iridium** in HUD, Pay sheet, requirements warnings, crater-yield toasts
2. **Terrains** readable on Table (chasm / crater / highland) without desktop
   legend eyestrain — tap hex inspect
3. **Megastructures** as Table strip + Turn verb + ceremony
4. **Frontier / bridge** unlock communicated when the bridge completes (camera
   pan to new zone)
5. **No building tag on Siderophile Extraction** — UI must not imply workforce
   synergy that does not exist
6. Artwork remains generator-owned (`tools/consortium-art/build_assets.py`)

---

## 15. What we deliberately do not do

| Anti-goal | Reason |
|-----------|--------|
| Responsive CSS on `PlayerHome` as the product | Caps at “usable”, never “top tier” |
| `user-scalable=no` | A11y harm; masks bad layout |
| Fluid HTML cards | Fights art + i18n pipeline |
| Native-only rewrite first | Web dual-client ships faster; native wrapper later if needed |
| Feature parity with every desktop preference day one | Port semantic prefs; drop hover-era prefs |
| Citing validation harness as UX proof | Crashes ≠ delight |
| Shipping mobile payment without iridium | Consortium integrity |

---

## 16. Phased delivery toward the bar

Phases are **product slices**, each shippable behind a flag, each raising the
ceiling — not watering down the vision.

### P0 — Foundations

- Client fork detection + `MobileApp` route host
- Extract turn session (poll/submit/notify)
- Viewport `device-width`, safe areas, HUD + bottom nav chrome
- Feature flag / preference `mobile_client` (auto on narrow + coarse)

### P1 — Turn cockpit

- Verb list from OrOptions
- PlayCardFlow (hand → focus → pay → confirm)
- Pay sheet with iridium
- Pass / standard projects as verbs
- Kill nested radio indentation on mobile

**Exit criteria:** play a card and pass a turn one-handed without page pinch.

### P2 — Table camera

- Board camera (pan/zoom/fit)
- PlaceTileFlow with confirm bar + filters
- Parameter meters + M/A glance
- Megastructure strip glance

**Exit criteria:** place city/ocean/greenery without document zoom.

### P3 — Empire & rivals

- Hand + tableau browser + card actions
- Opponent sheets
- Tag / production identity

### P4 — Setup & draft theater

- Initial wizard
- Draft theater
- Research/buy flow polish

### P5 — Chronicle & async

- Since-last-turn delta
- Push notifications
- Resume deep link into decision
- Replace remount flash

### P6 — Expansion overlays & create-game

- Colonies / Turmoil / Moon / Venus / Pathfinders sheets
- Create-game wizard + lobby

### P7 — Ceremony & craft

- Motion signatures, haptics, megastructure climax
- A11y pass, performance budget, landscape Table
- Optional PWA install / SW caching

**P1+P2 are the credibility gate.** If those do not feel premium, stop and
redesign before building More tabs.

---

## 17. Engineering map (starting points)

| Concern | Today | Mobile direction |
|---------|-------|------------------|
| Boot / screens | `App.vue` | Branch to `mobile/MobileApp.vue` |
| Home stack | `PlayerHome.vue` | Not reused as layout; mine for data wiring |
| Inputs | `PlayerInputFactory.vue` + siblings | `mobile/inputs/*Flow.vue` + router |
| Turn sync | `WaitingFor.vue` | `turnSession.ts` + thin presenters |
| Board | `Board.vue`, `SelectSpace.vue` | `mobile/TableCamera.vue` + PlaceTileFlow |
| Cards | `Card.vue`, `SelectCard.vue`, `SelectProjectCardToPlay.vue` | HandTheater, CardFocusSheet |
| Payment | `PaymentForm.vue`, `SelectPayment.vue` | `mobile/PaySheet.vue` (shared logic) |
| Opponents | `OtherPlayer.vue`, overview/* | `mobile/RivalSheet.vue` |
| Log | `logpanel/*` | `mobile/Chronicle.vue` |
| Megastructures | `MegastructuresPanel`, contribute util | Table strip + Contribute sheet |
| Viewport | `assets/index.html` | Dynamic meta or mobile index policy |
| Prefs | `PreferencesManager.ts` | Add mobile flags; ignore hover prefs on mobile |

Keep server manifests, card behavior, and serialization out of scope unless a
mobile flow discovers a protocol gap (prefer client normalize).

---

## 18. Acceptance tests for “top tier”

### Qualitative (playtest)

1. New mobile-only playtester completes generation 1–2 without help zooming
2. Experienced desktop player prefers phone for async turns
3. Zero required document pinch in a scored turn checklist
4. Consortium game: pay iridium, place on highland/crater, contribute
   megastructure — all inside mobile flows

### Quantitative

| Check | Target |
|-------|--------|
| Document pinch gestures / turn | ~0 |
| Map gestures / tile placement | allowed, usually 0–2 |
| Mis-tap rate on payment steppers | near 0 in playtest |
| Time to play a legal card from Your turn | competitive with official app |
| Client test baseline | no regression on desktop suite |
| Full suite | ≥ existing green baseline before PR merge |

Manual matrix: iOS Safari, Android Chrome, tablet portrait, desktop flag off.

---

## 19. Open product questions

1. **Auto-enable vs opt-in** for the mobile client on first visit?
2. **How aggressive is auto-jump to Turn mode** when notified mid-browse?
3. **Spectator mobile** — same IA with Turn replaced by “Follow”?  
4. **Upstream** — design for eventual contribution to terraforming-mars, or
   Consortium-only until proven?
5. **Native wrapper** (Capacitor) for push reliability — v1 web push enough?
6. **Text rules fallback** for cards when art text is hard to read — ship in P3
   or later?

Flag unknowns rather than guessing in implementation PRs.

---

## 20. Summary

The current site is a desktop tabletop under a magnifying glass. Making it
“responsive” will not produce a top-tier mobile game.

A top-tier Consortium mobile client is a **second presentation layer**: turn
cockpit, board camera, hand theater, shared pay sheet, opponent/chronicle
sheets, async resume — driven by the existing input protocol. Consortium
systems (iridium, terrain, megastructures) are designed in from P1/P2, not
bolted on.

Ship behind a flag, earn credibility with **Play card + Place tile**, then
expand. Judge success by whether a player forgets the desktop existed — not by
whether the layout fits within 390px.
