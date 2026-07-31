"""
Composite a filled Consortium board preview for visual QA.

Run from repo root:
    python3 tools/consortium-art/simulate_filled_board.py

Writes:
    /opt/cursor/artifacts/consortium_filled_board.png
"""

from __future__ import annotations

import json
import os
import random
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOARD = os.path.join(ROOT, 'assets', 'board', 'mars_consortium.png')
SPACES = os.path.join(ROOT, 'src', 'server', 'boards', 'consortiumSpaces.json')
OUT_ART = '/opt/cursor/artifacts/consortium_filled_board.png'

BOARD_W, BOARD_H = 891, 860
HEX_W, HEX_H = 46, 50


def _load_tile(name: str, size=(HEX_W, HEX_H)) -> Image.Image:
    path = os.path.join(ROOT, 'assets', 'tiles', name)
    im = Image.open(path).convert('RGBA')
    return im.resize(size, Image.LANCZOS)


def main():
    random.seed(42)
    spaces = json.load(open(SPACES))
    board = Image.open(BOARD).convert('RGBA')
    if board.size != (BOARD_W, BOARD_H):
        board = board.resize((BOARD_W, BOARD_H), Image.LANCZOS)

    city = _load_tile('city.png')
    green = _load_tile('greenery.png')
    ocean = _load_tile('ocean.png')
    special = _load_tile('special.png')

    # Dim board slightly so tiles read.
    dim = Image.new('RGBA', board.size, (0, 0, 0, 40))
    img = Image.alpha_composite(board, dim)

    # Terrain hex outlines (from build_assets) under tiles where relevant.
    hex_assets = {}
    for key, fn in [
        ('land', 'hex_black.png'),
        ('ocean', 'hex_blue.png'),
        ('chasm', 'hex_chasm.png'),
        ('crater', 'hex_crater_field.png'),
        ('highland', 'hex_highland.png'),
    ]:
        p = os.path.join(ROOT, 'assets', fn)
        if os.path.exists(p):
            hex_assets[key] = Image.open(p).convert('RGBA')

    placeable = []
    for s in spaces:
        x, y = s['x'], s['y']
        t = s['type']
        if t in hex_assets:
            tile = hex_assets[t]
            if s.get('locked'):
                # purple wash
                wash = Image.new('RGBA', tile.size, (110, 80, 170, 90))
                tile = Image.alpha_composite(tile, wash)
            img.alpha_composite(tile, (x, y))
        if t == 'chasm' or s.get('locked'):
            continue
        placeable.append(s)

    # Fill: all oceans, then mix of city/greenery/special on open land/highland/crater.
    oceans = [s for s in placeable if s['type'] == 'ocean']
    lands = [s for s in placeable if s['type'] != 'ocean']
    random.shuffle(lands)

    for s in oceans:
        img.alpha_composite(ocean, (s['x'], s['y']))

    n_city = max(8, len(lands) // 5)
    n_green = max(10, len(lands) // 4)
    n_special = 4
    for s in lands[:n_city]:
        img.alpha_composite(city, (s['x'], s['y']))
    for s in lands[n_city:n_city + n_green]:
        img.alpha_composite(green, (s['x'], s['y']))
    for s in lands[n_city + n_green:n_city + n_green + n_special]:
        img.alpha_composite(special, (s['x'], s['y']))

    # Crosshair at hex-field centre + planet centre note.
    d = ImageDraw.Draw(img)
    fcx, fcy = 454.0, 405.0
    d.line([(fcx - 18, fcy), (fcx + 18, fcy)], fill=(255, 220, 80, 220), width=2)
    d.line([(fcx, fcy - 18), (fcx, fcy + 18)], fill=(255, 220, 80, 220), width=2)
    try:
        font = ImageFont.truetype(
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
    except OSError:
        font = ImageFont.load_default()
    d.rectangle([8, 8, 520, 52], fill=(0, 0, 0, 180))
    d.text((14, 12), 'Filled sim — yellow cross = hex field centre',
           font=font, fill=(255, 230, 120, 255))
    d.text((14, 32), f'cities={n_city} greenery={n_green} oceans={len(oceans)} special={n_special}',
           font=font, fill=(200, 220, 240, 255))

    os.makedirs(os.path.dirname(OUT_ART), exist_ok=True)
    img.save(OUT_ART)
    print(f'wrote {OUT_ART}')


if __name__ == '__main__':
    main()
