# Consortium — Milestone / award medal art

Branch: `cursor/consortium-ma-medals-eb6d`  
Date: 2026-07-31

## Problem

Consortium board MAs (Mason, Pathfinder, Assayer, Underwriter, Cartographer,
Refiner) had no `assets/ma/<slug>.png` and no `@ma-name` CSS entries. The
player-home score chips still rendered under each invisible card, so the row
looked horizontally broken next to Venus MAs that did have art.

## Fix

- Generator: `build_consortium_ma_medals()` in `tools/consortium-art/build_assets.py`
  - Milestone chrome from `architect.png` + threshold digit patches
  - Award chrome from `founder.png` + new centre glyphs
- CSS: slugs added to `@ma-name` in `src/styles/player_home.less`

Regenerate with:

```bash
python3 tools/consortium-art/build_assets.py
```
