# Consortium — Mobile cards (research + plan)

Date: 2026-08-05  
Branch: `cursor/mobile-card-focus-448b`  
Depends on: mobile client P0 shell  

## Research summary (external)

Sources: MTG Arena mobile (Wizards FAQs / State of the Game), Dire Wolf Ark Nova
notes, Papers Please mobile (Lucas Pope), BGA UX guidelines, official TM digital
reviews, Grider/Martin “Usability Lessons From Mobile Board Game Conversions.”

### Patterns that define “top tier”

| Pattern | Who | Takeaway for us |
|---------|-----|-----------------|
| **Browse small / inspect large** | MTG Arena, Ark Nova, official TM | Never require page-pinch to read a card. Tap (or long-press) opens a full detail ritual. |
| **Hand tuck / fan** | MTG Arena | Hand stays compact until tapped; then fans for selection. Battlefield (Table) stays primary. |
| **Horizontal snap carousel** | Papers Please mobile | Natural phone gesture for “documents/cards”; rack of thumbs + large focus item. |
| **Tap = primary, long-press = inspect** | Grider/Martin, Board.fun | Teachable secondary gesture; always give feedback. |
| **Playable at 100% page zoom** | BGA UX | Zoom is for inspection only, not for making the UI usable. |
| **≥40–44px targets** | BGA / HIG | Card tiles need generous tap area, not just the art pixel box. |
| **Do not reflow fixed card art** | Our art pipeline + TM reviews | Official TM still struggles with small text on phones; tap-to-forefront is their answer. We keep `Card.vue` art and **frame** it. |

### Anti-patterns (avoid)

- Shrinking every card until the whole hand fits — unreadable (BGA)
- Relying on `:hover` magnify (our desktop pref) — fails on touch
- Death-scroll of full-size 240px cards in one column (current Empire / setup)
- Official TM’s dense phone UI as a role model — reviews call it cramped; tablet-first

### Principle for Consortium

> Cards stay pixel art. Mobile excellence is **presentation and ritual**, not a
> new HTML card layout.

---

## Target card experience

### Three card sizes

| Size | Width (approx) | Use |
|------|----------------|-----|
| **Thumb** | ~110–130px (scale ~0.5) | Tableau grid browse |
| **Hand** | ~170–190px (scale ~0.75) | Horizontal snap hand / draft |
| **Focus** | ~min(360px, 100vw − 24px) (scale ≥1.0) | Full-screen sheet — readable rules |

### Gestures

| Gesture | Effect |
|---------|--------|
| Tap thumb/hand card | Open **Focus sheet** |
| Tap backdrop / Close / Escape | Dismiss focus |
| Swipe focus (optional later) | Next/prev in current list |
| Long-press (later) | Same as focus if we need hover-help parity |

Play / pay CTAs belong in Turn flows (P1), not in Empire focus v1 — focus is
**inspect first**.

---

## Implementation slices (one at a time)

| Slice | Delivers | Status |
|-------|----------|--------|
| **C1 — Focus sheet** | Tap any Empire card → readable overlay; close affordances | **This PR** |
| **C2 — Hand theater** | Snap carousel + peek; empty/playable states | Next |
| **C3 — Setup/draft theater** | Same focus + carousel in SelectInitialCards / draft | Later |
| **C4 — SelectCard mobile** | WaitingFor card picks use grid + sticky confirm | **This PR** |
| **C5 — Text rules fallback** | Optional plain-language block under art for tiny effect text | Later |

---

## C1 acceptance

1. On mobile Empire, tapping a hand or tableau card opens a focus sheet  
2. Card art scales so width fills ~phone width; text readable without pinch  
3. Close via button, backdrop, Escape  
4. Bottom nav remains usable after dismiss; no body scroll leak  
5. Desktop client unchanged  
6. No change to `Card.vue` art pipeline / codegen  

## Out of scope for C1

- Playing a card from focus  
- Swipe between cards  
- Setup/draft rewiring  
- Reflowing card HTML  
