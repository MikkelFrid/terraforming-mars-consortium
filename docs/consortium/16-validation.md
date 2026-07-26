# Consortium — Phase 16: Full-game validation

Branch: `feat/consortium-harness-honesty`
Date: 2026-07-26
Harness: `tools/consortium/validate.ts` (TypeScript via `npx tsx`)

## What this harness can and cannot tell us

**This harness measures crashes and state invariants.** It drives solo
games to `Phase.END` through real `player.process` calls and fails the
run if an exception escapes or an invariant breaks.

It **cannot** tell us whether Consortium is balanced. Ocean counts,
bridge completion rates, game length, card play rates, and similar
numbers reflect the actor's choice distribution, not the game's design.
A preference-weighted actor that scores megastructure contribute at 5.5
and standard projects at 1.5 will starve oceans and over-complete bridges;
that is harness bias, not evidence about the map or the economy.
Do not cite this document for balance decisions.

Default actor mode is **`random`**: uniform choice over legal options at
every decision point. Mode **`weighted`** keeps the old heuristic for
comparison only.

## Method

- Solo games to `Phase.END`, seed base **42000**
- **200** games per configuration × mode
- Modes run: `random`, `weighted`
- Retries alternate `OrOptions` on actor payment failures before counting a crash
- After every step: iridium bank bounds, megastructure segment counts,
  chasm/locked tile bans
- Keystone placements assert minimum iridium on the payment
- End of every game: serialize → deserialize → serialize without loss

## Crashes

Zero crashes is the primary pass criterion.

| Mode | Config | Games | Crashes | Notes |
|------|--------|------:|--------:|-------|
| random | baseline-no-consortium | 200 | 0 | ok |
| random | consortium | 200 | 0 | ok |
| random | consortium+corporate-era | 200 | 0 | ok |
| random | consortium+prelude | 200 | 0 | ok |
| random | consortium+colonies | 200 | 0 | ok |
| random | consortium+turmoil | 200 | 0 | ok |
| weighted | baseline-no-consortium | 200 | 0 | ok |
| weighted | consortium | 200 | 0 | ok |
| weighted | consortium+corporate-era | 200 | 0 | ok |
| weighted | consortium+prelude | 200 | 0 | ok |
| weighted | consortium+colonies | 200 | 0 | ok |
| weighted | consortium+turmoil | 200 | 0 | ok |

**Zero crashes across all configurations and modes.**

## Invariants

These must hold regardless of how well the actor plays:

1. No exceptions in any configuration or mode
2. Iridium bank stays in `[0, 28]`
3. No megastructure exceeds its segment count (or fills with gaps)
4. No keystone is placed without the minimum iridium payment
5. No tile is placed on a chasm that has not been converted
6. No locked frontier space receives a tile before its bridge completes
7. Serialization round-trips at end of game without loss

| Mode | Config | Games | Invariant failures |
|------|--------|------:|-------------------:|
| random | baseline-no-consortium | 200 | 0 |
| random | consortium | 200 | 0 |
| random | consortium+corporate-era | 200 | 0 |
| random | consortium+prelude | 200 | 0 |
| random | consortium+colonies | 200 | 0 |
| random | consortium+turmoil | 200 | 0 |
| weighted | baseline-no-consortium | 200 | 0 |
| weighted | consortium | 200 | 0 |
| weighted | consortium+corporate-era | 200 | 0 |
| weighted | consortium+prelude | 200 | 0 |
| weighted | consortium+colonies | 200 | 0 |
| weighted | consortium+turmoil | 200 | 0 |

**All invariants held in every game.**

## Why balance-shaped metrics are omitted

Earlier drafts of this document reported ocean counts, bridge completion
rates, mean generations, and card playability. Those numbers looked like
balance findings; they were actor artifacts. They are intentionally not
reported here. Use human playtests or a purpose-built evaluation suite
if you need design signals.

## Rerun

```bash
npx tsx tools/consortium/validate.ts --games=200 --modes=random,weighted --seed-base=42000 --out=docs/consortium/16-validation.md
```

Default mode when `--mode` / `--modes` is omitted: `random`.
