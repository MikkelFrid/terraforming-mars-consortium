# Consortium — Mobile UI analysis

Date: 2026-08-05  
Status: design analysis only — no implementation in this document  
Audience: anyone deciding how (or whether) to invest in a real mobile client

---

## 1. Verdict

Today’s “mobile support” is **browser pinch-zoom of a fixed desktop layout**.

The game is playable on a phone in the same sense that a PDF of a board game
is playable: you can see everything if you zoom and pan constantly. It is not
a mobile UI. Layout, hit targets, information architecture, and interaction
model are all desktop-first.

A real mobile-friendly version is **not media queries on top of the current
page**. It is a redesign of:

1. Viewport contract
2. Navigation / information architecture
3. Board presentation (pan/zoom viewport, not page zoom)
4. Card presentation (scale + sheets, not reflow)
5. Touch interaction model (no hover dependence)

Upstream terraforming-mars has the same shape; this fork inherits it. Consortium
makes the problem worse (larger board, megastructure strip, iridium UI) but is
not the root cause.

---

## 2. What exists today (evidence)

### 2.1 Viewport is locked to desktop width

```html
<!-- assets/index.html -->
<meta name="viewport" content='width=1260, user-scalable=1' />
```

The browser is told the layout is **1260px wide**. On a ~390px phone that means
initial scale ≈ 0.31. Everything is tiny; the user pinch-zooms to act, then
pinches out to find the next region. That is the “zoomer konstant” experience.

Contrast: the Consortium rulebook already uses a correct mobile viewport
(`width=device-width, initial-scale=1` in `assets/consortium/rulebook.html`).
The game itself does not.

### 2.2 Almost no responsive CSS

Under `src/styles/`, the only game-UI media query found:

| File | Breakpoint | Effect |
|------|------------|--------|
| `players_overview.less` | `max-width: 1740px` | Stack player rows — still desktop widths |

No phone/tablet breakpoints for `PlayerHome`, board, top bar, sidebar, cards,
create-game, payment, or action panels.

### 2.3 Fixed-pixel layout everywhere

| Surface | Sizing |
|---------|--------|
| Classic board | `.board` 600×488 px; hexes 46×51 px, absolute positions |
| Consortium board | 891×860 px + `transform: scale(var(--consortium-board-scale))` (desktop 1080p/1440p pref, default 0.85) |
| Cards | 240px wide, absolute-positioned chrome (`cards.less` / `cards_v2.less`) |
| Sidebar | `position: fixed; width: 60px` |
| Top bar resources | `min-width: 564px !important` |
| Font tokens | px in `variables.less` (32 / 23 / 18 / 14 / 9) |

`rem` / `vw` are essentially unused for game chrome. Fluid units appear almost
only in `popup.less` (`90vw` / `90vh`).

### 2.4 Page structure is one long desktop scroll

`PlayerHome.vue` order:

1. Sticky `TopBar` (resources / tags)
2. Fixed left `Sidebar` (gen, params, hash anchors)
3. `GameBoardView` (Mars + Turmoil + Moon + Pathfinders + megastructures + M/A)
4. `PlayersOverview`
5. `LogPanel`
6. Actions (`WaitingFor` / inputs)
7. Hand / drafted cards
8. Played cards (corp, CEO, active, automated, event)
9. Colonies

On mobile this becomes: zoom to board → zoom out → scroll → zoom to actions →
zoom to hand → zoom to payment. There is no “current task” focus.

### 2.5 No touch interaction model

- No `touchstart` / `touchmove` / `pointer` gesture layer for the board
- `SelectSpace` attaches `tile.onclick` to DOM hexes
- Consortium bridge highlighting uses `@mouseenter` / `@mouseleave`
- Card magnify is hover-based (`magnify_cards`)
- Keyboard hotkeys via `HomeMixin` — useless on phone
- Only mobile-aware runtime code found: UA sniff in `WaitingFor.vue` to animate
  the **document title** instead of the favicon when it is your turn

### 2.6 Hit targets are below touch standards

Hex cells are **46×51 CSS px** at design scale. After `width=1260` shrink, they
are ~15 CSS px on a phone before the user zooms. Apple HIG / Material and BGA
UX guidance target **≈44×44 px** (WCAG 2.2 AA floor is 24×24 — still failed at
unzoomed scale). Dense resource chips and sidebar icons have the same problem.

### 2.7 Preferences that look related, but are not mobile

| Pref | Real purpose |
|------|----------------|
| `small_cards` | Scale cards to 0.8 — denser desktop |
| `magnify_cards` | Hover enlarge — desktop pointer |
| `consortium_board_scale` | Fit 1080p vs 1440p monitors |
| `hide_tile_confirmation` | Skip confirm dialog — useful on mobile if targets are good |

None of these constitute a mobile layout mode.

---

## 3. Why constant zoom feels broken

The pain is not “CSS is ugly on phones.” It is a **wrong zoom ownership**:

| Who zooms today | Who should zoom |
|-----------------|-----------------|
| Browser page zoom (whole UI) | In-app board viewport only |
| User re-finds actions after every zoom | Actions stay in a fixed chrome zone |
| Cards shrink with the page | Cards open as readable sheets / carousels |
| Hover tooltips missing | Explicit tap → detail |

Best practice from Board Game Arena UX guidelines and modern strategy-game
mobile work (map + HUD overlays):

- Default view must be **playable at 100% scale without pinch**
- Pinch/pan is for **inspecting a dense map**, not for reaching the End Turn
  button
- Secondary panels stack or become sheets; they do not sit off-screen at 0.3×
- Hover is not a gameplay dependency on touch devices

That is the opposite of `width=1260, user-scalable=1`.

---

## 4. Target experience (product definition)

### 4.1 Device tiers

| Tier | Width (CSS px) | Goal |
|------|----------------|------|
| Phone | &lt; 600 | Fully playable; one primary surface at a time |
| Tablet portrait | 600–900 | Board + compact HUD; sheets for cards |
| Tablet landscape / small laptop | 900–1260 | Closer to desktop; optional two-pane |
| Desktop | ≥ 1260 | Keep current layout (do not regress) |

Phones are the hard case. Design for phone first in the mobile shell; let
tablet inherit.

### 4.2 Non-goals

- Pixel-perfect clone of the desktop page on a 390px screen
- Rewriting the server / card engine
- Native iOS/Android apps (PWA-capable web is enough for v1)
- Reflowing card art into fluid HTML (cards stay fixed art, scaled)

### 4.3 Goals for “good enough mobile”

1. Open a game on a phone and take a turn **without pinch-zooming the page**
2. Place a tile by panning/zooming **only the board**, with ≥44px effective
   targets (or magnify-on-select)
3. Play a card from hand via a bottom sheet / horizontal scroller, readable
   text, clear Confirm
4. Always see: generation, your resources (incl. iridium), whose turn, primary
   action CTA
5. Reach log, other players, colonies, settings in ≤2 taps
6. Desktop layout unchanged unless a shared component is intentionally dual-mode

---

## 5. Recommended architecture

Do **not** sprinkle `@media (max-width: 600px)` across every Less file and hope.
Introduce a **mobile shell** that re-composes existing components.

```
┌─────────────────────────────────────┐
│ CompactTopBar  (resources, gen, TR) │  fixed
├─────────────────────────────────────┤
│                                     │
│   Active surface (one of):          │
│   • BoardViewport (pan/zoom)        │  flex: 1
│   • Actions / WaitingFor            │
│   • Hand carousel                   │
│   • Tableau browser                 │
│   • Players / Log / Colonies        │
│                                     │
├─────────────────────────────────────┤
│ BottomNav  Board│Act│Hand│More      │  fixed + safe-area
└─────────────────────────────────────┘
     ↑ sheets/modals for payment, card detail, other player
```

Detection:

```ts
// Prefer capability + width, not only UA
const isCoarsePointer = matchMedia('(pointer: coarse)').matches;
const isNarrow = matchMedia('(max-width: 600px)').matches;
const useMobileShell = isNarrow || (isCoarsePointer && width < 900);
```

Apply a root class (`body.mobile-shell`) similar to BGA’s `mobile_version` /
`touch-device` pattern so CSS and Vue can branch cleanly without rewriting
desktop.

Keep `PlayerHome.vue` as the data owner; extract presentational regions into
slottable views that desktop stacks vertically and mobile routes via tabs.

---

## 6. Workstreams (phased)

Phases are independent enough to ship separately. Each should leave desktop
green and improve a measurable mobile flow.

### Phase A — Stop the page zoom (foundation)

**Intent:** Make the layout canvas match the device; accept temporary
horizontal overflow until later phases fix it — or gate the mobile shell
behind a preference / query flag.

| Change | Notes |
|--------|-------|
| Viewport meta | `width=device-width, initial-scale=1, viewport-fit=cover` |
| Feature flag | `?mobile=1` or preference `experimental_mobile_shell` |
| Root class | `mobile-shell` / `touch-device` |
| Safe areas | `env(safe-area-inset-*)` on fixed chrome |
| Disable hover gameplay | Prefix hover rules with `.notouch-device` where hover is required to play |

**Risk:** Flipping viewport without a shell makes the current fixed layout
overflow badly. Ship viewport change **with** at least CompactTopBar +
BottomNav + BoardViewport stub, or keep flag off by default.

**Do not** set `user-scalable=no` / `maximum-scale=1` — that harms
accessibility. Page zoom becomes unnecessary when the shell is correct; leave
system zoom available.

### Phase B — Information architecture (biggest UX win)

Replace “one infinite scroll” with task surfaces:

| Tab | Contents |
|-----|----------|
| Board | Mars (+ Moon toggle), M/A collapsed, megastructure strip collapsed/expandable |
| Act | `WaitingFor` + payment + confirms — **default tab when it is your turn** |
| Hand | Drafted + hand as horizontal snap carousel |
| More | Tableau, other players, log, colonies, settings |

Auto-switch to **Act** when `waitingFor` becomes actionable; soft badge on
Board when a space must be selected (or temporarily force Board tab during
`SelectSpace`).

Sidebar hash anchors and keyboard jumps stay for desktop; mobile uses BottomNav.

### Phase C — Board viewport (kills map pinch-on-page)

Wrap the existing CSS hex board in a **pan/zoom container**:

- Outer: full width × remaining height between top/bottom chrome
- Inner: current `.board-cont` at a computed `scale` so “fit board” is default
- Gestures: one-finger pan, pinch zoom, double-tap zoom, “fit” button
- During `SelectSpace`: optional **selection magnifier** (enlarge available
  hexes or show a list of region filters: land / ocean / highland / crater)
- Replace hover-only Consortium bridge preview with tap-to-preview / persistent
  highlight of available spaces

Implementation options (pick one early):

| Option | Pros | Cons |
|--------|------|------|
| CSS `transform` + pointer events on wrapper | Reuses hex DOM + `SelectSpace` onclick | Hit-testing/transform quirks; must sync confirm UI |
| SVG board with `viewBox` | Clean scaling, accessible | Large rewrite of positions/sprites |
| Canvas / WebGL | Perf for huge boards | Loses DOM `SelectSpace`; biggest rewrite |

**Recommendation:** CSS transform wrapper first (extends the Consortium scale
pref pattern). Revisit SVG only if hit targets or legend scaling remain bad.

Touch target mitigation without redrawing the map:

1. Fit-to-width default so hexes are larger than today’s 0.31× page scale
2. When scale &lt; threshold, first tap selects/highlights, second tap confirms
   (already partly exists via tile confirmation dialog)
3. Optional “space picker list” fallback for accessibility

### Phase D — Cards on mobile

Cards are **pixel layouts** (240px, absolute children, thousands of Less lines).
Do not try to reflow card text into responsive HTML.

| Pattern | Use |
|---------|-----|
| Horizontal snap scroller | Hand, draft, corporation draft |
| Tap → full-screen / 90vh sheet | Read text, play, add resources |
| Scale factor 1.0–1.25 in sheet | Legibility |
| Dense grid of thumbnails (0.45–0.55 scale) | Tableau browse; tap opens sheet |
| Sticky action bar in sheet | Play / Select / Cancel |

Replace hover-magnify with tap-to-open. Keep `Card.vue` renderer; only change
chrome around it.

### Phase E — Action & payment chrome

`WaitingFor` + `PlayerInputFactory` + payment widgets are the turn loop. On
mobile they must be:

- Full width
- Large steppers for steel / titanium / **iridium** / heat / MC
- Primary CTA ≥48px height, thumb-zone (bottom)
- OrOptions as vertical radio list, not cramped horizontal chips
- Confirms as bottom sheets, not tiny dialogs in a zoomed corner

Consortium-specific: iridium is a fourth payment resource with hard-coded paths
in Units/Payment/UI. Mobile payment UI must include it from day one of Phase E
— do not ship a mobile payment form that omits iridium and “fix later.”

### Phase F — Secondary surfaces

| Surface | Mobile treatment |
|---------|------------------|
| Players overview | Compact rows; tap → player sheet (corp + tags + cards) |
| Log | Full-height sheet with virtualized list if needed |
| Colonies | Vertical stack / carousel of colony cards |
| Turmoil | Collapsed summary + expand sheet |
| Moon / Pathfinders | Sub-toggle under Board tab |
| Megastructures | Compact strip; contribute from Act tab or strip sheet |
| Create game / lobby | Separate responsive pass (forms, expansion toggles) |
| Spectator | Same shell, Act tab read-only |

### Phase G — Polish & PWA

- `theme-color`, apple-touch-icon, manifest (installable)
- Turn notification: consolidate empty `sw.js` comment in `ServeAsset.ts` into a
  real optional notification path — only if product wants it
- Reduced motion, dynamic type (at least don’t fight iOS text size on chrome)
- Landscape phone: allow board tab to use width; keep bottom nav or shift to
  side rail

---

## 7. Best-practice checklist (acceptance criteria)

Use as definition of done for “mobile v1”:

| # | Criterion | Source pattern |
|---|-----------|----------------|
| 1 | Playable at 100% page zoom — no required pinch of the document | BGA UX |
| 2 | Board pinch/pan is local to the map viewport | Strategy HUD / map overlay |
| 3 | Primary actions in thumb zone; fixed chrome | Mobile HIG |
| 4 | Interactive targets ≥44×44 CSS px (or spaced ≥24×24 WCAG) | Apple / WCAG 2.2 |
| 5 | No gameplay-critical `:hover` on coarse pointers | BGA touch notes |
| 6 | One job per view; sheets for detail | Mobile IA |
| 7 | Safe-area insets respected | iOS notch / home indicator |
| 8 | Iridium visible and payable in mobile payment UI | Consortium locked design |
| 9 | Desktop layout regression-free (visual + client tests) | Fork hygiene |
| 10 | Manual test matrix: iOS Safari, Android Chrome, tablet, desktop | — |

Validation harness (`tools/consortium/validate.ts`) does **not** measure UX.
Do not cite it as mobile quality evidence.

---

## 8. Technical constraints (why this is hard)

1. **Viewport contract** — `width=1260` is load-bearing for the current
   desktop look. Changing it without a shell breaks assumptions.

2. **Absolute pixel board** — Hex margins in `board_items_positions.less` /
   generated `board_positions.less`, sprite offsets, SVG legend coordinates.
   Scaling must be uniform; per-axis fluid layout is not free.

3. **Card art system** — Fixed 240px card chrome across `cards.less`,
   `cards_v2.less`, `language_hacks.less`. Mobile = scale + container, never
   reflow.

4. **SelectSpace DOM coupling** — Imperative `onclick` on hex nodes. A
   transform wrapper must keep those nodes clickable (watch for
   `touch-action`, overlay intercepts, and confirm dialog positioning).

5. **Hover-dependent features** — Magnify cards, unavailable-card brighten,
   Consortium bridge hover, stacked-card z-index on hover.

6. **Information density** — Full TM + expansions + Consortium exceeds any
   phone viewport; IA change is mandatory, not optional polish.

7. **Iridium payment surface area** — Highest-risk Consortium area; any new
   payment UI must be exhaustive (see project rules on payment hard-coding).

8. **Upstream drift** — Large client refactors diverge from
   terraforming-mars/terraforming-mars. Prefer additive shell + wrappers over
   rewriting shared card/board internals when possible.

---

## 9. Suggested implementation order (shipping slices)

Smallest path to “feels like a game on my phone”:

| Slice | Delivers | Depends on |
|-------|----------|------------|
| **M1** | Flag + viewport + CompactTopBar + BottomNav + tab switcher hosting existing sections | — |
| **M2** | Act tab default on your turn; payment/options restyled full-width | M1 |
| **M3** | BoardViewport pan/zoom + fit; SelectSpace usable | M1 |
| **M4** | Hand carousel + card detail sheet + play from sheet | M1–M2 |
| **M5** | Tableau / others / log / colonies as sheets | M1 |
| **M6** | Create-game + lobby responsive | independent |
| **M7** | PWA polish, touch hover purge, a11y pass | M2–M5 |

M1+M2 alone already remove most “zoom to find End Turn” pain even before the
board viewport is perfect.

---

## 10. Testing strategy

### Automated

- Client component tests for shell tab switching and “your turn → Act tab”
- Payment form tests including iridium steppers at narrow viewport (JSDOM width
  stub)
- Do **not** expect pixel board gesture tests in Mocha; cover math helpers
  (clamp scale, fit-to-viewport) with unit tests

### Manual (required)

| Device | Flows |
|--------|-------|
| iPhone Safari | Place ocean/city, play card with mixed payment, contribute megastructure |
| Android Chrome | Same + browser chrome show/hide (dynamic toolbar) |
| iPad | Board fit, split views if any |
| Desktop | Unchanged PlayerHome; flag off |

Visual check still uses `localhost:8080/cards?search=` for card art; add
`?mobile=1` (or equivalent) for shell QA.

### Metrics (subjective but useful)

- Time-to-complete “play standard project City” on phone before/after
- Count of pinch gestures per turn (goal: ~0 for non-board; board-only when
  inspecting)

---

## 11. Explicitly rejected approaches

| Approach | Why reject |
|----------|------------|
| Only change viewport meta | Layout overflows; still one long desktop page |
| `user-scalable=no` as “fix” | Accessibility harm; masks broken layout |
| Media queries that shrink everything to 50% | Unreadable; same zoom problem |
| Separate native app for v1 | Huge cost; web shell solves the stated pain |
| Redesign card HTML fluidly | Conflicts with art pipeline and i18n hacks |
| Cite validation harness for UX quality | Measures crashes/invariants, not usability |

---

## 12. Effort shape (technical, not calendar)

| Area | Invasiveness | Notes |
|------|----------------|-------|
| Mobile shell + nav | Medium | New Vue chrome; `PlayerHome` composition |
| Viewport + feature flag | Low | Small HTML/CSS + preference |
| Board pan/zoom wrapper | Medium–high | Gesture code + SelectSpace interaction |
| Card sheets / carousel | Medium | Mostly new containers around `Card` |
| Payment / inputs restyle | Medium | Touch targets; iridium must be included |
| Hover purge | Low–medium | Many Less selectors; careful regression |
| Create-game responsive | Medium | Separate form surface |
| Full SVG board rewrite | Very high | Avoid for v1 |

Highest leverage per invasiveness: **M1 shell + M2 Act/payment**, then **M3
board viewport**.

---

## 13. Open questions (flagged unknowns)

1. **Default on vs opt-in** — Auto-enable shell on narrow viewports, or require
   a preference for the first release?
2. **Spectator + teacher mode** — Same tabs, or denser read-only layout?
3. **How much Moon/Venus/Turmoil chrome lives under Board vs More** — product
   taste; affects tab clutter.
4. **Upstream contribution** — Is a mobile shell valuable enough to design for
   upstream merge, or keep Consortium-only?
5. **Offline / PWA install** — Nice-to-have or out of scope for v1?

When uncertain during implementation: prefer keeping desktop untouched and
branching on `mobile-shell` rather than making shared components “half
responsive.”

---

## 14. File map (starting points)

| Area | Paths |
|------|-------|
| Viewport | `assets/index.html` |
| Home composition | `src/client/components/PlayerHome.vue`, `SpectatorHome.vue` |
| Board | `Board.vue`, `BoardSpace.vue`, `SelectSpace.vue`, `styles/board.less` |
| Chrome | `Sidebar.vue`, `TopBar.vue`, `styles/preferences.less`, `styles/player_home.less` |
| Actions | `WaitingFor.vue`, `PlayerInputFactory.vue`, `SelectPayment.vue`, `PaymentForm.vue` |
| Cards | `card/Card.vue`, `SortableCards.vue`, `styles/cards.less`, `styles/cards_v2.less` |
| Prefs | `PreferencesManager.ts`, `PreferencesDialog.vue` |
| Touch title quirk | `WaitingFor.vue` (`isDesktopBrowser`) |

---

## 15. Summary

The client does not have a bad mobile theme — it has **no mobile product**.
The viewport forces a 1260px desktop canvas; the page is a vertical stack of
dense fixed-pixel surfaces; interaction assumes a mouse. Users zoom because
that is the only navigation system they have.

A credible fix is a **flagged mobile shell**: device-width viewport, bottom
navigation, act-first turn loop, board-local pan/zoom, cards as sheets — while
leaving the desktop layout alone. Do it in slices; measure with real devices;
never confuse “runs in Mobile Safari” with “mobile-friendly.”
