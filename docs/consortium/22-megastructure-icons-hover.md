# Consortium — Megastructure icons + bidirectional hover

Branch: `cursor/megastructure-icons-hover-eb6d`  
Date: 2026-07-31

## Changes

- Outcome strip uses existing resource icons (heat, plants, M€, titanium,
  iridium, temperature, space tag, VP) via additive `MegastructureModel.outcomeChips`
- Plain `outcome` string kept as tooltip / accessibility fallback
- Hover locked (or any `bridge`-tagged) frontier space → highlight matching
  Bridge card (reverse of Bridge → map highlight)
- Player cubes in segment cells centered (reset `.board-cube` absolute margins)
- Keystone cell shows iridium icon + count

## Save safety

- Additive API only (`outcomeChips`); no serialize / GameOptions changes
- Existing DB games reload unchanged
