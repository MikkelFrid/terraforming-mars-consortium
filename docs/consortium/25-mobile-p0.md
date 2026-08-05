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
