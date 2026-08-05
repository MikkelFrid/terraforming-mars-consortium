# Consortium — Mobile cards: next-level exploration

Date: 2026-08-05  
Status: **C2★ implemented** — structured Rules panel default; Original secondary  
Audience: product decision + implementation notes  
Related: `26-mobile-cards.md` (C1 focus sheet = art zoom; necessary but not sufficient)

---

## 0. Honest verdict on C1

C1 (tap → scaled `Card.vue`) stops **page-pinch**. It does **not** make cards
top-tier.

It is the Slay-the-Spire / early-TM-digital failure mode with better framing:
same dense 240px facsimile, just bigger. Effect text that was 9px art chrome
is still small prose inside a painting. Hearthstone’s phone team rejected that
path explicitly — they rebuilt screens for the device, then made it *feel*
like the same game.

**Next-level cards mean a second representation of the same rules data**, not a
second zoom level on the first representation.

---

## 1. What “top tier” actually means (research)

| Source | Lesson |
|--------|--------|
| **Hearthstone phone** (Blizzard) | Phone UI was a **near-complete overhaul**, not a port. Goal: best experience *per platform*, still one game. Prototyped until phone felt equal to PC. |
| **Hearthstone card design** | If a player doesn’t understand a card on first read, **change the card** — readability is a design constraint, not a CSS problem. |
| **Slay the Spire mobile** | Faithful port; **#1 complaint = text readability**. “Big Text” prefs don’t fix density designed for monitors. |
| **MTG Arena mobile** | Adaptive UI: tuck/fan hand, tap-hold inspect. Still art-first, but **inspect is a first-class ritual**, not accidental zoom. |
| **Papers Please mobile** | Carousel + rack: phone got a **new rhythm** for documents, not shrunk desktop desk. |
| **BGA UX** | Playable at 100% scale; don’t shrink until unusable; scroll instead. |
| **Official TM digital** | Tap card to forefront + “i” overlay. Reviews still call phone UI **cramped / tablet-first**. Don’t copy as the ceiling. |
| **Progressive disclosure (IxDF)** | Primary UI shows what you need *now*; advanced detail on request. |
| **TM iconography (Sweeton)** | TM’s strength is a **consistent icon language** (production box vs immediate gain). That language can travel without the cardboard layout. |

**Anti-role-models for us:** scale-the-PNG ports.  
**Role-models:** Hearthstone’s “redesign per platform,” Papers Please’s “new
manipulation rhythm,” Arena’s “inspect ritual.”

---

## 2. What a TM card actually is (codebase truth)

A card is **three sources of truth** glued into one 240px HTML face:

| Layer | Where | Job |
|-------|--------|-----|
| **Engine** | `behavior` / `play()` / `action()` | Legality (server) |
| **Icon DSL** | `metadata.renderData` (CardRenderer) | What players “read” as icons |
| **Prose** | `metadata.description` (~83% of cards) | Parenthetical English |

Plus chrome: cost, tags, requirements, VP, resources-on-card, type color,
expansion badge, disabled/used state (`Card.vue` stack).

Hard facts (~1058 cards):

- ~177 cards have **icons but no top-level description** — text-only UI cannot
  lean on description alone
- Icon DSL has ~80 item kinds + production boxes + effect cause→effect rows
- `CARD_HELP_TEXT` covers **14** FAQ cards only (English, not i18n)
- **No simplified card view exists** today — only scale/hover the same face
- SelectCard submits **names**; art is for humans, not the protocol

Implication: we already have structured data to build a **mobile-native rules
panel**. We have been choosing not to use it.

---

## 3. The real problem (not “cards are small”)

On phone, a TM card must answer **different questions in different contexts**:

| Context | Player question | What the 240px face optimizes for |
|---------|-----------------|----------------------------------|
| Hand, your turn | Can I play this, and is it worth it? | Physical table recognition |
| Tableau scan | What triggers / what do I have? | Dense icon walls |
| Draft / setup | Identity + long-term plan | Full face comparison |
| Opponent inspect | Threats / tags / VP | Same dense face |
| Learn mode | What does this *mean*? | Icons + tiny parentheses |

The physical card is a **compromise object** for all of those at once. Desktop
tolerates that. Phone does not.

Top-tier mobile **splits the compromise**:

1. **Identity token** — instant recognition (type color, cost, tags, name)
2. **Decision panel** — context-aware: playability, cost, “why blocked”, payoff
3. **Rules panel** — structured, readable, generated from `renderData` + prose
4. **Relic art** — optional full `Card.vue` for nostalgia / verification

C1 only delivered a weak form of (4).

---

## 4. Concept directions (from conservative → radical)

### A. Art-first + better frame (current trajectory)

Scaled `Card` + carousel + maybe pinch inside sheet.

- Pros: cheap, faithful, no i18n explosion  
- Cons: ceiling is “readable painting,” not “phone product”  
- Verdict: **table stakes**, not next-level

### B. Dual face (recommended north star)

**Browse token** + **Focus = structured panel**, with “Show original card” as
secondary.

Focus layout (sketch):

```
┌─────────────────────────────────┐
│ CHARTER SYNDICATE      CORP     │
│ [Earth][Structure][★]   cost —  │
├─────────────────────────────────┤
│ START                           │
│  36 M€                          │
├─────────────────────────────────┤
│ EFFECT                          │
│  Structure / Prospecting → ×2   │
│  when meeting requirements      │
│  (not for scoring)              │
├─────────────────────────────────┤
│ [ Original card ]               │
└─────────────────────────────────┘
```

Data path: walk `renderData` → lines of **large icons + labels**; append
`description`; append help if any.

- Pros: readable; uses existing DSL; keeps original for audit; matches
  Hearthstone “best per platform”  
- Cons: need renderer→panel mapper; i18n for new labels; ~177 icon-only cards
  need generated lines  
- Verdict: **this is the real C2/C3 product**, not another carousel polish

### C. Decision-first cards (hand during Turn)

When it is your turn and the verb is “Play card”, don’t show a museum of art.
Show a **decision list**:

```
Scaffold Yard          8 M€   ✓ affordable
  Discount megastructure segments
  [tags…]

Joint Venture         12 M€   ✗ need 2 earth tags
```

Tap row → structured focus (B). Play CTA in thumb zone.

Official TM / upstream issue #983 already argued: playable vs grey + **reason
labels**, sort unplayable last. We should beat that.

- Pros: answers the turn question; huge speed win; feels native  
- Cons: needs canPlay reasons exposed cleanly to client (some already via
  `isDisabled` / warnings)  
- Verdict: **pair with Turn cockpit (P1)**; cards and actions merge

### D. Context skins (one card, many outfits)

| Skin | Shows |
|------|--------|
| Hand / play | Cost, requirements status, effect summary, Play |
| Tableau | Triggers (“Action: …”, “Effect: …”), resources on card, used-this-gen |
| Draft | Tags, VP, one-line strategy hook |
| Opponent | Tags, VP, threatening actions only |

Same data, different templates. Physical cardboard cannot do this; digital can.

- Verdict: high leverage after B exists

### E. Generated plain language from CardRenderer

For every render node, emit a sentence fragment (“Increase heat production 3”,
“Place ocean”, “Opponent loses 2 plants”). Build a glossary for icons
(locales already have iconography help JSON in some languages).

- Pros: solves the 177 description-less cards; a11y / screen readers  
- Cons: hardest; must not drift from engine behavior; production-box vs
  immediate-gain must stay distinct (Robotic Workforce)  
- Verdict: **do as infrastructure under B**, not as a separate vague “text
  mode”

### F. True radical: abandon card metaphor in play

List / chip / ticket UI with Mars theme; art only in collection/codex.

- Pros: maximum clarity  
- Cons: loses TM identity; community backlash risk; still need recognition  
- Verdict: too far for Consortium fork unless we brand it as a distinct
  “Commander mode” — not default

---

## 5. What must stay visual vs what must become panel

### Must stay recognizable (token / header)

- Name + type color (or corp logo mark)
- Tags
- Cost (+ discount)
- Requirements status
- Resources on card
- VP pip
- Disabled / selected / used-this-gen

### Must become large, structured, phone-native

- Effect / action / production content (from `renderData`)
- Requirements spelled out (“Oxygen ≥ 4%”)
- Playability reason (“Need iridium”, “Max 1 city”)
- Description prose at **readable type size** (16–18px body)
- Consortium-specific: iridium gates, structure/prospecting tags, megastructure
  segment discounts — called out explicitly, not buried in 9px parentheses

### Optional

- Full original `Card.vue` behind “Original”
- Flavor / expansion lore
- CardHelp FAQ block

---

## 6. Consortium-specific card UX (don’t bolt on)

Iridium and new tags change **decision panels**, not just icons:

- Cost line: `12 M€` or `8 M€ + 1 Ir` when mixed payment is relevant
- Requirement chips: iridium floor on keystone-gated content
- Tag emphasis: Structure / Prospecting as first-class as Building / Space
- Unplayable reason: `Missing iridium` vs generic grey
- Siderophile Extraction: UI must **not** imply building/workforce synergy

If the mobile card system doesn’t make iridium obvious, Consortium feels broken
on phone even when rules are correct.

---

## 7. Proposed product north star (one sentence)

> On mobile, a card is a **decision object with a structured rules panel**,
> optionally backed by the classic face — not a zoomed photograph of the
> desktop card.

---

## 8. Revised slice order (replace art-zoom-as-endgame)

| Slice | What | Why |
|-------|------|-----|
| **C1** | Focus sheet = scaled art | Done — pinch stopgap |
| **C1.5** | Keep C1 as “Original card” tab inside focus | Cheap bridge |
| **C2★** | **Structured focus panel** from `renderData` + description | **Done** — Rules available; **Original is default** (player preference) |
| **C3★** | **Hand decision list** in Turn / Play flow (playable reasons) | Where cards matter most |
| **C4** | Browse tokens (not mini full cards) in Empire / draft | Density without unreadability |
| **C5** | Setup/draft theater using tokens + C2 panel | Same system everywhere |
| **C6** | `renderData` → prose generator + i18n glossary | A11y + icon-only cards |
| **C7** | Context skins (tableau vs hand vs opponent) | Polish |

★ = the forks that leave “lot of the original” behind.

C2 carousel polish **without** structured panel would be another incremental
miss — skip it as a headline goal.

---

## 9. Risks and open questions

1. **Fidelity:** Panel must not simplify away production-box semantics.  
2. **Drift:** Icons say X, `behavior` does Y — panel should prefer structured
   renderData + link to original for disputes.  
3. **i18n:** New panel labels need keys; descriptions already partially
   translated; help text today is English-only.  
4. **Scope:** Full mapper for 80 render item types is large — ship **MVP
   panel** covering the most common items (resources, production, tags,
   arrows, OR, tiles, globals, iridium) and fall back to original card for
   exotic corps.  
5. **Upstream:** Dual representation is Consortium-valuable and potentially
   upstream-friendly if kept clean.

Open product calls:

- Default focus tab: **Original** (shipped; Rules on demand).  
- During Play: list-first or carousel-first? (Recommend list-first — C3.)  
- How much corp logo / art identity in the token? (Recommend strong type color
  + logo mark for corps.)

---

## 10. Recommendation

C2★ ships the dual representation (Rules default, Original secondary).

Next:

1. **C3★** Hand decision list in Turn / Play (playable reasons, not museum)
2. Browse tokens (C4) once hand list proves the panel
3. Optional prose generator (C6) for icon-only cards

That is the Hearthstone lesson applied to TM: **same game, different best
surface per device** — and the device is a phone, not a tiny monitor.
