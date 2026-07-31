"""
Crisp Consortium board chrome (tracks, labels, icons).

Drawn at the output pixel size so O2 / t°C / arcs are sharp — the soft
baked-in chrome from 620×600 mars.png is the main blur source.
Hex / CSS coordinates are unchanged; this only paints under them.
"""

from __future__ import annotations

import math
from PIL import Image, ImageDraw, ImageFont


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    ):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _arc_bbox(cx: float, cy: float, r: float):
    return [cx - r, cy - r, cx + r, cy + r]


def _polar(cx: float, cy: float, r: float, deg: float):
    # Screen degrees: 0 = east, CCW (PIL arcs use this).
    rad = math.radians(deg)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def _draw_segmented_arc(draw: ImageDraw.ImageDraw, cx, cy, r_outer, r_inner,
                        start_deg, end_deg, fill, tick_rgb, segments: int):
    """Annular arc wedge approximated as thick arc + ticks."""
    # PIL arc uses 0° at 3 o'clock, increasing counter-clockwise.
    width = max(1, int(round(r_outer - r_inner)))
    r_mid = (r_outer + r_inner) / 2.0
    draw.arc(_arc_bbox(cx, cy, r_mid), start=start_deg, end=end_deg,
             fill=fill, width=width)
    # Tick marks along the outer edge.
    span = (end_deg - start_deg) % 360
    if span == 0:
        span = 360
    for i in range(segments + 1):
        a = start_deg + span * i / segments
        x0, y0 = _polar(cx, cy, r_inner + 1, a)
        x1, y1 = _polar(cx, cy, r_outer + 2, a)
        draw.line([(x0, y0), (x1, y1)], fill=tick_rgb, width=max(1, width // 8))


def _hexagon(cx, cy, r):
    pts = []
    for i in range(6):
        a = math.radians(60 * i - 30)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def _draw_icon_thermometer(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.12,
                        fill=(30, 40, 55, 255), outline=(180, 200, 220, 255),
                        width=max(1, s // 16))
    # Bulb + stem.
    cx, cy = x + s * 0.5, y + s * 0.68
    d.ellipse([cx - s * 0.16, cy - s * 0.16, cx + s * 0.16, cy + s * 0.16],
              fill=(220, 70, 70, 255))
    d.rectangle([cx - s * 0.07, y + s * 0.18, cx + s * 0.07, cy],
                fill=(200, 210, 230, 255))
    d.rectangle([cx - s * 0.04, y + s * 0.28, cx + s * 0.04, cy],
                fill=(220, 70, 70, 255))


def _draw_icon_heat(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.1,
                        fill=(90, 40, 20, 255), outline=(200, 120, 60, 255),
                        width=max(1, s // 14))
    for i, ox in enumerate((-0.22, 0.0, 0.22)):
        path = []
        for t in range(8):
            py = y + s * (0.22 + 0.55 * t / 7)
            px = x + s * (0.5 + ox + 0.06 * math.sin(t * 1.2 + i))
            path.append((px, py))
        d.line(path, fill=(255, 170, 60, 255), width=max(2, s // 10))


def _draw_icon_water(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    pts = _hexagon(x + s / 2, y + s / 2, s * 0.48)
    d.polygon(pts, fill=(40, 90, 160, 255), outline=(140, 200, 255, 255))
    # Droplet.
    cx, cy = x + s * 0.5, y + s * 0.42
    d.ellipse([cx - s * 0.16, cy - s * 0.05, cx + s * 0.16, cy + s * 0.28],
              fill=(200, 230, 255, 255))
    d.polygon([(cx, y + s * 0.22), (cx - s * 0.14, cy + s * 0.05),
               (cx + s * 0.14, cy + s * 0.05)], fill=(200, 230, 255, 255))


def _draw_icon_crystal(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    cx, cy = x + s / 2, y + s / 2
    d.polygon([
        (cx, y + s * 0.12),
        (x + s * 0.82, cy),
        (cx, y + s * 0.88),
        (x + s * 0.18, cy),
    ], fill=(80, 140, 210, 255), outline=(200, 230, 255, 255))
    d.line([(cx, y + s * 0.12), (cx, y + s * 0.88)],
           fill=(180, 220, 255, 200), width=max(1, s // 18))


def _draw_icon_percent(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.12,
                        fill=(40, 100, 170, 255), outline=(160, 210, 255, 255),
                        width=max(1, s // 14))
    font = _font(max(10, int(s * 0.55)))
    d.text((x + s * 0.18, y + s * 0.12), '%', font=font, fill=(240, 250, 255, 255))


def _draw_pointer(draw: ImageDraw.ImageDraw, ring_x, ring_y, outward_deg, size):
    """Grey triangle on the outside of the ring, tip pointing inward."""
    tip = _polar(ring_x, ring_y, size * 0.1, outward_deg + 180)
    base1 = _polar(ring_x, ring_y, size, outward_deg - 28)
    base2 = _polar(ring_x, ring_y, size, outward_deg + 28)
    draw.polygon([tip, base1, base2], fill=(160, 165, 175, 255))


def draw_chrome(base: Image.Image, cx: float, cy: float, planet_r: float) -> Image.Image:
    """
    Paint Consortium chrome onto `base` (RGBA). Returns the same image.

    Geometry is relative to the planet disc so it stays locked when the
    canvas scale changes. HTML global-number overlays still use CSS.
    """
    img = base
    d = ImageDraw.Draw(img)
    # Ring radii (outside the planet).
    r0 = planet_r + planet_r * 0.035   # gap
    r1 = planet_r + planet_r * 0.085   # inner track
    r2 = planet_r + planet_r * 0.155   # outer track
    r3 = planet_r + planet_r * 0.175   # hairline

    # Hairline outer ring.
    d.ellipse(_arc_bbox(cx, cy, r3), outline=(120, 160, 190, 180),
              width=max(1, int(planet_r * 0.006)))

    # Dark ring plate under tracks.
    ring = Image.new('RGBA', img.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse(_arc_bbox(cx, cy, r2 + 2), fill=(12, 16, 22, 230))
    rd.ellipse(_arc_bbox(cx, cy, r0 - 1), fill=(0, 0, 0, 0))
    # Cut hole with planet+gap.
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).ellipse(_arc_bbox(cx, cy, r2 + 2), fill=255)
    hole = Image.new('L', img.size, 0)
    ImageDraw.Draw(hole).ellipse(_arc_bbox(cx, cy, r0 - 1), fill=255)
    from PIL import ImageChops
    mask = ImageChops.subtract(mask, hole)
    ring.putalpha(mask)
    img.alpha_composite(ring)

    d = ImageDraw.Draw(img)

    # Track arcs — angles chosen to match Tharsis chrome layout roughly.
    # PIL: 0° = 3 o'clock, CCW.
    # O2 track (lower-left): ~120° to ~210°
    _draw_segmented_arc(d, cx, cy, r2, r1, 120, 210,
                        fill=(50, 120, 190, 255), tick_rgb=(255, 140, 70, 230),
                        segments=9)
    # Top sandy/venus-ish track: ~220° to ~320°
    _draw_segmented_arc(d, cx, cy, r2, r1, 220, 320,
                        fill=(160, 120, 70, 255), tick_rgb=(230, 200, 140, 200),
                        segments=10)
    # Upper-right % track: ~320° to ~20°
    _draw_segmented_arc(d, cx, cy, r2, r1, 320, 20,
                        fill=(70, 150, 190, 255), tick_rgb=(200, 230, 255, 200),
                        segments=5)
    # Right purple track: ~20° to ~70°
    _draw_segmented_arc(d, cx, cy, r2, r1, 20, 70,
                        fill=(120, 50, 140, 255), tick_rgb=(220, 120, 180, 200),
                        segments=6)
    # Temperature track (lower-right): ~70° to ~115°
    _draw_segmented_arc(d, cx, cy, r2, r1, 70, 115,
                        fill=(60, 160, 200, 255), tick_rgb=(255, 150, 80, 220),
                        segments=5)

    # Scale factor vs a ~251px source disc radius.
    s = planet_r / 251.05
    icon = max(22, int(round(28 * s)))

    # Icons around the ring (outward).
    def place(deg, drawer, radial=1.12):
        rx, ry = _polar(cx, cy, r2 + 2, deg)
        _draw_pointer(ImageDraw.Draw(img), rx, ry, outward_deg=deg,
                      size=max(6, int(8 * s)))
        x, y = _polar(cx, cy, r2 * radial + icon * 0.35, deg)
        drawer(img, int(x - icon / 2), int(y - icon / 2), icon)

    place(180, _draw_icon_thermometer)   # 9 o'clock
    place(0, _draw_icon_crystal)         # 3 o'clock
    place(48, _draw_icon_heat)
    place(62, _draw_icon_heat)
    place(350, _draw_icon_percent)       # ~2 o'clock

    # Water drop at 6 o'clock — slightly larger, no duplicate pointer clutter.
    wx, wy = _polar(cx, cy, r2 * 1.14, 90)
    _draw_icon_water(img, int(wx - icon * 0.65), int(wy - icon * 0.55),
                     int(icon * 1.25))

    # Crisp labels.
    font = _font(max(14, int(22 * s)))
    d = ImageDraw.Draw(img)
    # O2
    ox, oy = _polar(cx, cy, r2 * 1.22, 145)
    d.text((ox - 18 * s, oy - 8 * s), 'O2', font=font, fill=(120, 200, 255, 255))
    # 0%
    zx, zy = _polar(cx, cy, r2 * 1.05, 125)
    small = _font(max(11, int(14 * s)))
    d.text((zx - 10 * s, zy - 6 * s), '0%', font=small, fill=(180, 220, 255, 255))
    # t°C
    tx, ty = _polar(cx, cy, r2 * 1.22, 100)
    d.text((tx - 16 * s, ty - 8 * s), 't°C', font=font, fill=(120, 200, 255, 255))

    return img
