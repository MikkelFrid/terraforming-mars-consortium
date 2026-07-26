"""
Consortium megastructure emblems.

Builds the eight megastructure emblems from the same plate-and-glyph
construction as the Consortium tags, so they sit in the same visual family
as the rest of the game. Run from the repository root:

    python3 tools/consortium-art/build_emblems.py

Requires Pillow only. Imports shared helpers from build_assets.py.

Produces, all 116x116 RGBA:

    assets/consortium/megastructures/bridge-0.png
    assets/consortium/megastructures/bridge-1.png
    assets/consortium/megastructures/bridge-2.png
    assets/consortium/megastructures/space_elevator.png
    assets/consortium/megastructures/l1_magnetic_shield.png
    assets/consortium/megastructures/mohole.png
    assets/consortium/megastructures/solar_mirror.png
    assets/consortium/megastructures/arcology.png

The three bridges share one plate colour and one glyph because they are the
same kind of structure. They are told apart by pip count, matching the board
sector index, which stays legible at track-row size where a colour difference
alone would not.

Artwork derives from the official Terraforming Mars asset sources,
CC BY-SA 4.0.
"""

import os
from PIL import Image, ImageDraw

from build_assets import ROOT, W, R, CX, CY, SS, build_tag, _u

OUT_DIR = os.path.join(ROOT, 'assets', 'consortium', 'megastructures')

WHITE = (232, 236, 240)
STEEL = (196, 206, 216)
WARM = (243, 226, 178)


def _mask():
    m = Image.new('L', (W, W), 0)
    return m, ImageDraw.Draw(m)


def bridge(pips):
    m, d = _mask()
    d.rectangle([_u(-0.62), _u(0.10), _u(0.62), _u(0.21)], fill=255)
    for x in (-0.32, 0.32):
        d.rectangle([_u(x - 0.045), _u(-0.40), _u(x + 0.045), _u(0.21)], fill=255)
    d.arc([_u(-0.32), _u(-0.40), _u(0.32), _u(0.34)], 0, 180,
          fill=255, width=int(0.055 * R))
    d.line([_u(-0.62), _u(0.10), _u(-0.32), _u(-0.40)], fill=255, width=int(0.05 * R))
    d.line([_u(0.62), _u(0.10), _u(0.32), _u(-0.40)], fill=255, width=int(0.05 * R))
    for i in range(pips):
        cx = -0.18 + i * 0.18
        d.ellipse([_u(cx - 0.055), _u(0.40), _u(cx + 0.055), _u(0.51)], fill=255)
    return m


def space_elevator():
    m, d = _mask()
    d.polygon([(_u(-0.26), _u(0.52)), (_u(0.26), _u(0.52)),
               (_u(0.10), _u(0.28)), (_u(-0.10), _u(0.28))], fill=255)
    d.rectangle([_u(-0.055), _u(-0.40), _u(0.055), _u(0.30)], fill=255)
    d.ellipse([_u(-0.17), _u(-0.60), _u(0.17), _u(-0.26)], fill=255)
    for y in (-0.16, 0.02):
        d.rectangle([_u(-0.19), _u(y), _u(0.19), _u(y + 0.075)], fill=255)
    return m


def l1_shield():
    m, d = _mask()
    d.polygon([(_u(0.06), _u(-0.50)), (_u(0.52), _u(-0.30)),
               (_u(0.52), _u(0.10)), (_u(0.06), _u(0.54)),
               (_u(-0.10), _u(0.36)), (_u(-0.10), _u(-0.40))], fill=255)
    for r, wdt in ((0.72, 0.055), (0.54, 0.05), (0.36, 0.045)):
        d.arc([_u(-r), _u(-r), _u(r), _u(r)], 108, 252,
              fill=255, width=int(wdt * R))
    return m


def mohole():
    m, d = _mask()
    for r in (0.60, 0.44, 0.29):
        d.ellipse([_u(-r), _u(-r * 0.62), _u(r), _u(r * 0.62)],
                  outline=255, width=int(0.055 * R))
    d.ellipse([_u(-0.13), _u(-0.08), _u(0.13), _u(0.08)], fill=255)
    d.polygon([(_u(-0.07), _u(-0.62)), (_u(0.07), _u(-0.62)),
               (_u(0.02), _u(-0.14)), (_u(-0.02), _u(-0.14))], fill=255)
    return m


def solar_mirror():
    m, d = _mask()
    d.arc([_u(-0.58), _u(-0.16), _u(0.58), _u(0.82)], 180, 360,
          fill=255, width=int(0.10 * R))
    d.rectangle([_u(-0.035), _u(-0.06), _u(0.035), _u(0.34)], fill=255)
    d.ellipse([_u(-0.14), _u(-0.30), _u(0.14), _u(-0.02)], fill=255)
    for x in (-0.40, -0.13, 0.14, 0.41):
        d.line([_u(x), _u(-0.66), _u(x), _u(-0.42)], fill=255, width=int(0.05 * R))
    return m


def arcology():
    m, d = _mask()
    d.pieslice([_u(-0.56), _u(-0.56), _u(0.56), _u(0.56)], 180, 360, fill=255)
    d.rectangle([_u(-0.60), _u(0.00), _u(0.60), _u(0.13)], fill=255)
    d.rectangle([_u(-0.44), _u(0.13), _u(-0.30), _u(0.46)], fill=255)
    d.rectangle([_u(-0.07), _u(0.13), _u(0.07), _u(0.52)], fill=255)
    d.rectangle([_u(0.30), _u(0.13), _u(0.44), _u(0.46)], fill=255)
    return m


SPECS = [
    ('bridge-0.png', (58, 88, 108), (108, 142, 162), bridge(1), STEEL),
    ('bridge-1.png', (58, 88, 108), (108, 142, 162), bridge(2), STEEL),
    ('bridge-2.png', (58, 88, 108), (108, 142, 162), bridge(3), STEEL),
    ('space_elevator.png', (62, 68, 124), (112, 118, 176), space_elevator(), WHITE),
    ('l1_magnetic_shield.png', (30, 104, 112), (74, 156, 164), l1_shield(), WHITE),
    ('mohole.png', (122, 58, 38), (176, 104, 72), mohole(), WARM),
    ('solar_mirror.png', (168, 130, 38), (216, 180, 82), solar_mirror(), WARM),
    ('arcology.png', (54, 106, 78), (100, 156, 122), arcology(), WHITE),
]


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print('generated:')
    for name, base, top, mask, rgb in SPECS:
        path = os.path.join(OUT_DIR, name)
        build_tag(path, base, top, [(mask, rgb, 3.2, (255, 255, 255))])
        im = Image.open(path)
        rel = os.path.relpath(path, ROOT)
        print(f'  {rel:58} {im.size[0]}x{im.size[1]} {im.mode} '
              f'{os.path.getsize(path)} bytes')


if __name__ == '__main__':
    main()
