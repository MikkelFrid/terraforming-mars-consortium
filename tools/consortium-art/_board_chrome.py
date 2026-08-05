"""
Crisp Consortium board chrome (tracks, labels, icons).

Arc angles and radii are calibrated to Tharsis HTML overlays in globs.less
(scaled onto the Consortium board). Planet centre/radius come from the
caller — they must match the REF silhouette so pins land on painted tracks.
"""

from __future__ import annotations

import math
from PIL import Image, ImageChops, ImageDraw, ImageFont

# Logical calibration (891×860) around REF disc centre (461, 431) — the same
# frame as globs.less O2 / temp / Venus HTML pins after Consortium scale.
# Angles are PIL/screen: 0° = east, increasing CCW with y-down.
_CAL_PLANET_R = 304.0
_TRACKS = {
    'oxygen': {
        'start': 132.0, 'end': 214.0, 'r_mid': 415.0, 'half': 12.0,
        'segments': 14, 'fill': (50, 120, 190, 255), 'tick': (255, 140, 70, 230),
    },
    'venus': {
        'start': 225.0, 'end': 307.0, 'r_mid': 390.0, 'half': 12.0,
        'segments': 10, 'fill': (160, 120, 70, 255), 'tick': (230, 200, 140, 200),
    },
    # Temperature wraps past east: 316 → 420 (=60°).
    'temperature': {
        'start': 316.0, 'end': 420.0, 'r_mid': 353.0, 'half': 13.0,
        'segments': 19, 'fill': (60, 160, 200, 255), 'tick': (255, 150, 80, 220),
    },
}
_OUTER_R = 392.0


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
    rad = math.radians(deg)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def _draw_segmented_arc(draw: ImageDraw.ImageDraw, cx, cy, r_outer, r_inner,
                        start_deg, end_deg, fill, tick_rgb, segments: int):
    """Annular arc. end_deg may be >360 to wrap past east."""
    width = max(1, int(round(r_outer - r_inner)))
    r_mid = (r_outer + r_inner) / 2.0
    # PIL accepts end > 360.
    draw.arc(_arc_bbox(cx, cy, r_mid), start=start_deg, end=end_deg,
             fill=fill, width=width)
    span = end_deg - start_deg
    for i in range(segments + 1):
        a = start_deg + span * i / segments
        x0, y0 = _polar(cx, cy, r_inner + 1, a)
        x1, y1 = _polar(cx, cy, r_outer + 2, a)
        draw.line([(x0, y0), (x1, y1)], fill=tick_rgb, width=max(1, width // 8))


def _hexagon(cx, cy, r):
    return [
        (cx + r * math.cos(math.radians(60 * i - 30)),
         cy + r * math.sin(math.radians(60 * i - 30)))
        for i in range(6)
    ]


def _draw_icon_thermometer(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.12,
                        fill=(30, 40, 55, 255), outline=(180, 200, 220, 255),
                        width=max(1, s // 16))
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
    d.polygon(_hexagon(x + s / 2, y + s / 2, s * 0.48),
              fill=(40, 90, 160, 255), outline=(140, 200, 255, 255))
    cx, cy = x + s * 0.5, y + s * 0.42
    d.ellipse([cx - s * 0.16, cy - s * 0.05, cx + s * 0.16, cy + s * 0.28],
              fill=(200, 230, 255, 255))
    d.polygon([(cx, y + s * 0.22), (cx - s * 0.14, cy + s * 0.05),
               (cx + s * 0.14, cy + s * 0.05)], fill=(200, 230, 255, 255))


def _draw_icon_crystal(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    cx, cy = x + s / 2, y + s / 2
    d.polygon([
        (cx, y + s * 0.12), (x + s * 0.82, cy),
        (cx, y + s * 0.88), (x + s * 0.18, cy),
    ], fill=(80, 140, 210, 255), outline=(200, 230, 255, 255))


def _draw_icon_percent(img: Image.Image, x: int, y: int, s: int):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([x, y, x + s, y + s], radius=s * 0.12,
                        fill=(40, 100, 170, 255), outline=(160, 210, 255, 255),
                        width=max(1, s // 14))
    d.text((x + s * 0.18, y + s * 0.12), '%',
           font=_font(max(10, int(s * 0.55))), fill=(240, 250, 255, 255))


def _draw_pointer(draw: ImageDraw.ImageDraw, ring_x, ring_y, outward_deg, size):
    tip = _polar(ring_x, ring_y, size * 0.1, outward_deg + 180)
    base1 = _polar(ring_x, ring_y, size, outward_deg - 28)
    base2 = _polar(ring_x, ring_y, size, outward_deg + 28)
    draw.polygon([tip, base1, base2], fill=(160, 165, 175, 255))


def draw_chrome(base: Image.Image, cx: float, cy: float, planet_r: float) -> Image.Image:
    """
    Paint chrome onto `base` (RGBA).

    `cx, cy, planet_r` must be the calibrated REF silhouette (same space as
    the canvas). Track geometry is scaled from the 891×860 calibration.
    """
    img = base
    scale = planet_r / _CAL_PLANET_R
    outer = _OUTER_R * scale
    gap = planet_r + 6 * scale

    # Dark ring plate between planet and outer chrome.
    ring = Image.new('RGBA', img.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.ellipse(_arc_bbox(cx, cy, outer + 2 * scale), fill=(12, 16, 22, 235))
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).ellipse(_arc_bbox(cx, cy, outer + 2 * scale), fill=255)
    hole = Image.new('L', img.size, 0)
    ImageDraw.Draw(hole).ellipse(_arc_bbox(cx, cy, gap), fill=255)
    ring.putalpha(ImageChops.subtract(mask, hole))
    img.alpha_composite(ring)

    d = ImageDraw.Draw(img)
    d.ellipse(_arc_bbox(cx, cy, outer), outline=(120, 160, 190, 200),
              width=max(1, int(2 * scale)))

    for tr in _TRACKS.values():
        r_mid = tr['r_mid'] * scale
        half = tr['half'] * scale
        _draw_segmented_arc(
            d, cx, cy, r_mid + half, r_mid - half,
            tr['start'], tr['end'],
            fill=tr['fill'], tick_rgb=tr['tick'], segments=tr['segments'])

    icon = max(20, int(round(26 * scale)))
    s = scale

    def place(deg, drawer, r_frac=1.0):
        rr = outer * r_frac
        rx, ry = _polar(cx, cy, rr, deg)
        _draw_pointer(ImageDraw.Draw(img), rx, ry, outward_deg=deg,
                      size=max(6, int(7 * s)))
        x, y = _polar(cx, cy, rr + icon * 0.55, deg)
        drawer(img, int(x - icon / 2), int(y - icon / 2), icon)

    # Icons near Tharsis landmark angles.
    place(180, _draw_icon_thermometer)          # O2 side
    place(0, _draw_icon_crystal)                # right
    place(45, _draw_icon_heat)                  # temp low end
    place(55, _draw_icon_heat)
    place(330, _draw_icon_percent)              # upper-right

    # Oceans droplet near bottom (HTML oceans counter ~ang 99°).
    wx, wy = _polar(cx, cy, outer * 1.06, 95)
    _draw_icon_water(img, int(wx - icon * 0.65), int(wy - icon * 0.55),
                     int(icon * 1.25))

    font = _font(max(14, int(20 * s)))
    small = _font(max(11, int(13 * s)))
    d = ImageDraw.Draw(img)
    ox, oy = _polar(cx, cy, outer * 1.10, 145)
    d.text((ox - 16 * s, oy - 8 * s), 'O2', font=font, fill=(120, 200, 255, 255))
    zx, zy = _polar(cx, cy, _TRACKS['oxygen']['r_mid'] * scale * 1.02, 128)
    d.text((zx - 10 * s, zy - 6 * s), '0%', font=small, fill=(180, 220, 255, 255))
    tx, ty = _polar(cx, cy, outer * 1.08, 75)
    d.text((tx - 14 * s, ty - 8 * s), 't°C', font=font, fill=(120, 200, 255, 255))

    return img
