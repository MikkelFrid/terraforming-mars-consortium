"""
Consortium art generator.

Builds every Consortium icon from the repository's own assets, so no binary
files ever need to be transferred. Run from the repository root:

    python3 tools/consortium-art/build_assets.py

Requires Pillow only.

Produces:
    assets/tags/structure.png        116x116 RGBA
    assets/tags/prospecting.png      116x116 RGBA
    assets/hex_chasm.png             46x50  RGBA
    assets/hex_crater_field.png      46x50  RGBA
    assets/hex_highland.png          46x50  RGBA

Design constraints, derived from the existing game assets:

  Tags     - inscribed circle on a 116x116 canvas, corners transparent.
             cards.less renders them at 40x40 with background-size 50px and
             background-position -5px, so the outer 10 percent is cropped.
             Keep all meaningful detail inside a radius of about 46px.
  Hexes    - the ring geometry is taken directly from assets/hex_black.png,
             so it is pixel-identical to every other space type. Only colour
             and interior fill differ.

Artwork derives from the official Terraforming Mars asset sources,
CC BY-SA 4.0.
"""

import os
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HEX_SRC = os.path.join(ROOT, 'assets', 'hex_black.png')
TAG_DIR = os.path.join(ROOT, 'assets', 'tags')
ASSET_DIR = os.path.join(ROOT, 'assets')

S, SS = 116, 8
W = S * SS
R = 57.0 * SS
CX = CY = W / 2


# --------------------------------------------------------------------- tags

def _lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def _plate(base, top):
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    grad = Image.new('RGBA', (W, W), (0, 0, 0, 255))
    gd = ImageDraw.Draw(grad)
    for y in range(W):
        gd.line([(0, y), (W, y)], fill=_lerp(top, base, (y / W) ** 0.85) + (255,))
    mask = Image.new('L', (W, W), 0)
    ImageDraw.Draw(mask).ellipse([CX - R, CY - R, CX + R, CY + R], fill=255)
    img.paste(grad, (0, 0), mask)

    rim = Image.new('L', (W, W), 0)
    ImageDraw.Draw(rim).ellipse([CX - R, CY - R, CX + R, CY + R],
                                outline=255, width=int(2.6 * SS))
    img.paste(Image.new('RGBA', (W, W), (0, 0, 0, 255)), (0, 0), rim)
    return img


def _apply(img, glyph_mask, rgb, outline_px=3.4, highlight=None):
    grown = glyph_mask.filter(ImageFilter.MaxFilter(int(outline_px * SS) * 2 + 1))
    img.paste(Image.new('RGBA', (W, W), (0, 0, 0, 255)), (0, 0), grown)
    body = Image.new('RGBA', (W, W), rgb + (255,))
    if highlight:
        hi = Image.new('RGBA', (W, W), (0, 0, 0, 0))
        ImageDraw.Draw(hi).rectangle([0, 0, W, W / 2], fill=highlight + (255,))
        body = Image.blend(body, Image.alpha_composite(body, hi), 0.22)
    img.paste(body, (0, 0), glyph_mask)
    return img


def _u(v):
    return CX + v * R


def _arch():
    m = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(m)
    ox, bot, spring, rad = 0.44, 0.44, 0.02, 0.44
    d.rectangle([_u(-ox), _u(spring), _u(ox), _u(bot)], fill=255)
    d.pieslice([_u(-rad), _u(spring - rad), _u(rad), _u(spring + rad)], 180, 360, fill=255)
    ix = irad = 0.21
    d.rectangle([_u(-ix), _u(spring), _u(ix), _u(bot) + 2 * SS], fill=0)
    d.pieslice([_u(-irad), _u(spring - irad), _u(irad), _u(spring + irad)], 180, 360, fill=0)
    return m


def _keystone():
    m = Image.new('L', (W, W), 0)
    ImageDraw.Draw(m).polygon(
        [(_u(-0.115), _u(-0.40)), (_u(0.115), _u(-0.40)),
         (_u(0.085), _u(-0.16)), (_u(-0.085), _u(-0.16))], fill=255)
    return m


def _pick():
    m = Image.new('L', (W, W), 0)
    d = ImageDraw.Draw(m)
    hw = 0.072
    d.polygon([(_u(-hw), _u(-0.34)), (_u(hw), _u(-0.34)),
               (_u(hw), _u(0.46)), (_u(-hw), _u(0.46))], fill=255)
    d.arc([_u(-0.52), _u(-0.60), _u(0.52), _u(0.16)], 196, 344,
          fill=255, width=int(0.155 * R))
    d.polygon([(_u(-0.52), _u(-0.24)), (_u(-0.30), _u(-0.36)), (_u(-0.34), _u(-0.13))], fill=255)
    d.polygon([(_u(0.52), _u(-0.24)), (_u(0.30), _u(-0.36)), (_u(0.34), _u(-0.13))], fill=255)
    return m.rotate(-34, resample=Image.BICUBIC, center=(CX, CY))


def build_tag(path, base, top, parts):
    img = _plate(base, top)
    for mask, rgb, outline, hi in parts:
        img = _apply(img, mask, rgb, outline, hi)
    circle = Image.new('L', (W, W), 0)
    ImageDraw.Draw(circle).ellipse([CX - R, CY - R, CX + R, CY + R], fill=255)
    out = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    out.paste(img, (0, 0), circle)
    out.resize((S, S), Image.LANCZOS).save(path)


# -------------------------------------------------------------------- hexes

def _interior(ring):
    w, h = ring.size
    m = Image.new('L', (w, h), 0)
    rp, mp = ring.load(), m.load()
    q = deque([(w // 2, h // 2)])
    seen = {(w // 2, h // 2)}
    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or rp[x, y] > 60:
            continue
        mp[x, y] = 255
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in seen:
                seen.add(n)
                q.append(n)
    return m


def build_hex(path, ring, interior, rgb, ring_alpha, fill_rgb=None,
              fill_alpha=0, motif=None):
    w, h = ring.size
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    if fill_rgb:
        img.paste(Image.new('RGBA', (w, h), fill_rgb + (fill_alpha,)), (0, 0), interior)
    if motif:
        motif(img)
    img.paste(Image.new('RGBA', (w, h), rgb + (255,)), (0, 0),
              ring.point(lambda v: int(v * ring_alpha / 255)))
    img.save(path)


def _craters(img):
    d = ImageDraw.Draw(img)
    for cx, cy, r in ((17, 21, 5), (28, 28, 3.5), (22, 34, 2.5)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r],
                  outline=(196, 210, 224, 190), width=2)


def _contours(img):
    d = ImageDraw.Draw(img)
    for w, y in ((13, 20), (9, 26), (5, 32)):
        d.arc([23 - w, y - 5, 23 + w, y + 5], 200, 340,
              fill=(214, 186, 138, 185), width=2)


# --------------------------------------------------------------------- main

def main():
    if not os.path.exists(HEX_SRC):
        sys.exit(f'missing {HEX_SRC} — run from the repository root')
    os.makedirs(TAG_DIR, exist_ok=True)

    build_tag(os.path.join(TAG_DIR, 'structure.png'),
              (74, 104, 122), (128, 158, 174),
              [(_arch(), (226, 231, 234), 3.4, (255, 255, 255)),
               (_keystone(), (243, 226, 178), 3.0, None)])

    build_tag(os.path.join(TAG_DIR, 'prospecting.png'),
              (168, 116, 38), (214, 163, 74),
              [(_pick(), (58, 52, 56), 3.4, (150, 150, 160))])

    ring = Image.open(HEX_SRC).convert('RGBA').split()[3]
    interior = _interior(ring)

    build_hex(os.path.join(ASSET_DIR, 'hex_chasm.png'), ring, interior,
              (38, 42, 54), 235, (14, 16, 24), 120)
    build_hex(os.path.join(ASSET_DIR, 'hex_crater_field.png'), ring, interior,
              (176, 196, 214), 215, (120, 150, 175), 48, _craters)
    build_hex(os.path.join(ASSET_DIR, 'hex_highland.png'), ring, interior,
              (201, 162, 107), 215, (190, 150, 95), 42, _contours)

    print('generated:')
    for p in ('assets/tags/structure.png', 'assets/tags/prospecting.png',
              'assets/hex_chasm.png', 'assets/hex_crater_field.png',
              'assets/hex_highland.png'):
        f = os.path.join(ROOT, p)
        im = Image.open(f)
        print(f'  {p:34} {im.size[0]}x{im.size[1]} {im.mode} '
              f'{os.path.getsize(f)} bytes')


if __name__ == '__main__':
    main()
