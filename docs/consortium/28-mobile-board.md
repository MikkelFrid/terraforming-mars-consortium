# Consortium — Mobile board (Table) brainstorm

Date: 2026-08-05  
Status: **B0 + B1★ shipped** on `cursor/mobile-card-focus-448b` (camera + touch megastructure copy)  
Depends on: mobile shell P0 (`25-mobile-p0.md`), card focus C1–C2  
Audience: product decision + implementation notes

---

## 0. Honest verdict on Table today

Table is still **desktop Mars, shrunk to fit width, then scrolled**.

That means:

- Hex hit targets shrink with the board (~0.4–0.55× on a phone)
- The player pans the *page*, not a camera on the map
- Megastructure strip still says “Hover a Bridge…” (desktop affordance)
- Global params live in the HUD *and* as tracks around the board art — redundant noise
- Consortium frontier locks / chasms / crater fields are hard to read at fit-scale

P0 Table is a **map thumbnail you can scroll**. It is not a place-tile surface.

---

## 1. What “top tier” board UX looks like (research)

| Source | Lesson |
|--------|--------|
| **MTG Arena mobile** | Battlefield stays primary; camera is intentional, not accidental browser zoom |
| **Root / digital boardgames** | Pan+pinch on the board surface; UI chrome stays put |
| **BGA** | Playable at 100% page zoom; board has its own zoom |
| **Official TM digital** | Tap hex to select; still cramped on phone — don’t copy as ceiling |
| **Google Maps / strategy phones** | One finger pan, pinch zoom, double-tap zoom; inertia; clamp bounds |
| **Slay the Spire map** | Abstract the path when density fights the device — but TM *is* the hexes |

**Anti-role-model:** pinch the whole website.  
**Role-model:** board is a **camera viewport**; chrome (HUD/nav) is outside the camera.

---

## 2. Player jobs on Table (different questions)

| Job | Frequency | Needs |
|-----|-----------|-------|
| **Orient** — where am I, what’s claimed | High | Overview + color ownership |
| **Place** — pick a legal hex | Medium (your turn) | Large targets, legality filter, confirm |
| **Inspect** — tile bonuses, adjacency, iridium crater | Medium | Tap → sheet (like cards) |
| **Megastructure** — contribute / see bridge progress | Medium (Consortium) | Dedicated strip, no hover |
| **Plan** — oceans/temp/O2 + open spots | Low–medium | Params in HUD already; board tracks optional |

Desktop board tries to serve all five at once. Phone should **mode-switch**:

1. **Browse camera** (default Table) — pan/zoom map  
2. **Place mode** (from Turn / SelectSpace) — legal hexes emphasized, illegal muted  
3. **Inspect sheet** — tap hex → bottom sheet (bonuses, owner, terrain type)

---

## 3. Concept directions

### A. Fit-scale + scroll (current)

Cheap. Ceiling: thumbnail.  
**Verdict:** stopgap only.

### B. Board camera (recommended north star)

A `BoardCamera` wrapper around the existing SVG/DOM board:

- Touch: one-finger pan, pinch zoom, optional double-tap zoom  
- Clamp to board bounds with padding  
- Min zoom ≈ fit-width; max zoom ≈ ~1.4–1.8× design so hexes are tappable (~44px)  
- HUD + bottom nav **outside** the camera (already true if shell scroll is fixed)  
- SelectSpace attaches to camera coordinates, not page scroll

- Pros: keeps board art/engine; matches player mental model  
- Cons: gesture math; click vs pan discrimination; Consortium board is wide  

### C. Dual board: overview chip + focus region

Mini-map or “sector chips” (Massif / Frontier / Bridge) that jump the camera.  
Useful for Consortium’s hybrid board growth.

- Pros: orients fast on a large map  
- Cons: extra chrome; only pays off with camera (B)

### D. Abstract placement grid (radical)

Replace art with a clean hex lattice for Place mode only.  
**Verdict:** too far from TM identity for v1; keep as escape hatch if camera fails.

---

## 4. Consortium-specific board UX (don’t bolt on)

| Feature | Mobile need |
|---------|-------------|
| **Chasms** (`RESTRICTED`) | Distinct “blocked” treatment at all zooms — not just tiny lock icons |
| **Crater fields** | One-tap “yields iridium once” in inspect sheet |
| **Highlands** | Clear “no ocean” cue in place + inspect |
| **Frontier / Bridge** | Unlock state visible without hover; contribute CTA in thumb zone |
| **Megastructure strip** | Always touch: tap Bridge → contribute sheet; delete “Hover…” copy |

If Table doesn’t make **iridium craters** and **bridge unlock** obvious, Consortium feels broken on phone even when rules are correct.

---

## 5. Place-tile flow (ties to Turn P1)

When `waitingFor` is SelectSpace:

1. Auto-switch to **Table** (or show a “Place on map” banner that jumps there)  
2. Enter **Place mode**: legal hexes pulse / illegal dimmed  
3. Tap hex → confirm sheet (“Place ocean here?”) with Undo-friendly cancel  
4. No reliance on desktop `onclick` hover outlines alone  

Until this exists, Turn cockpit alone cannot feel finished.

---

## 6. Proposed slice order (board)

| Slice | What | Why |
|-------|------|-----|
| **B0** | Delete hover copy; tap megastructure contribute from Table | **Done** — tap Bridge highlight + larger Contribute |
| **B1★** | `BoardCamera` pan + pinch + clamp | **Done** — Table uses camera; megastructures sit below |
| **B2★** | Place mode + legal hex emphasis + confirm | Makes Turn placement mobile |
| **B3** | Hex inspect sheet (terrain, bonuses, owner) | Parity with card focus |
| **B4** | Overview / sector jump for Consortium width | Orientation |
| **B5** | Terrain legend + iridium crater callouts | Consortium clarity |

★ = forks that leave “scaled desktop board” behind.

---

## 7. Risks

1. **Hit testing** — current spaces use DOM `onclick`; camera transform must preserve targets  
2. **Performance** — large Consortium SVG under CSS transform is usually fine; watch pinch jank  
3. **Ares / Moon / Venus** — other boards must inherit the same camera wrapper  
4. **Desktop** — camera should be mobile-only; desktop PlayerHome untouched  
5. **SelectSpace timing** — don’t steal pan gestures when the player intends to tap

---

## 8. Recommendation

B0 + B1★ are in. Next:

1. **B2★** Place mode + legal hex emphasis + confirm from SelectSpace  
2. **B3** Hex inspect sheet  
3. **B4** Sector jump for Consortium width  

Do **not** spend a cycle on prettier scrollbars around fit-scale — that path is gone.

**North star:** On mobile, the board is a **camera on Mars**, not a screenshot in a scroll view.
