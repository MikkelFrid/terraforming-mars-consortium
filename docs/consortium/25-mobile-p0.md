# Consortium — Mobile client P0

Date: 2026-08-05  
Branch: `cursor/mobile-client-p0-448b`  
Vision: `docs/consortium/24-mobile-ui.md` (on analysis PR; P0 implements the foundation slice)

## Goal

Ship the **mobile presentation shell** without rewriting turn flows yet:

- Detect when to use the mobile client (`auto` / `on` / `off` + `?mobile=1|0`)
- Switch viewport to `device-width` while the shell is mounted
- HUD + bottom nav modes: Turn · Table · Empire · Rivals · More
- Extract shared `turnSession` (submit / poll / notify) used by `WaitingFor`
- Desktop `PlayerHome` unchanged when mobile is off

## Not in P0

- PlayCardFlow / PlaceTileFlow (still desktop WaitingFor + PlayerInputFactory inside Turn)
- Board camera gestures (Table uses fit-scale + scroll)
- Card focus sheets, async push, create-game wizard

## How to try

1. Open a player URL on a phone, or desktop with `?mobile=1`
2. Or Settings → Mobile client → On (reload player view)
3. Switch tabs; take a turn from **Turn**; browse board on **Table**
4. **More → Use desktop layout** forces `mobile_client=off` and reloads

## Files

| Area | Path |
|------|------|
| Detection / viewport | `src/client/utils/mobileClient.ts` |
| Turn I/O | `src/client/utils/turnSession.ts` |
| Shell | `src/client/components/mobile/*` |
| Styles | `src/styles/mobile.less` |
| Fork | `src/client/components/App.vue` |
| Pref | `PreferencesManager` `mobile_client` |

## Next

**P1 — Turn cockpit:** verb list from OrOptions, PlayCardFlow, Pay sheet with iridium.

---

## Playtest evaluation (2026-08-05)

Method: real 2p Consortium game via API → Playwright iPhone 13 viewport
(`390×664`) with `?mobile=1`. Alice through research + preludes into **action**.
Screenshots under `/opt/cursor/artifacts/screenshots/mobile-*.png`.

### Verdict

**P0 shell works and is a clear upgrade over desktop-on-phone** (`mobile=0` still
forces `width=1260` and the old zoom hunt). It is **not** yet a top-tier mobile
game: Turn is still a nested radio form; Table is a scaled desktop board; setup
is a card death-scroll.

Score vs ambition (vision doc): **foundation ~6/10, product ~3/10**.

### What worked

| Check | Result |
|-------|--------|
| Viewport | `device-width` while shell mounted; desktop restored with `?mobile=0` |
| Shell chrome | Sticky HUD + 5-tab bottom nav (55×78px targets — OK) |
| Your-turn cue | Orange **YOUR TURN** + Turn tab badge |
| Mode switch | Turn / Table / Empire / Rivals / More all mount without crash |
| Iridium | Shown in Rivals rows; HUD includes iridium when Consortium on |
| Fork | Desktop layout intact when mobile forced off |

### Failures / gaps (ordered by player pain)

1. **Turn = desktop OrOptions** — radio nest, raw ids (`[bridge-0]`), Contribute
   expanded by default. Feels like a form, not a turn cockpit (blocks “top tier”).
2. **Setup** — full-size cards stacked; no wizard; Start buried; no bottom nav
   until corp is played.
3. **Table** — fit-scale + scroll only; hex hit targets still small; megastructure
   strip still says “Hover a Bridge…” (touch-hostile copy).
4. **HUD** — ~141px tall; resources wrap unevenly; chrome eats vertical space
   before content (CSS grid tweak applied after playtest).
5. **Empire** — desktop `Card` at ~0.85 scale; text still hard to read; no focus
   sheet / play-from-hand.
6. **Rivals** — compact rows OK as glance; no drill-in sheet yet (documented).
7. **sw.js 404** — noise in console (pre-existing empty SW registration).

### Comparison shot

- `mobile-20-turn-actions.png` — mobile Turn (usable without pinch)
- `mobile-50-desktop-same-phone.png` — same device, desktop client (zoom required)

### P1 priority after this playtest

1. Replace OrOptions radios with verb tiles + step flows  
2. Setup wizard (corp → prelude → projects) with sticky confirm  
3. Board camera (pan/zoom) + remove hover-only megastructure affordances  
4. Card focus sheet from Empire / hand  
