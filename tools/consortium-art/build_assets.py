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
    assets/resources/iridium.png     331x331 RGBA
    assets/expansion_icons/expansion_icon_consortium.png  64x64 RGBA
    assets/consortium/megastructures/*.png  116x116 RGBA (8 placeholders)
    assets/ma/{mason,pathfinder,assayer,underwriter,cartographer,refiner}.png
                             140x83 RGBA milestone / award medals

Design constraints, derived from the existing game assets:

  Tags     - inscribed circle on a 116x116 canvas, corners transparent.
             cards.less renders them at 40x40 with background-size 50px and
             background-position -5px, so the outer 10 percent is cropped.
             Keep all meaningful detail inside a radius of about 46px.
  Hexes    - the ring geometry is taken directly from assets/hex_black.png,
             so it is pixel-identical to every other space type. Only colour
             and interior fill differ.
  Resources - 331x331, black field with a centred disc (matches steel /
             titanium). Iridium reads cooler/whiter than titanium gray.

Artwork derives from the official Terraforming Mars asset sources,
CC BY-SA 4.0.
"""

import math
import os
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HEX_SRC = os.path.join(ROOT, 'assets', 'hex_black.png')
TAG_DIR = os.path.join(ROOT, 'assets', 'tags')
RES_DIR = os.path.join(ROOT, 'assets', 'resources')
ASSET_DIR = os.path.join(ROOT, 'assets')
MA_DIR = os.path.join(ASSET_DIR, 'ma')
PROTOTYPE_FONT = os.path.join(ASSET_DIR, 'Prototype.ttf')

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
                  outline=(228, 240, 252, 235), width=2)


def _contours(img):
    d = ImageDraw.Draw(img)
    for w, y in ((13, 20), (9, 26), (5, 32)):
        d.arc([23 - w, y - 5, 23 + w, y + 5], 200, 340,
              fill=(248, 226, 176, 235), width=2)


# ---------------------------------------------------------------- resources
#
# Resource icons are 331x331 fully opaque squares with a dark plate, not
# transparent cut-outs. Steel and titanium both follow that convention, so
# iridium does too. The chunk is drawn as a hard-edged polyhedron with six
# facets running bright to dark, because at 48px on a card the silhouette and
# the facet contrast are the only things that survive - a soft blob reads as a
# hole in the card rather than as metal.

RES_S, RES_SS = 331, 6
RES_W = RES_S * RES_SS

_IR_TOP = (0.00, -0.66)
_IR_UL = (-0.56, -0.20)
_IR_UR = (0.58, -0.26)
_IR_LL = (-0.44, 0.44)
_IR_LR = (0.50, 0.40)
_IR_BOT = (0.02, 0.68)
_IR_C = (0.01, -0.03)

_IR_FACETS = [
    ([_IR_TOP, _IR_UL, _IR_C], (250, 252, 254)),
    ([_IR_TOP, _IR_C, _IR_UR], (216, 224, 234)),
    ([_IR_UL, _IR_LL, _IR_C], (188, 198, 210)),
    ([_IR_UR, _IR_C, _IR_LR], (150, 160, 175)),
    ([_IR_LL, _IR_BOT, _IR_C], (124, 134, 149)),
    ([_IR_BOT, _IR_LR, _IR_C], (98, 107, 122)),
]


def _ir_px(p):
    return (RES_W / 2 + p[0] * RES_W * 0.5,
            RES_W / 2 + p[1] * RES_W * 0.5)


def build_iridium(path):
    img = Image.new('RGBA', (RES_W, RES_W), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)

    for i in range(140, 0, -1):
        t = i / 140.0
        v = int(6 + 30 * (1 - t))
        r = RES_W * 0.72 * t
        d.ellipse([RES_W / 2 - r, RES_W / 2 - r, RES_W / 2 + r, RES_W / 2 + r],
                  fill=(v, v, v + 3, 255))

    body = [_IR_TOP, _IR_UR, _IR_LR, _IR_BOT, _IR_LL, _IR_UL]
    d.polygon([_ir_px(p) for p in body], fill=(24, 27, 34, 255))

    for pts, col in _IR_FACETS:
        d.polygon([_ir_px(p) for p in pts], fill=col + (255,))

    for pts, _ in _IR_FACETS:
        d.line([_ir_px(p) for p in pts] + [_ir_px(pts[0])],
               fill=(26, 29, 36, 255), width=int(2.2 * RES_SS))
    d.line([_ir_px(p) for p in body] + [_ir_px(body[0])],
           fill=(14, 16, 21, 255), width=int(5.0 * RES_SS))

    spec = Image.new('RGBA', (RES_W, RES_W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spec)
    a, b = _ir_px((-0.30, -0.34)), _ir_px((-0.10, -0.16))
    sd.ellipse([a[0], a[1], b[0], b[1]], fill=(255, 255, 255, 210))
    spec = spec.filter(ImageFilter.GaussianBlur(RES_SS * 1.5))
    img = Image.alpha_composite(img, spec)

    img.resize((RES_S, RES_S), Image.LANCZOS).save(path)


# ---------------------------------------------- expansion icon (lobby / cards)
#
# Lobby renders `.create-game-expansion-icon` at 30x30. Peer icons are small
# circular badges (Ares letter-A, Underworld U-octagon). Consortium's identity
# resource is iridium, so the expansion glyph is the same faceted chunk on a
# dark disc — not the old solid teal placeholder circle.
#
# Canvas 64x64 with transparent corners (same convention as tags). Meaningful
# detail stays inside ~28px radius so it survives the 30px lobby downscale.

EXP_ICON_S, EXP_ICON_SS = 64, 8
EXP_ICON_W = EXP_ICON_S * EXP_ICON_SS
EXP_ICON_DIR = os.path.join(ASSET_DIR, 'expansion_icons')


def _exp_ir_px(p):
    # Fill most of the disc — at 30px lobby size a small gem disappears.
    scale = 0.50
    return (EXP_ICON_W / 2 + p[0] * EXP_ICON_W * scale,
            EXP_ICON_W / 2 + p[1] * EXP_ICON_W * scale)


def build_expansion_icon_consortium(path):
    """64x64 circular badge: dark plate + iridium gem (transparent corners)."""
    img = Image.new('RGBA', (EXP_ICON_W, EXP_ICON_W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = EXP_ICON_W / 2
    r = EXP_ICON_W / 2 - 2 * EXP_ICON_SS

    # Plate — cool slate with enough lift to separate from the dark lobby button.
    d.ellipse([cx - r, cy - r, cx + r, cy + r],
              fill=(48, 58, 72, 255),
              outline=(18, 22, 28, 255),
              width=int(2.5 * EXP_ICON_SS))
    # Cool rim so it reads against charcoal expansion buttons.
    rim = r - 1.5 * EXP_ICON_SS
    d.ellipse([cx - rim, cy - rim, cx + rim, cy + rim],
              outline=(160, 190, 210, 240),
              width=max(1, int(1.4 * EXP_ICON_SS)))

    body = [_IR_TOP, _IR_UR, _IR_LR, _IR_BOT, _IR_LL, _IR_UL]
    d.polygon([_exp_ir_px(p) for p in body], fill=(24, 27, 34, 255))
    for pts, col in _IR_FACETS:
        d.polygon([_exp_ir_px(p) for p in pts], fill=col + (255,))
    for pts, _ in _IR_FACETS:
        d.line([_exp_ir_px(p) for p in pts] + [_exp_ir_px(pts[0])],
               fill=(26, 29, 36, 255), width=int(1.6 * EXP_ICON_SS))
    d.line([_exp_ir_px(p) for p in body] + [_exp_ir_px(body[0])],
           fill=(14, 16, 21, 255), width=int(3.2 * EXP_ICON_SS))

    spec = Image.new('RGBA', (EXP_ICON_W, EXP_ICON_W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spec)
    a, b = _exp_ir_px((-0.30, -0.34)), _exp_ir_px((-0.10, -0.16))
    sd.ellipse([a[0], a[1], b[0], b[1]], fill=(255, 255, 255, 210))
    spec = spec.filter(ImageFilter.GaussianBlur(EXP_ICON_SS * 1.2))
    img = Image.alpha_composite(img, spec)

    img.resize((EXP_ICON_S, EXP_ICON_S), Image.LANCZOS).save(path)


# --------------------------------------------------------- megastructure emblems
#
# Locked paths and size (phase 07). Do not rename or resize — real artwork
# replaces the placeholder shapes in a follow-up while keeping these paths:
#
#   assets/consortium/megastructures/bridge-0.png             116x116 RGBA
#   assets/consortium/megastructures/bridge-1.png             116x116 RGBA
#   assets/consortium/megastructures/bridge-2.png             116x116 RGBA
#   assets/consortium/megastructures/space_elevator.png       116x116 RGBA
#   assets/consortium/megastructures/l1_magnetic_shield.png   116x116 RGBA
#   assets/consortium/megastructures/mohole.png                116x116 RGBA
#   assets/consortium/megastructures/solar_mirror.png         116x116 RGBA
#   assets/consortium/megastructures/arcology.png             116x116 RGBA

MEGASTRUCTURE_EMBLEM_DIR = os.path.join(ASSET_DIR, 'consortium', 'megastructures')
MEGASTRUCTURE_EMBLEM_SIZE = 116

# (filename stem, fill RGB, shape)
# Shapes are plain geometry — distinct colours only. Real emblems later.
_MEGASTRUCTURE_PLACEHOLDERS = (
    ('bridge-0', (70, 130, 180), 'triangle'),       # steel blue
    ('bridge-1', (60, 110, 160), 'triangle'),       # deeper blue
    ('bridge-2', (50, 90, 140), 'triangle'),        # navy
    ('space_elevator', (200, 160, 60), 'rect'),     # gold
    ('l1_magnetic_shield', (120, 90, 180), 'diamond'),  # violet
    ('mohole', (180, 90, 50), 'circle'),            # rust
    ('solar_mirror', (220, 200, 80), 'hex'),        # yellow
    ('arcology', (80, 150, 100), 'pentagon'),       # green
)


def build_megastructure_emblem(path, rgb, shape):
    """116x116 circular badge with a plain coloured geometric glyph."""
    size = MEGASTRUCTURE_EMBLEM_SIZE
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = size / 2
    r = size / 2 - 2
    # Dark plate (matches tag style: inscribed circle, transparent corners).
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(40, 44, 52, 255),
              outline=(10, 12, 16, 255))
    gr = r * 0.55
    fill = rgb + (255,)
    outline = (20, 22, 28, 255)
    if shape == 'triangle':
        pts = [(cx, cy - gr), (cx + gr * 0.9, cy + gr * 0.7),
               (cx - gr * 0.9, cy + gr * 0.7)]
        d.polygon(pts, fill=fill, outline=outline)
    elif shape == 'rect':
        d.rectangle([cx - gr * 0.55, cy - gr, cx + gr * 0.55, cy + gr],
                    fill=fill, outline=outline)
    elif shape == 'diamond':
        pts = [(cx, cy - gr), (cx + gr, cy), (cx, cy + gr), (cx - gr, cy)]
        d.polygon(pts, fill=fill, outline=outline)
    elif shape == 'circle':
        d.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], fill=fill, outline=outline)
    elif shape == 'hex':
        pts = []
        for i in range(6):
            a = math.radians(-90 + i * 60)
            pts.append((cx + gr * math.cos(a), cy + gr * math.sin(a)))
        d.polygon(pts, fill=fill, outline=outline)
    elif shape == 'pentagon':
        pts = []
        for i in range(5):
            a = math.radians(-90 + i * 72)
            pts.append((cx + gr * math.cos(a), cy + gr * math.sin(a)))
        d.polygon(pts, fill=fill, outline=outline)
    else:
        raise ValueError(f'unknown shape {shape}')
    img.save(path)


# --------------------------------------------------------------------- special tiles

SPECIAL_TILE_DIR = os.path.join(ROOT, 'assets', 'tiles', 'special_tile_icons')


def build_impact_basin(path):
    """152x152 special-tile icon: cooler mining_area with impact rings."""
    src = os.path.join(SPECIAL_TILE_DIR, 'mining_area.png')
    img = Image.open(src).convert('RGBA')
    r, g, b, a = img.split()
    r = r.point(lambda x: int(x * 0.75))
    g = g.point(lambda x: int(x * 0.82))
    b = b.point(lambda x: min(255, int(x * 1.05 + 12)))
    out = Image.merge('RGBA', (r, g, b, a))
    draw = ImageDraw.Draw(out)
    w, h = out.size
    cx, cy = w // 2, h // 2
    for rad, width, fill in (
        (int(min(w, h) * 0.28), 3, (220, 230, 240, 200)),
        (int(min(w, h) * 0.18), 2, (180, 200, 220, 180)),
    ):
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad],
                     outline=fill, width=width)
    out.save(path)


def build_highland_anchor(path):
    """152x152 special-tile icon: warmer industrial_center with an anchor pin."""
    src = os.path.join(SPECIAL_TILE_DIR, 'industrial_center.png')
    img = Image.open(src).convert('RGBA')
    r, g, b, a = img.split()
    r = r.point(lambda x: min(255, int(x * 1.05 + 8)))
    g = g.point(lambda x: int(x * 0.88))
    b = b.point(lambda x: int(x * 0.70))
    out = Image.merge('RGBA', (r, g, b, a))
    draw = ImageDraw.Draw(out)
    w, h = out.size
    cx, cy = w // 2, h // 2 - 4
    # Vertical shaft
    draw.rectangle([cx - 3, cy - 28, cx + 3, cy + 22], fill=(240, 230, 200, 230))
    # Crossbar
    draw.rectangle([cx - 16, cy - 8, cx + 16, cy - 2], fill=(240, 230, 200, 230))
    # Flukes
    draw.polygon([(cx - 3, cy + 22), (cx - 18, cy + 10), (cx - 3, cy + 14)],
                 fill=(240, 230, 200, 230))
    draw.polygon([(cx + 3, cy + 22), (cx + 18, cy + 10), (cx + 3, cy + 14)],
                 fill=(240, 230, 200, 230))
    # Ring
    draw.ellipse([cx - 10, cy - 38, cx + 10, cy - 18], outline=(240, 230, 200, 230), width=3)
    out.save(path)


def _recolor_special(src_name, path, rf, gf, bf, draw_fn=None):
    src = os.path.join(SPECIAL_TILE_DIR, src_name)
    img = Image.open(src).convert('RGBA')
    r, g, b, a = img.split()
    r = r.point(lambda x: max(0, min(255, int(x * rf))))
    g = g.point(lambda x: max(0, min(255, int(x * gf))))
    b = b.point(lambda x: max(0, min(255, int(x * bf))))
    out = Image.merge('RGBA', (r, g, b, a))
    if draw_fn is not None:
        draw_fn(ImageDraw.Draw(out), out.size)
    out.save(path)


def build_trailhead_camp(path):
    """152x152: tent-like mark on a cooler natural_preserve base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2 + 4
        fill = (230, 220, 190, 230)
        draw.polygon([(cx, cy - 28), (cx - 22, cy + 16), (cx + 22, cy + 16)], fill=fill)
        draw.line([(cx, cy - 28), (cx, cy + 16)], fill=(40, 40, 40, 200), width=2)
    _recolor_special('natural_preserve.png', path, 0.85, 0.95, 1.10, glyph)


def build_rim_outpost(path):
    """152x152: outpost tower on restricted_area base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2
        fill = (235, 225, 200, 230)
        draw.rectangle([cx - 8, cy - 22, cx + 8, cy + 18], fill=fill)
        draw.polygon([(cx - 14, cy - 22), (cx, cy - 36), (cx + 14, cy - 22)], fill=fill)
        draw.ellipse([cx - 4, cy - 8, cx + 4, cy], fill=(40, 60, 90, 220))
    _recolor_special('restricted_area.png', path, 0.90, 0.88, 1.05, glyph)


def build_chasm_descent(path):
    """152x152: descent chevrons on a darker mohole base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2 - 6
        fill = (200, 210, 230, 230)
        for i, y in enumerate((cy - 18, cy - 2, cy + 14)):
            half = 16 - i * 3
            draw.polygon([(cx, y + 10), (cx - half, y - 6), (cx + half, y - 6)],
                         outline=fill)
    _recolor_special('mohole_area.png', path, 0.70, 0.75, 0.95, glyph)


def build_basalt_quarry(path):
    """152x152: quarry cut on warmer mining base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2 + 2
        fill = (235, 210, 170, 230)
        draw.polygon([(cx - 22, cy + 10), (cx - 8, cy - 18), (cx + 10, cy - 8),
                      (cx + 20, cy + 14)], fill=fill)
        draw.line([(cx - 14, cy - 2), (cx + 8, cy + 6)], fill=(60, 40, 20, 200), width=2)
    _recolor_special('mining_area.png', path, 1.05, 0.90, 0.70, glyph)


def build_ejecta_blanket(path):
    """152x152: splash ring on cooler nuclear_zone base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2
        fill = (210, 220, 235, 220)
        draw.ellipse([cx - 26, cy - 18, cx + 26, cy + 18], outline=fill, width=3)
        draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=fill)
    _recolor_special('nuclear_zone.png', path, 0.80, 0.90, 1.10, glyph)


def build_plateau_reservoir(path):
    """152x152: water plate on cooler mohole base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2
        fill = (150, 190, 220, 230)
        draw.ellipse([cx - 24, cy - 14, cx + 24, cy + 16], fill=fill)
        draw.rectangle([cx - 28, cy - 6, cx + 28, cy - 2], fill=(230, 220, 190, 220))
    _recolor_special('mohole_area.png', path, 0.75, 0.95, 1.15, glyph)


def build_massif_group(path):
    """152x152: massif peak on warmer highland_anchor base."""
    def glyph(draw, size):
        w, h = size
        cx, cy = w // 2, h // 2 + 6
        fill = (240, 220, 180, 230)
        draw.polygon([(cx, cy - 32), (cx - 26, cy + 16), (cx + 26, cy + 16)], fill=fill)
        draw.polygon([(cx - 4, cy - 8), (cx - 18, cy + 16), (cx + 2, cy + 16)],
                     fill=(180, 140, 90, 200))
    _recolor_special('highland_anchor.png', path, 1.05, 0.92, 0.75, glyph)


# ------------------------------------------------------- milestones / awards
#
# Client medals are 140x83 PNGs referenced from player_home.less via
# `.ma-name--{slug} { background-image: url("assets/ma/{slug}.png"); }`.
# The Vue component overlays the name on the bottom bar (padding-top: 60px),
# so the PNG itself leaves that strip blank.
#
# Milestone chrome mirrors base-game medals (left threshold, centre icon,
# right "TM", coloured name bar). Award chrome mirrors Venus/Ares awards
# (winged emblem, orange name bar, no threshold).

MA_W, MA_H = 140, 83
# Cool slate name-bar — Consortium's iridium palette, distinct from Venus blue
# and Underworld gold.
_MA_BAR = (72, 96, 118)
_MA_GOLD = (240, 176, 72)
_MA_GOLD_HI = (255, 230, 140)
_MA_GOLD_LO = (180, 120, 40)


def _ma_bg():
    img = Image.new('RGBA', (MA_W, MA_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x in range(MA_W):
        t = abs(x - MA_W / 2) / (MA_W / 2)
        v = int(185 - 45 * t)
        d.line([(x, 0), (x, MA_H)], fill=(v, v, v, 255))
    return img


def _ma_hex_points(cx, cy, r):
    pts = []
    for i in range(6):
        a = math.radians(60 * i - 30)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _ma_gold_wing(d, box):
    x0, y0, x1, y1 = box
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        col = _lerp(_MA_GOLD_HI, _MA_GOLD_LO, t)
        d.line([(x0, y), (x1, y)], fill=col + (255,))
    d.rectangle([x0, y0, x1, y1], outline=(90, 60, 20, 255))


def _ma_draw_text(img, text, cx, cy, size, fill=(20, 16, 10, 255)):
    font = ImageFont.truetype(PROTOTYPE_FONT, size)
    d = ImageDraw.Draw(img)
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text,
           font=font, fill=fill)


def _ma_name_bar(d, rgb):
    # Rounded strip under the medal; name text is CSS-overlaid.
    x0, y0, x1, y1 = 6, 58, MA_W - 7, MA_H - 4
    mid = (y0 + y1) / 2
    half = max(1, (y1 - y0) / 2)
    hi_rgb = _lerp(rgb, (255, 255, 255), 0.28)
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, y1 - y0)
        base = _lerp(_lerp(rgb, hi_rgb, 0.35), _lerp(rgb, (0, 0, 0), 0.28), t)
        lift = 0.22 * (1 - abs(y - mid) / half)
        col = _lerp(base, hi_rgb, lift)
        d.line([(x0 + 2, y), (x1 - 2, y)], fill=col + (255,))
    d.rounded_rectangle([x0, y0, x1, y1], radius=6,
                        outline=_MA_GOLD + (255,), width=2)


def _ma_icon_segments(size=36):
    """Stacked megastructure blocks — Mason / Underwriter."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    blocks = [
        (6, 22, 30, 32, (210, 218, 224)),
        (10, 12, 26, 22, (186, 198, 208)),
        (13, 4, 23, 12, (243, 226, 178)),
    ]
    for x0, y0, x1, y1, rgb in blocks:
        d.rounded_rectangle([x0, y0, x1, y1], radius=2, fill=rgb + (255,),
                            outline=(20, 22, 28, 255), width=1)
    return img


def _ma_icon_frontier(size=36):
    """Path / bridge into a crater hex — Pathfinder / Cartographer."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # crater field hex
    hx, hy, hr = size * 0.62, size * 0.38, size * 0.28
    d.polygon(_ma_hex_points(hx, hy, hr), fill=(56, 110, 150, 255),
              outline=(20, 24, 30, 255))
    d.ellipse([hx - 4, hy - 3, hx + 5, hy + 4], fill=(30, 70, 100, 255))
    # path from bottom-left
    d.line([(4, size - 4), (size * 0.42, size * 0.62), (hx - 2, hy + 2)],
           fill=(230, 210, 150, 255), width=3)
    d.line([(4, size - 4), (size * 0.42, size * 0.62), (hx - 2, hy + 2)],
           fill=(120, 90, 40, 255), width=1)
    return img


def _ma_icon_assayer(size=36):
    """Prospecting pick over structure plate — Assayer."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # structure plate
    d.rounded_rectangle([4, 14, 20, 30], radius=2, fill=(186, 198, 208, 255),
                        outline=(20, 22, 28, 255), width=1)
    d.polygon([(8, 14), (16, 14), (14, 8), (10, 8)], fill=(243, 226, 178, 255),
              outline=(20, 22, 28, 255))
    # pick
    d.line([(12, 28), (28, 6)], fill=(40, 36, 40, 255), width=3)
    d.arc([18, 2, 34, 18], 200, 340, fill=(40, 36, 40, 255), width=3)
    return img


def _ma_icon_iridium(size=36):
    """Faceted iridium chunk — Refiner."""
    # Reuse the expansion-icon gem scaled down onto a transparent field.
    gem = Image.open(os.path.join(EXP_ICON_DIR, 'expansion_icon_consortium.png')).convert('RGBA')
    gem = gem.resize((size, size), Image.LANCZOS)
    return gem


def _build_ma_milestone(path, number, icon, bar_rgb=_MA_BAR):
    img = _ma_bg()
    d = ImageDraw.Draw(img)
    # left threshold wing
    _ma_gold_wing(d, (16, 16, 48, 44))
    _ma_draw_text(img, str(number), 32, 30, 20)
    # right TM wing
    _ma_gold_wing(d, (92, 16, 124, 44))
    _ma_draw_text(img, 'TM', 108, 30, 16)
    # centre hex medal
    cx, cy, r = 70, 30, 22
    d.polygon(_ma_hex_points(cx, cy, r + 2), fill=_MA_GOLD + (255,))
    d.polygon(_ma_hex_points(cx, cy, r), fill=(170, 172, 176, 255),
              outline=(40, 36, 30, 255))
    icon_s = 28
    icon = icon.resize((icon_s, icon_s), Image.LANCZOS)
    img.paste(icon, (cx - icon_s // 2, cy - icon_s // 2), icon)
    _ma_name_bar(ImageDraw.Draw(img), bar_rgb)
    img.save(path)


def _build_ma_award(path, icon, bar_rgb=(228, 152, 50)):
    img = _ma_bg()
    d = ImageDraw.Draw(img)
    # winged emblem (award style) — mirrors Venuphile / Landlord chrome
    cx, cy = 70, 28
    for sign in (-1, 1):
        base = cx + sign * 16
        pts = [
            (base, cy - 12),
            (base + sign * 28, cy - 6),
            (base + sign * 30, cy + 2),
            (base + sign * 24, cy + 10),
            (base + sign * 4, cy + 8),
            (base, cy + 2),
        ]
        d.polygon(pts, fill=_MA_GOLD + (255,), outline=(90, 60, 20, 255))
    # centre disc
    d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=_MA_GOLD + (255,))
    d.ellipse([cx - 17, cy - 17, cx + 17, cy + 17], fill=(48, 70, 92, 255),
              outline=(20, 24, 30, 255))
    icon_s = 26
    icon = icon.resize((icon_s, icon_s), Image.LANCZOS)
    img.paste(icon, (cx - icon_s // 2, cy - icon_s // 2), icon)
    _ma_name_bar(ImageDraw.Draw(img), bar_rgb)
    img.save(path)


def build_consortium_ma_medals():
    if not os.path.exists(PROTOTYPE_FONT):
        sys.exit(f'missing {PROTOTYPE_FONT}')
    os.makedirs(MA_DIR, exist_ok=True)
    # Expansion icon must exist for Refiner's gem.
    if not os.path.exists(os.path.join(EXP_ICON_DIR, 'expansion_icon_consortium.png')):
        os.makedirs(EXP_ICON_DIR, exist_ok=True)
        build_expansion_icon_consortium(
            os.path.join(EXP_ICON_DIR, 'expansion_icon_consortium.png'))

    _build_ma_milestone(os.path.join(MA_DIR, 'mason.png'), 5, _ma_icon_segments())
    _build_ma_milestone(os.path.join(MA_DIR, 'pathfinder.png'), 3, _ma_icon_frontier())
    _build_ma_milestone(os.path.join(MA_DIR, 'assayer.png'), 6, _ma_icon_assayer())
    _build_ma_award(os.path.join(MA_DIR, 'underwriter.png'), _ma_icon_segments())
    _build_ma_award(os.path.join(MA_DIR, 'cartographer.png'), _ma_icon_frontier())
    _build_ma_award(os.path.join(MA_DIR, 'refiner.png'), _ma_icon_iridium())


# --------------------------------------------------------------------- main

def main():
    if not os.path.exists(HEX_SRC):
        sys.exit(f'missing {HEX_SRC} — run from the repository root')
    os.makedirs(TAG_DIR, exist_ok=True)
    os.makedirs(RES_DIR, exist_ok=True)
    os.makedirs(MEGASTRUCTURE_EMBLEM_DIR, exist_ok=True)
    os.makedirs(SPECIAL_TILE_DIR, exist_ok=True)

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
              (26, 29, 40), 255, (8, 9, 15), 150)
    build_hex(os.path.join(ASSET_DIR, 'hex_crater_field.png'), ring, interior,
              (108, 156, 196), 255, (36, 74, 112), 105, _craters)
    build_hex(os.path.join(ASSET_DIR, 'hex_highland.png'), ring, interior,
              (168, 116, 38), 255, (120, 78, 20), 100, _contours)

    build_iridium(os.path.join(RES_DIR, 'iridium.png'))

    os.makedirs(EXP_ICON_DIR, exist_ok=True)
    build_expansion_icon_consortium(
        os.path.join(EXP_ICON_DIR, 'expansion_icon_consortium.png'))

    build_impact_basin(os.path.join(SPECIAL_TILE_DIR, 'impact_basin.png'))
    build_highland_anchor(os.path.join(SPECIAL_TILE_DIR, 'highland_anchor.png'))
    build_trailhead_camp(os.path.join(SPECIAL_TILE_DIR, 'trailhead_camp.png'))
    build_rim_outpost(os.path.join(SPECIAL_TILE_DIR, 'rim_outpost.png'))
    build_chasm_descent(os.path.join(SPECIAL_TILE_DIR, 'chasm_descent.png'))
    build_basalt_quarry(os.path.join(SPECIAL_TILE_DIR, 'basalt_quarry.png'))
    build_ejecta_blanket(os.path.join(SPECIAL_TILE_DIR, 'ejecta_blanket.png'))
    build_plateau_reservoir(os.path.join(SPECIAL_TILE_DIR, 'plateau_reservoir.png'))
    build_massif_group(os.path.join(SPECIAL_TILE_DIR, 'massif_group.png'))

    emblem_paths = []
    for stem, rgb, shape in _MEGASTRUCTURE_PLACEHOLDERS:
        rel = f'assets/consortium/megastructures/{stem}.png'
        build_megastructure_emblem(os.path.join(ROOT, rel), rgb, shape)
        emblem_paths.append(rel)

    build_consortium_ma_medals()
    ma_paths = [
        'assets/ma/mason.png',
        'assets/ma/pathfinder.png',
        'assets/ma/assayer.png',
        'assets/ma/underwriter.png',
        'assets/ma/cartographer.png',
        'assets/ma/refiner.png',
    ]

    print('generated:')
    for p in ('assets/tags/structure.png', 'assets/tags/prospecting.png',
              'assets/hex_chasm.png', 'assets/hex_crater_field.png',
              'assets/hex_highland.png', 'assets/resources/iridium.png',
              'assets/expansion_icons/expansion_icon_consortium.png',
              'assets/tiles/special_tile_icons/impact_basin.png',
              'assets/tiles/special_tile_icons/highland_anchor.png',
              'assets/tiles/special_tile_icons/trailhead_camp.png',
              'assets/tiles/special_tile_icons/rim_outpost.png',
              'assets/tiles/special_tile_icons/chasm_descent.png',
              'assets/tiles/special_tile_icons/basalt_quarry.png',
              'assets/tiles/special_tile_icons/ejecta_blanket.png',
              'assets/tiles/special_tile_icons/plateau_reservoir.png',
              'assets/tiles/special_tile_icons/massif_group.png',
              *emblem_paths,
              *ma_paths):
        f = os.path.join(ROOT, p)
        im = Image.open(f)
        print(f'  {p:52} {im.size[0]}x{im.size[1]} {im.mode} '
              f'{os.path.getsize(f)} bytes')


if __name__ == '__main__':
    main()
