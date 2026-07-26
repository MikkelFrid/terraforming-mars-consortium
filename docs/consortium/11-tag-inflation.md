# Consortium — Tag inflation audit (Structure + Prospecting)

Date: 2026-07-26  
Context: Phase 02 listed five consumers that count distinct tags. Adding
`Tag.STRUCTURE` and `Tag.PROSPECTING` to the live deck (when Consortium is on)
changes their strength. **No code changes in this phase** — recommendations
only for phase 8 balance.

`game.tags` is the set of tags present on cards in the shuffled decks
(`Game` constructor). Consortium project cards inject Structure and Prospecting
into that set whenever the module is enabled.

`tagsInGame()` = `game.tags` minus EVENT / CLONE / WILD. Distinct-count modes
cap at that maximum (except Odyssey, which can exceed by one).

---

## 1. Diversifier (milestone)

| | |
|--|--|
| **What it does** | Claim when the player has **≥ 8** different tags (`distinctCount('milestone')`). |
| **Where** | `src/server/milestones/Diversifier.ts`; Hellas board MA; also modular random pool. |
| **Numeric change** | Threshold unchanged at 8. With Consortium on, `tagsInGame()` rises by up to **+2**, so the pool of reachable distinct tags is larger. Wilds still fill gaps up to the new maximum. Practically: easier to hit 8 because two new tag types exist in the deck and count when played. |
| **Recommendation** | Raise Diversifier to **9** when Consortium is in the game, **or** leave at 8 and accept a softer Hellas / modular claim. Prefer a Consortium-aware threshold only if other fan tags stay rare; otherwise bump globally to 9. |

## 2. Diversity (global event)

| | |
|--|--|
| **What it does** | Gain 10 M€ if `distinctCount('globalEvent') + influence ≥ 9`. Global-event mode **does not** apply wild tags. |
| **Where** | `src/server/turmoil/globalEvents/Diversity.ts` (Turmoil). |
| **Numeric change** | Threshold stays 9. Two more tag types make non-wild diversity easier; influence still substitutes. Without Consortium, many tables already struggle to hit 9 without influence — with Consortium, Structure + Prospecting are two more “real” tags toward the check. |
| **Recommendation** | Raise the bar to **10** when Consortium (or any +2 tag expansion) is on; alternatively keep 9 and treat the GE as a more common payout. Do not change influence math. |

## 3. Interplanetary Trade (promo project)

| | |
|--|--|
| **What it does** | On play: +1 M€ production per distinct tag the player has, **including this card’s Space tag** (`distinctCount('default', Tag.SPACE)`). |
| **Where** | `src/server/cards/promo/InterplanetaryTrade.ts`. |
| **Numeric change** | If the player already holds Structure and/or Prospecting when playing IT, production is **+1 or +2** higher than the pre-Consortium ceiling for the same tableau shape. Max theoretical distinct also rises with `tagsInGame()`. Cost 27 / 1 VP unchanged. |
| **Recommendation** | No mandatory nerf. Optional: ignore Structure/Prospecting in IT’s count, or raise cost by 2–3 M€. Prefer leaving it and watching for “IT + Consortium tag engine” spikes in playtests. |

## 4. Aridor (colonies corporation)

| | |
|--|--|
| **What it does** | When the player gains a **new** non-wild, non-event tag type, +1 M€ production. |
| **Where** | `src/server/cards/colonies/Aridor.ts`. |
| **Numeric change** | First Structure card and first Prospecting card each trigger **+1 M€ production** — up to **+2** lifetime production vs a game without those tags. No change to starting M€ or colony action. |
| **Recommendation** | Accept as intentional synergy with Consortium, **or** exclude Structure/Prospecting from Aridor’s `processTags` when evaluating fan balance. Do not raise Aridor’s starting M€ downward without playtest data. |

## 5. Agricola Inc (community corporation)

| | |
|--|--|
| **What it does** | End-game VP per tag type in `game.tags` (minus wild/event/clone): **−2 / 0 / +1 / +2** for 0 / 1–2 / 3–4 / 5+ of that tag. |
| **Where** | `src/server/cards/community/AgricolaInc.ts`. |
| **Numeric change** | Consortium adds **two scorable tag types**. A player with **zero** Structure and **zero** Prospecting takes **−4 VP** purely from those empty buckets. Collecting 1–2 of each is VP-neutral; 3–4 yields +1 each. This is the sharpest swing of the five consumers: Agricola is **punished** for ignoring Consortium tags and **rewarded** for farming them. |
| **Recommendation** | Highest priority for phase 8. Options: (a) exclude Structure/Prospecting from Agricola’s `scorableTags` unless the player has at least one Consortium card; (b) leave as-is so Agricola is a Consortium-aware corp; (c) soften empty-bucket penalty to −1 for fan tags. Prefer **(b)** only if Agricola is rare at tables; otherwise **(a)** or **(c)**. |

---

## Summary table

| Consumer | Direction with +2 tags | Suggested phase-8 move |
|----------|------------------------|-------------------------|
| Diversifier | Easier claim | Consider threshold 9 |
| Diversity GE | Easier 10 M€ | Consider threshold 10 |
| Interplanetary Trade | Stronger when tags held | Watch; optional +cost |
| Aridor | Up to +2 M€ prod | Accept or exclude fan tags |
| Agricola Inc | −4 VP if ignored | Exclude fan tags or soften empty penalty |

No thresholds were changed in phase 10.
