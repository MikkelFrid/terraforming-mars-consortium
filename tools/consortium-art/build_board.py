"""
Consortium board generator.

Builds Consortium map variants from the repository's own assets and pure
geometry. Run from the repository root:

    python3 tools/consortium-art/build_board.py

Requires Pillow + numpy (procedural planet). No mars.png sampling, no EDSR.

Produces (shared geometry — all variants use the same hex positions):
    assets/board/mars_consortium.png   (2× bitmap; CSS paints at 891×860)
    src/styles/board_positions.less
    src/server/boards/consortiumSpaces.json              (Massif)
    src/server/boards/consortiumRiftSpaces.json
    src/server/boards/consortiumArchipelagoSpaces.json
    assets/consortium/maps/massif.png                    (terrain preview)
    assets/consortium/maps/rift.png
    assets/consortium/maps/archipelago.png

Variants differ only in terrain overlays (chasms / craters / highlands /
oceans / frontier lock arcs). Hex radius, pitch and CSS ids stay identical.
Previews composite the shared Mars disc with per-space hex tiles so the
rulebook and lobby can show the three maps distinctly.

Board art contract: hex coordinates / LESS / JSON are geometry, not paint.
Logical layout stays 891×860. The PNG is 2× denser; CSS uses
background-size so placements do not move. Planet + chrome are fully
generated — we do not upscale or restyle the official Tharsis mars.png.
"""

from __future__ import annotations

import json
import math
import os
import sys
from PIL import (
    Image,
    ImageDraw,
    ImageEnhance,
)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _board_chrome import draw_chrome  # noqa: E402
from _board_planet import render_planet  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MARS_SRC = os.path.join(ROOT, 'assets', 'board', 'mars.png')  # size reference only
MARS_DST = os.path.join(ROOT, 'assets', 'board', 'mars_consortium.png')
LESS_DST = os.path.join(ROOT, 'src', 'styles', 'board_positions.less')
JSON_DIR = os.path.join(ROOT, 'src', 'server', 'boards')
PREVIEW_DIR = os.path.join(ROOT, 'assets', 'consortium', 'maps')

N = 6                       # map radius -> 3N^2+3N+1 = 127 spaces
SECTORS = [90.0, 210.0, 330.0]
PITCH_X, PITCH_Y = 49, 41
HEX_W, HEX_H = 46, 50
# Shifted (+7,+26) from the first Consortium OFFSET so the hex field centres
# on the Tharsis chrome / HTML O2·temp pin frame (not up-left of it).
OFFSET_X, OFFSET_Y = 144, 160

HEX_ASSET = {
    'land': 'hex_black.png',
    'ocean': 'hex_blue.png',
    'chasm': 'hex_chasm.png',
    'crater': 'hex_crater_field.png',
    'highland': 'hex_highland.png',
}

# ---------------------------------------------------------------------------
# Variant terrain recipes
# ---------------------------------------------------------------------------
#
# Massif     — balanced default (legacy layout).
# Rift Basin — wider chasm belts, few core craters, clustered highlands,
#              rich frontier crater fields (iridium behind bridges).
# Archipelago — more scattered highlands, even core craters, narrower
#              chasms, thinner frontier (structure / foundation play).

VARIANTS = {
    'massif': {
        'json': 'consortiumSpaces.json',
        'preview': 'massif.png',
        'chasm_half': 45.0,
        'highlands': [(0, -3), (1, -3), (0, -2), (-3, 1), (-3, 2), (-2, 1)],
        'core_craters': [(4, -2), (-2, 4), (-2, -2)],
        'oceans': [(2, -4), (3, -4), (2, -3), (3, -3), (4, -3),
                   (2, -2), (3, -2), (1, -1), (2, -1), (3, -1),
                   (1, 0), (2, 0), (0, 1)],
        'frontier_craters_per_sector': 3,
    },
    'rift': {
        'json': 'consortiumRiftSpaces.json',
        'preview': 'rift.png',
        'chasm_half': 58.0,
        # One highland massif in the south-west — fight for foundation.
        'highlands': [(-2, 2), (-1, 2), (-3, 2), (-2, 1), (-1, 1), (-3, 3)],
        # Almost no early iridium in the core.
        'core_craters': [(0, -3)],
        'oceans': [(2, -4), (3, -4), (2, -3), (3, -3), (4, -3),
                   (2, -2), (3, -2), (1, -1), (2, -1), (3, -1),
                   (1, 0), (2, 0), (3, 0)],
        'frontier_craters_per_sector': 4,
    },
    'archipelago': {
        'json': 'consortiumArchipelagoSpaces.json',
        'preview': 'archipelago.png',
        'chasm_half': 34.0,
        # Nine scattered highland "islands".
        'highlands': [
            (0, -3), (2, -1), (-3, 1),
            (1, 2), (-2, -1), (3, -4),
            (-1, 3), (4, -2), (-4, 2),
        ],
        'core_craters': [(0, 0), (2, -3), (-3, 3), (1, -2), (-2, 2), (0, 2)],
        # Avoid highland / core-crater keys; oceans stay in core.
        'oceans': [(2, -4), (3, -3), (4, -3), (2, -2), (3, -2),
                   (1, -1), (4, -1), (3, 0), (1, 0), (2, 0),
                   (0, 1), (1, 1), (-1, 0)],
        'frontier_craters_per_sector': 2,
    },
}


def ring(q, r):
    return (abs(q) + abs(r) + abs(q + r)) // 2


def axial_centre(q, r):
    return math.sqrt(3) * (q + r / 2.0), 1.5 * r


def bearing(q, r):
    x, y = axial_centre(q, r)
    return math.degrees(math.atan2(-y, x)) % 360


def arc_delta(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)


def build_spaces(variant_key: str):
    cfg = VARIANTS[variant_key]
    highlands = set(cfg['highlands'])
    core_craters = set(cfg['core_craters'])
    oceans = set(cfg['oceans'])
    chasm_half = cfg['chasm_half']
    frontier_n = cfg['frontier_craters_per_sector']

    # Overlaps are hard errors — keep the recipes honest.
    overlap = (highlands & oceans) | (highlands & core_craters) | (oceans & core_craters)
    if overlap:
        raise SystemExit(f'{variant_key}: overlapping terrain keys {sorted(overlap)}')

    spaces = []
    for q in range(-N, N + 1):
        for r in range(-N, N + 1):
            if ring(q, r) <= N:
                spaces.append({'q': q, 'r': r, 'ring': ring(q, r)})

    for s in spaces:
        a = bearing(s['q'], s['r'])
        sector = min(range(3), key=lambda i: arc_delta(a, SECTORS[i]))
        near = arc_delta(a, SECTORS[sector]) <= chasm_half
        s['sector'] = sector

        if s['ring'] <= 4:
            s['type'], s['zone'] = 'land', 'core'
        elif s['ring'] == 5:
            s['type'] = 'chasm' if near else 'land'
            s['zone'] = 'belt' if near else 'approach'
        else:
            s['type'], s['zone'] = 'land', 'frontier'
            s['locked'] = near
            s['bridge'] = sector

    for s in spaces:
        key = (s['q'], s['r'])
        if key in highlands:
            # Highlands may sit on belt/frontier — they stay highland (no ocean).
            s['type'] = 'highland'
            if s.get('locked'):
                # A locked highland is still a frontier foundation target once
                # unlocked; keep lock/bridge so the bridge opens it.
                pass
        elif key in core_craters and s['zone'] == 'core' and s['type'] == 'land':
            s['type'] = 'crater'
        elif key in oceans and s['zone'] == 'core' and s['type'] == 'land':
            s['type'] = 'ocean'

    for sector in range(3):
        candidates = sorted(
            (s for s in spaces
             if s['zone'] == 'frontier' and s['sector'] == sector
             and s['type'] == 'land'),
            key=lambda s: arc_delta(bearing(s['q'], s['r']), SECTORS[sector]))
        for s in candidates[:frontier_n]:
            s['type'] = 'crater'

    pts = [(s, *axial_centre(s['q'], s['r'])) for s in spaces]
    min_x = min(p[1] for p in pts)
    min_y = min(p[2] for p in pts)
    for i, (s, cx, cy) in enumerate(
            sorted(pts, key=lambda p: (round(p[2], 3), p[1])), start=1):
        s['id'] = i
        s['x'] = round((cx - min_x) / math.sqrt(3) * PITCH_X) + OFFSET_X
        s['y'] = round((cy - min_y) / 1.5 * PITCH_Y) + OFFSET_Y

    return sorted(spaces, key=lambda s: s['id'])


def write_less(spaces):
    os.makedirs(os.path.dirname(LESS_DST), exist_ok=True)
    body = '\n'.join(
        f'.board-space-{s["id"]:03d} {{\n  margin: {s["y"]}px 0 0 {s["x"]}px;\n}}\n'
        for s in spaces)
    header = ('// Generated by tools/consortium-art/build_board.py\n'
              '// Do not edit by hand. Change the generator and rerun.\n'
              '// Shared by Massif / Rift Basin / Archipelago (same geometry).\n\n')
    open(LESS_DST, 'w').write(header + body)


def write_json(spaces, filename):
    os.makedirs(JSON_DIR, exist_ok=True)
    path = os.path.join(JSON_DIR, filename)
    with open(path, 'w') as f:
        json.dump(spaces, f, indent=1)
    return path


# Logical CSS layout — hex positions / board.less assume these sizes.
BOARD_W, BOARD_H = 891, 860
# Bitmap density. CSS uses background-size: BOARD_W x BOARD_H so coords stay.
ART_SCALE = 2
ART_W, ART_H = BOARD_W * ART_SCALE, BOARD_H * ART_SCALE

# REF silhouette centre (scaled mars.png) — same frame as HTML O2/temp pins.
# Hex OFFSET is chosen so the hex-field centre lands here too.
# Logical (891×860): centre ≈ (461, 431), planet_r ≈ 304.
DISC_CX0, DISC_CY0, DISC_R0 = 320.75, 300.47, 211.85


def build_mars():
    """
    Build a fully generative mars_consortium.png.

    Contract (do not break):
      - Logical layout stays BOARD_W x BOARD_H (891×860) — hex CSS/JSON untouched
      - PNG is ART_W x ART_H; board.less sets background-size to logical size
      - Disc centre/radius stays the fitted Tharsis disc so hexes still centre
      - Planet RGB is generated (not sampled from mars.png)
      - Chrome is vector-drawn crisp
    """
    # Keep the historical scale relationship to Tharsis mars.png dimensions
    # so OFFSET/PITCH math and chrome HTML scale factors stay valid.
    if os.path.exists(MARS_SRC):
        src_w, src_h = Image.open(MARS_SRC).size
        assert BOARD_W == round(src_w * 634 / 441)
        assert BOARD_H == round(src_h * 542 / 378)
        sx = ART_W / src_w
        sy = ART_H / src_h
    else:
        sx = ART_W / 620.0
        sy = ART_H / 600.0

    cx = DISC_CX0 * sx
    cy = DISC_CY0 * sy
    radius = DISC_R0 * ((sx + sy) / 2.0)
    diameter = int(round(radius * 2))

    print(f'rendering generative Consortium planet ({diameter}px disc @ {ART_SCALE}x)...')
    planet = render_planet(diameter, seed=20260731)
    # Mild finish — keep structure from the supersample.
    planet_rgb = ImageEnhance.Contrast(planet.convert('RGB')).enhance(1.06)
    planet_rgb = ImageEnhance.Color(planet_rgb).enhance(1.04)
    planet = Image.merge('RGBA', (*planet_rgb.split(), planet.split()[3]))

    out = Image.new('RGBA', (ART_W, ART_H), (0, 0, 0, 255))
    dx = int(round(cx - diameter / 2.0))
    dy = int(round(cy - diameter / 2.0))
    out.alpha_composite(planet, (dx, dy))
    out = draw_chrome(out, cx, cy, radius)

    flat = Image.new('RGBA', (ART_W, ART_H), (0, 0, 0, 255))
    flat.alpha_composite(out)
    flat.save(MARS_DST, optimize=True)
    print(f'board image : {flat.size[0]} x {flat.size[1]} px  '
          f'(logical {BOARD_W}x{BOARD_H} @ {ART_SCALE}x) -> {MARS_DST}')
    return flat


def summarize(name, spaces):
    counts, zones = {}, {}
    for s in spaces:
        counts[s['type']] = counts.get(s['type'], 0) + 1
        zones[s['zone']] = zones.get(s['zone'], 0) + 1
    locked = sum(1 for s in spaces if s.get('locked'))
    oceans = counts.get('ocean', 0)
    if oceans != 13:
        raise SystemExit(f'{name}: expected 13 oceans, got {oceans}')
    if counts.get('highland', 0) < 6:
        raise SystemExit(f'{name}: need ≥6 highlands, got {counts.get("highland")}')
    if locked < 9:
        raise SystemExit(f'{name}: need locked frontier (≥9), got {locked}')
    # Each sector must have at least one locked bridge space.
    for sector in range(3):
        n = sum(1 for s in spaces if s.get('locked') and s.get('bridge') == sector)
        if n < 1:
            raise SystemExit(f'{name}: sector {sector} has no locked frontier')
    print(f'--- {name} ---')
    print(f'  by type  : {counts}')
    print(f'  by zone  : {zones}')
    print(f'  locked   : {locked}   open frontier: {zones["frontier"] - locked}')


def _load_hex_tiles():
    tiles = {}
    for key, filename in HEX_ASSET.items():
        path = os.path.join(ROOT, 'assets', filename)
        if not os.path.exists(path):
            raise SystemExit(f'missing hex asset {path}')
        tiles[key] = Image.open(path).convert('RGBA')
    return tiles


def _tint_locked(hex_img):
    """Purple wash so locked frontier reads distinctly from open land."""
    tinted = hex_img.copy()
    overlay = Image.new('RGBA', tinted.size, (90, 70, 150, 0))
    # Keep hex silhouette via alpha mask; wash the opaque interior.
    alpha = tinted.split()[3]
    wash = Image.new('RGBA', tinted.size, (110, 80, 170, 110))
    wash.putalpha(ImageEnhance.Brightness(alpha).enhance(0.55))
    return Image.alpha_composite(tinted, wash)


def build_preview(mars_base, spaces, filename, tiles):
    """Composite terrain hexes onto the shared Mars disc for lobby/rulebook."""
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    # Hex CSS coords are logical 891×860; downscale 2× art if needed.
    if mars_base.size != (BOARD_W, BOARD_H):
        img = mars_base.resize((BOARD_W, BOARD_H), Image.LANCZOS)
    else:
        img = mars_base.copy()
    # Slight dim so hex colours read on the bright disc.
    dim = Image.new('RGBA', img.size, (0, 0, 0, 50))
    img = Image.alpha_composite(img, dim)

    locked_land = _tint_locked(tiles['land'])
    for s in spaces:
        tile = tiles.get(s['type'], tiles['land'])
        if s.get('locked') and s['type'] == 'land':
            tile = locked_land
        elif s.get('locked') and s['type'] == 'crater':
            tile = _tint_locked(tiles['crater'])
        elif s.get('locked') and s['type'] == 'highland':
            tile = _tint_locked(tiles['highland'])
        img.alpha_composite(tile, (s['x'], s['y']))

    # Compact legend strip along the bottom of the disc area.
    legend = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(legend)
    d.rectangle([12, img.height - 54, img.width - 12, img.height - 10],
                fill=(12, 16, 22, 200))
    swatches = [
        (tiles['land'], 'Land'),
        (tiles['ocean'], 'Ocean'),
        (tiles['highland'], 'Highland'),
        (tiles['crater'], 'Crater'),
        (tiles['chasm'], 'Chasm'),
        (locked_land, 'Locked'),
    ]
    x = 24
    y = img.height - 48
    for swatch, label in swatches:
        thumb = swatch.resize((22, 24), Image.LANCZOS)
        legend.alpha_composite(thumb, (x, y))
        d.text((x + 26, y + 5), label, fill=(220, 228, 236, 255))
        x += 100
    img = Image.alpha_composite(img, legend)

    path = os.path.join(PREVIEW_DIR, filename)
    img.save(path)
    return path


def main():
    # Geometry is identical across variants — write LESS/PNG once from Massif.
    massif = build_spaces('massif')
    write_less(massif)
    mars = build_mars()
    tiles = _load_hex_tiles()

    for key, cfg in VARIANTS.items():
        spaces = build_spaces(key) if key != 'massif' else massif
        # Sanity: shared geometry — same (q,r) → same id/x/y as Massif.
        if key != 'massif':
            by_qr = {(s['q'], s['r']): s for s in massif}
            for s in spaces:
                ref = by_qr[(s['q'], s['r'])]
                if (s['id'], s['x'], s['y']) != (ref['id'], ref['x'], ref['y']):
                    raise SystemExit(f'{key}: geometry drifted from Massif at {(s["q"], s["r"])}')
        path = write_json(spaces, cfg['json'])
        preview = build_preview(mars, spaces, cfg['preview'], tiles)
        summarize(key, spaces)
        print(f'  json     : {path}')
        print(f'  preview  : {preview}')

    print(f'board image : {mars.size[0]} x {mars.size[1]} px  -> {MARS_DST}')
    print(f'css rules   : {len(massif)}  -> {LESS_DST}')


if __name__ == '__main__':
    main()
