"""
SVG Consortium board chrome (tracks / labels / icons).

Hybrid pipeline: DEM hillshade planet (_board_dem.py) + this SVG chrome,
composited in build_board.py → mars_consortium.png. Geometry contracts
(OFFSET / DISC / track arcs) stay locked to the HTML pin frame.

    python3 tools/consortium-art/build_board.py
"""

from __future__ import annotations

import math
import os
import random
import subprocess

# Logical canvas (CSS). Rasterized at 2× by the caller.
BOARD_W, BOARD_H = 891, 860
# Calibrated REF disc (same as build_board.DISC_* → logical).
DISC_CX, DISC_CY, DISC_R = 461.0, 431.0, 304.0

# Track calibration — mirrors _board_chrome._TRACKS (0°=east, +CW on screen).
_TRACKS = {
    'oxygen': {
        'start': 132.0, 'end': 214.0, 'r_mid': 415.0, 'half': 12.0,
        'segments': 14,
        'c0': '#1e5a9a', 'c1': '#5eb4f0', 'tick': '#ff9a4a',
    },
    'venus': {
        'start': 225.0, 'end': 307.0, 'r_mid': 390.0, 'half': 12.0,
        'segments': 10,
        'c0': '#8a6028', 'c1': '#e0c078', 'tick': '#f0d8a0',
    },
    'temperature': {
        'start': 316.0, 'end': 420.0, 'r_mid': 353.0, 'half': 13.0,
        'segments': 19,
        'c0': '#1e88a8', 'c1': '#6ed4f0', 'tick': '#ffaa60',
    },
}
_OUTER_R = 392.0


def _polar(cx: float, cy: float, r: float, deg: float):
    rad = math.radians(deg)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def _annular_sector(cx, cy, r_out, r_in, start, end) -> str:
    span = end - start
    large = 1 if span > 180 else 0
    x0, y0 = _polar(cx, cy, r_out, start)
    x1, y1 = _polar(cx, cy, r_out, end)
    x2, y2 = _polar(cx, cy, r_in, end)
    x3, y3 = _polar(cx, cy, r_in, start)
    return (
        f'M{x0:.2f},{y0:.2f} '
        f'A{r_out:.2f},{r_out:.2f} 0 {large} 1 {x1:.2f},{y1:.2f} '
        f'L{x2:.2f},{y2:.2f} '
        f'A{r_in:.2f},{r_in:.2f} 0 {large} 0 {x3:.2f},{y3:.2f} Z'
    )


def _arc_ticks(cx, cy, r_in, r_out, start, end, n, color, width=1.2) -> str:
    span = end - start
    parts = []
    for i in range(n + 1):
        a = start + span * i / n
        x0, y0 = _polar(cx, cy, r_in + 0.5, a)
        x1, y1 = _polar(cx, cy, r_out + 1.5, a)
        parts.append(
            f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
            f'stroke="{color}" stroke-width="{width}" stroke-linecap="round" '
            f'stroke-opacity="0.85"/>'
        )
    return '\n'.join(parts)


def _P(cx, cy, r, u, v):
    return cx + u * r, cy + v * r


def _crater(cx, cy, r, u, v, size, depth, gid) -> str:
    ccx, ccy = _P(cx, cy, r, u, v)
    cr = size * r
    return f'''
    <radialGradient id="{gid}" cx="36%" cy="32%" r="68%">
      <stop offset="0%" stop-color="#4a281c" stop-opacity="{0.75 * depth:.2f}"/>
      <stop offset="48%" stop-color="#6a3828" stop-opacity="{0.45 * depth:.2f}"/>
      <stop offset="78%" stop-color="#e8b888" stop-opacity="{0.70 * depth:.2f}"/>
      <stop offset="92%" stop-color="#f0d0a8" stop-opacity="{0.35 * depth:.2f}"/>
      <stop offset="100%" stop-color="#c08050" stop-opacity="0"/>
    </radialGradient>
    <ellipse cx="{ccx:.2f}" cy="{ccy:.2f}" rx="{cr:.2f}" ry="{cr * 0.90:.2f}"
             fill="url(#{gid})"/>
    <ellipse cx="{ccx - cr * 0.12:.2f}" cy="{ccy - cr * 0.15:.2f}"
             rx="{cr * 0.22:.2f}" ry="{cr * 0.14:.2f}"
             fill="#e8c098" opacity="{0.12 * depth:.2f}"/>
    '''


def _crater_field(cx, cy, r, seed: int) -> str:
    rng = random.Random(seed)
    # Hand-placed landmark craters + seeded fill.
    landmarks = [
        (0.12, -0.38, 0.085, 1.0),
        (-0.42, -0.18, 0.070, 0.95),
        (0.48, 0.12, 0.060, 0.9),
        (-0.18, 0.42, 0.055, 0.85),
        (0.30, 0.48, 0.045, 0.8),
        (-0.55, 0.22, 0.040, 0.75),
        (0.05, 0.55, 0.038, 0.7),
        (-0.28, -0.48, 0.042, 0.8),
    ]
    parts = ['<g id="craters" clip-path="url(#planetClip)">']
    i = 0
    for u, v, size, depth in landmarks:
        parts.append(_crater(cx, cy, r, u, v, size, depth, f'crl{i}'))
        i += 1
    for _ in range(55):
        size = rng.uniform(0.010, 0.038)
        cd = rng.uniform(0.12, 0.88)
        ang = rng.uniform(0, 360)
        rad = math.radians(ang)
        u, v = cd * math.cos(rad), cd * math.sin(rad)
        # Keep clear of canyon belt.
        if abs(v - 0.08) < 0.06 and abs(u) < 0.7:
            continue
        parts.append(_crater(cx, cy, r, u, v, size, rng.uniform(0.5, 0.95), f'cr{i}'))
        i += 1
    parts.append('</g>')
    return '\n'.join(parts)


def _canyon_paths(cx, cy, r) -> str:
    def chain(uvs):
        pts = [_P(cx, cy, r, u, v) for u, v in uvs]
        d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
        i = 1
        while i < len(pts):
            if i + 1 < len(pts):
                d += f' Q{pts[i][0]:.1f},{pts[i][1]:.1f} {pts[i+1][0]:.1f},{pts[i+1][1]:.1f}'
                i += 2
            else:
                d += f' L{pts[i][0]:.1f},{pts[i][1]:.1f}'
                i += 1
        return d

    main = chain([
        (-0.82, 0.04), (-0.62, -0.02), (-0.42, 0.08),
        (-0.22, 0.02), (-0.02, 0.10), (0.18, 0.04),
        (0.38, 0.14), (0.58, 0.08), (0.78, 0.16), (0.88, 0.12),
    ])
    br1 = chain([
        (0.08, 0.08), (0.22, 0.22), (0.34, 0.34), (0.48, 0.42), (0.58, 0.48),
    ])
    br2 = chain([
        (-0.30, 0.05), (-0.38, 0.18), (-0.42, 0.30), (-0.36, 0.40),
    ])
    br3 = chain([
        (0.40, 0.12), (0.52, -0.02), (0.62, -0.10),
    ])

    def stroke(d, w, color, op, blur=False, dy=0.0):
        filt = ' filter="url(#softBlur)"' if blur else ''
        tr = f' transform="translate(0 {dy:.2f})"' if dy else ''
        return (
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w:.2f}" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity="{op}"{filt}{tr}/>'
        )

    w = r * 0.038
    parts = ['<g id="canyons" clip-path="url(#planetClip)">']
    for d, ww in ((main, w), (br1, w * 0.62), (br2, w * 0.48), (br3, w * 0.40)):
        parts.append(stroke(d, ww * 2.2, '#2a1610', 0.55, blur=True))
        parts.append(stroke(d, ww * 1.15, '#1a0e0a', 0.92))
        parts.append(stroke(d, ww * 0.55, '#3a2218', 0.85))
        parts.append(stroke(d, ww * 0.28, '#f0c8a0', 0.40, dy=-ww * 0.45))
        parts.append(stroke(d, ww * 0.16, '#2a1810', 0.50, dy=ww * 0.35))
    parts.append('</g>')
    return '\n'.join(parts)


def _ridge_lines(cx, cy, r, seed: int) -> str:
    rng = random.Random(seed + 3)
    parts = ['<g id="ridges" clip-path="url(#planetClip)" opacity="0.55" fill="none" '
             'stroke-linecap="round">']
    for i in range(28):
        u0 = rng.uniform(-0.75, 0.75)
        v0 = rng.uniform(-0.75, 0.75)
        if u0 * u0 + v0 * v0 > 0.72:
            continue
        ang = rng.uniform(0, 360)
        length = rng.uniform(0.08, 0.22)
        u1 = u0 + length * math.cos(math.radians(ang))
        v1 = v0 + length * math.sin(math.radians(ang))
        x0, y0 = _P(cx, cy, r, u0, v0)
        x1, y1 = _P(cx, cy, r, (u0 + u1) / 2 + rng.uniform(-0.02, 0.02),
                    (v0 + v1) / 2 + rng.uniform(-0.02, 0.02))
        x2, y2 = _P(cx, cy, r, u1, v1)
        parts.append(
            f'<path d="M{x0:.1f},{y0:.1f} Q{x1:.1f},{y1:.1f} {x2:.1f},{y2:.1f}" '
            f'stroke="#f0d0a8" stroke-width="{0.6 + rng.random():.2f}" '
            f'opacity="{0.25 + 0.35 * rng.random():.2f}"/>'
        )
    parts.append('</g>')
    return '\n'.join(parts)


def _volcanoes(cx, cy, r) -> str:
    """Tharsis-like shield volcanoes — soft cones with bright summits."""
    cones = [
        (-0.38, -0.28, 0.09),
        (-0.28, -0.38, 0.07),
        (-0.48, -0.18, 0.06),
        (-0.22, -0.22, 0.05),
    ]
    parts = ['<g id="volcanoes" clip-path="url(#planetClip)">']
    for i, (u, v, s) in enumerate(cones):
        px, py = _P(cx, cy, r, u, v)
        rx, ry = s * r, s * r * 0.78
        parts.append(f'''
        <radialGradient id="vol{i}" cx="42%" cy="38%" r="60%">
          <stop offset="0%" stop-color="#fff0d8" stop-opacity="0.85"/>
          <stop offset="35%" stop-color="#e0a878" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#8a4828" stop-opacity="0"/>
        </radialGradient>
        <ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="url(#vol{i})"/>
        <ellipse cx="{px - rx * 0.05:.1f}" cy="{py - ry * 0.15:.1f}"
                 rx="{rx * 0.18:.1f}" ry="{ry * 0.12:.1f}" fill="#fff8f0" opacity="0.45"/>
        ''')
    parts.append('</g>')
    return '\n'.join(parts)


def _highland_blobs(cx, cy, r) -> str:
    centres = [
        (-0.35, -0.28, 0.28), (-0.18, -0.42, 0.14),
        (0.22, -0.48, 0.11), (-0.58, 0.30, 0.12),
        (0.45, 0.38, 0.10), (0.10, -0.15, 0.09),
    ]
    parts = ['<g id="highlands" clip-path="url(#planetClip)" opacity="0.85">']
    for i, (u, v, rr) in enumerate(centres):
        px, py = _P(cx, cy, r, u, v)
        parts.append(
            f'<ellipse cx="{px:.1f}" cy="{py:.1f}" '
            f'rx="{rr * r:.1f}" ry="{rr * r * 0.82:.1f}" '
            f'fill="url(#highlandGrad)" opacity="{0.50 + 0.08 * (i % 3)}"/>'
        )
    parts.append('</g>')
    return '\n'.join(parts)


def _chasm_belts(cx, cy, r) -> str:
    """Subtle Consortium sector scars — thin rift strokes, not loud wedges."""
    parts = ['<g id="chasmBelts" clip-path="url(#planetClip)" fill="none" '
             'stroke-linecap="round">']
    for sb in (90.0, 210.0, 330.0):
        # Radial stroke from mid-disc to rim, with slight wobble via quadratic.
        x0, y0 = _polar(cx, cy, r * 0.38, sb)
        xm, ym = _polar(cx, cy, r * 0.68, sb + 3.5)
        x1, y1 = _polar(cx, cy, r * 0.96, sb - 2.0)
        d = f'M{x0:.1f},{y0:.1f} Q{xm:.1f},{ym:.1f} {x1:.1f},{y1:.1f}'
        parts.append(
            f'<path d="{d}" stroke="#1a100e" stroke-width="{r * 0.045:.2f}" opacity="0.55" '
            f'filter="url(#softBlur)"/>'
        )
        parts.append(
            f'<path d="{d}" stroke="#2a1814" stroke-width="{r * 0.022:.2f}" opacity="0.75"/>'
        )
        parts.append(
            f'<path d="{d}" stroke="#9ab0c4" stroke-width="{r * 0.006:.2f}" opacity="0.25"/>'
        )
    parts.append('</g>')
    return '\n'.join(parts)


def _albedo_continents(cx, cy, r) -> str:
    """Large vector albedo masses — readable geology under hexes."""
    blobs = [
        # Dark lowlands (Acidalia-ish)
        (0.15, -0.55, 0.32, 0.18, '#5a3020', 0.40),
        (0.45, -0.25, 0.20, 0.28, '#4a2818', 0.35),
        # Bright plains
        (-0.10, 0.35, 0.35, 0.22, '#d4a070', 0.30),
        (0.55, 0.25, 0.18, 0.16, '#c88858', 0.28),
        (-0.60, -0.05, 0.16, 0.22, '#b87848', 0.25),
    ]
    parts = ['<g id="albedo" clip-path="url(#planetClip)">']
    for i, (u, v, rx, ry, color, op) in enumerate(blobs):
        px, py = _P(cx, cy, r, u, v)
        parts.append(
            f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{rx * r:.1f}" ry="{ry * r:.1f}" '
            f'fill="{color}" opacity="{op}" filter="url(#softBlur)"/>'
        )
    parts.append('</g>')
    return '\n'.join(parts)


def _polar_cap(cx, cy, r) -> str:
    px, py = _P(cx, cy, r, -0.05, -0.78)
    return f'''
    <g id="polarCap" clip-path="url(#planetClip)">
      <radialGradient id="iceGrad" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#f8f4f0" stop-opacity="0.85"/>
        <stop offset="55%" stop-color="#d8c8c0" stop-opacity="0.40"/>
        <stop offset="100%" stop-color="#a08070" stop-opacity="0"/>
      </radialGradient>
      <ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{r * 0.22:.1f}" ry="{r * 0.12:.1f}"
               fill="url(#iceGrad)"/>
    </g>'''


def _icon_thermometer(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.14:.1f}" fill="url(#iconSteel)"
            stroke="#d0e4f4" stroke-width="1.5"/>
      <rect x="{s*0.08:.1f}" y="{s*0.08:.1f}" width="{s*0.84:.1f}" height="{s*0.84:.1f}"
            rx="{s*0.10:.1f}" fill="none" stroke="#6a88a8" stroke-width="0.7" opacity="0.7"/>
      <circle cx="{s*0.5:.1f}" cy="{s*0.70:.1f}" r="{s*0.18:.1f}" fill="#c02020"/>
      <circle cx="{s*0.5:.1f}" cy="{s*0.70:.1f}" r="{s*0.10:.1f}" fill="#ff6868" opacity="0.7"/>
      <rect x="{s*0.42:.1f}" y="{s*0.14:.1f}" width="{s*0.16:.1f}" height="{s*0.54:.1f}"
            rx="2" fill="#eef4fa"/>
      <rect x="{s*0.46:.1f}" y="{s*0.28:.1f}" width="{s*0.08:.1f}" height="{s*0.42:.1f}"
            fill="#e84848"/>
      <line x1="{s*0.62:.1f}" y1="{s*0.22:.1f}" x2="{s*0.70:.1f}" y2="{s*0.22:.1f}"
            stroke="#9ab0c4" stroke-width="0.8"/>
      <line x1="{s*0.62:.1f}" y1="{s*0.34:.1f}" x2="{s*0.68:.1f}" y2="{s*0.34:.1f}"
            stroke="#9ab0c4" stroke-width="0.8"/>
      <line x1="{s*0.62:.1f}" y1="{s*0.46:.1f}" x2="{s*0.70:.1f}" y2="{s*0.46:.1f}"
            stroke="#9ab0c4" stroke-width="0.8"/>
    </g>'''


def _icon_heat(x, y, s) -> str:
    flames = []
    cols = ('#ffcc66', '#ff9a3c', '#ffcc66')
    for i, ox in enumerate((-0.24, 0.0, 0.24)):
        pts = []
        for t in range(10):
            py = s * (0.18 + 0.62 * t / 9)
            px = s * (0.5 + ox + 0.08 * math.sin(t * 1.35 + i * 0.8))
            pts.append(f'{px:.1f},{py:.1f}')
        flames.append(
            f'<polyline points="{" ".join(pts)}" fill="none" stroke="{cols[i]}" '
            f'stroke-width="{max(2.0, s/10):.1f}" stroke-linecap="round"/>'
        )
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.12:.1f}" fill="url(#iconHeat)"
            stroke="#f0a860" stroke-width="1.5"/>
      <rect x="{s*0.1:.1f}" y="{s*0.1:.1f}" width="{s*0.8:.1f}" height="{s*0.8:.1f}"
            rx="{s*0.08:.1f}" fill="none" stroke="#ffc080" stroke-width="0.6" opacity="0.45"/>
      {''.join(flames)}
    </g>'''


def _icon_water(x, y, s) -> str:
    hex_pts = ' '.join(
        f'{s/2 + s*0.48*math.cos(math.radians(60*i-30)):.1f},'
        f'{s/2 + s*0.48*math.sin(math.radians(60*i-30)):.1f}'
        for i in range(6)
    )
    hex_in = ' '.join(
        f'{s/2 + s*0.38*math.cos(math.radians(60*i-30)):.1f},'
        f'{s/2 + s*0.38*math.sin(math.radians(60*i-30)):.1f}'
        for i in range(6)
    )
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <polygon points="{hex_pts}" fill="url(#iconWater)" stroke="#b8e0ff" stroke-width="1.6"/>
      <polygon points="{hex_in}" fill="none" stroke="#6ab0e8" stroke-width="0.7" opacity="0.6"/>
      <ellipse cx="{s*0.5:.1f}" cy="{s*0.52:.1f}" rx="{s*0.17:.1f}" ry="{s*0.20:.1f}" fill="#e8f4ff"/>
      <polygon points="{s*0.5:.1f},{s*0.18:.1f} {s*0.33:.1f},{s*0.50:.1f} {s*0.67:.1f},{s*0.50:.1f}"
               fill="#e8f4ff"/>
      <ellipse cx="{s*0.42:.1f}" cy="{s*0.48:.1f}" rx="{s*0.05:.1f}" ry="{s*0.08:.1f}"
               fill="#ffffff" opacity="0.55"/>
    </g>'''


def _icon_crystal(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <polygon points="{s*0.5:.1f},{s*0.08:.1f} {s*0.86:.1f},{s*0.5:.1f} {s*0.5:.1f},{s*0.92:.1f} {s*0.14:.1f},{s*0.5:.1f}"
               fill="url(#iconCrystal)" stroke="#e0f0ff" stroke-width="1.5"/>
      <polygon points="{s*0.5:.1f},{s*0.20:.1f} {s*0.70:.1f},{s*0.5:.1f} {s*0.5:.1f},{s*0.74:.1f}"
               fill="#c8e8ff" opacity="0.55"/>
      <polygon points="{s*0.5:.1f},{s*0.20:.1f} {s*0.30:.1f},{s*0.5:.1f} {s*0.5:.1f},{s*0.74:.1f}"
               fill="#2080c8" opacity="0.35"/>
      <line x1="{s*0.5:.1f}" y1="{s*0.08:.1f}" x2="{s*0.5:.1f}" y2="{s*0.92:.1f}"
            stroke="#ffffff" stroke-width="0.7" opacity="0.35"/>
    </g>'''


def _icon_percent(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.14:.1f}" fill="url(#iconSteel)"
            stroke="#c0e0ff" stroke-width="1.5"/>
      <circle cx="{s*0.32:.1f}" cy="{s*0.32:.1f}" r="{s*0.10:.1f}" fill="none"
              stroke="#f4faff" stroke-width="{max(1.4, s*0.06):.1f}"/>
      <circle cx="{s*0.68:.1f}" cy="{s*0.68:.1f}" r="{s*0.10:.1f}" fill="none"
              stroke="#f4faff" stroke-width="{max(1.4, s*0.06):.1f}"/>
      <line x1="{s*0.72:.1f}" y1="{s*0.22:.1f}" x2="{s*0.28:.1f}" y2="{s*0.78:.1f}"
            stroke="#f4faff" stroke-width="{max(1.6, s*0.07):.1f}" stroke-linecap="round"/>
    </g>'''


def _icon_card(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.12:.1f}" fill="url(#iconSteel)"
            stroke="#c8dcec" stroke-width="1.3"/>
      <rect x="{s*0.22:.1f}" y="{s*0.16:.1f}" width="{s*0.56:.1f}" height="{s*0.68:.1f}"
            rx="{s*0.06:.1f}" fill="#1a4068" stroke="#a0c8e8" stroke-width="1"/>
      <rect x="{s*0.30:.1f}" y="{s*0.28:.1f}" width="{s*0.40:.1f}" height="{s*0.08:.1f}"
            rx="1" fill="#7ecfff" opacity="0.8"/>
      <rect x="{s*0.30:.1f}" y="{s*0.42:.1f}" width="{s*0.40:.1f}" height="{s*0.06:.1f}"
            rx="1" fill="#5aa0d0" opacity="0.7"/>
      <rect x="{s*0.30:.1f}" y="{s*0.54:.1f}" width="{s*0.28:.1f}" height="{s*0.06:.1f}"
            rx="1" fill="#5aa0d0" opacity="0.55"/>
    </g>'''


def _icon_plant(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.12:.1f}" fill="#1a3820"
            stroke="#80c878" stroke-width="1.3"/>
      <path d="M{s*0.5:.1f},{s*0.78:.1f} Q{s*0.5:.1f},{s*0.45:.1f} {s*0.5:.1f},{s*0.22:.1f}"
            fill="none" stroke="#6aad50" stroke-width="{max(1.6, s*0.07):.1f}"/>
      <ellipse cx="{s*0.34:.1f}" cy="{s*0.40:.1f}" rx="{s*0.16:.1f}" ry="{s*0.10:.1f}"
               fill="#7ecc60" transform="rotate(-35 {s*0.34:.1f} {s*0.40:.1f})"/>
      <ellipse cx="{s*0.66:.1f}" cy="{s*0.36:.1f}" rx="{s*0.16:.1f}" ry="{s*0.10:.1f}"
               fill="#90e070" transform="rotate(35 {s*0.66:.1f} {s*0.36:.1f})"/>
      <ellipse cx="{s*0.50:.1f}" cy="{s*0.24:.1f}" rx="{s*0.12:.1f}" ry="{s*0.08:.1f}"
               fill="#a8f088"/>
    </g>'''


def _pointer(cx, cy, deg, size) -> str:
    tip = _polar(cx, cy, size * 0.08, deg + 180)
    b1 = _polar(cx, cy, size, deg - 26)
    b2 = _polar(cx, cy, size, deg + 26)
    mid = _polar(cx, cy, size * 0.55, deg)
    return (
        f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {b1[0]:.1f},{b1[1]:.1f} '
        f'{b2[0]:.1f},{b2[1]:.1f}" fill="#c8ced8" stroke="#e8eef4" stroke-width="0.6"/>'
        f'<circle cx="{mid[0]:.1f}" cy="{mid[1]:.1f}" r="{size*0.18:.1f}" '
        f'fill="#8a929e"/>'
    )


def _segmented_track(cx, cy, tr, scale, name) -> str:
    """Per-cell annular segments with glass bevel — denser than a flat arc."""
    r_mid = tr['r_mid'] * scale
    half = tr['half'] * scale
    r_out, r_in = r_mid + half, r_mid - half
    start, end = tr['start'], tr['end']
    n = tr['segments']
    span = end - start
    parts = [f'<g id="track_{name}">']
    # Soft glow under whole track.
    glow = _annular_sector(cx, cy, r_out + 4 * scale, r_in - 3 * scale, start, end)
    parts.append(
        f'<path d="{glow}" fill="{tr["c1"]}" opacity="0.16" filter="url(#softBlur)"/>'
    )
    # Track bed (dark channel).
    bed = _annular_sector(cx, cy, r_out + 1.5 * scale, r_in - 1.5 * scale, start, end)
    parts.append(f'<path d="{bed}" fill="#0a121c" opacity="0.85"/>')
    # Individual cells.
    gap_deg = span * 0.012
    for i in range(n):
        a0 = start + span * i / n + gap_deg * 0.5
        a1 = start + span * (i + 1) / n - gap_deg * 0.5
        if a1 <= a0:
            continue
        # Color ramp along track.
        t = i / max(n - 1, 1)
        cell = _annular_sector(cx, cy, r_out, r_in, a0, a1)
        # Alternate cell brightness for machined look.
        op = 0.92 if i % 2 == 0 else 0.78
        parts.append(
            f'<path d="{cell}" fill="url(#grad_{name})" opacity="{op:.2f}"/>'
        )
        # Glass top highlight per cell.
        hi = _annular_sector(cx, cy, r_out - 0.8 * scale, r_out - half * 0.55, a0, a1)
        parts.append(f'<path d="{hi}" fill="#ffffff" opacity="0.16"/>')
        # Inner shadow.
        sh = _annular_sector(cx, cy, r_in + half * 0.45, r_in + 0.6 * scale, a0, a1)
        parts.append(f'<path d="{sh}" fill="#000000" opacity="0.18"/>')
    # Major ticks (every segment) + minor mid-ticks.
    for i in range(n + 1):
        a = start + span * i / n
        x0, y0 = _polar(cx, cy, r_in - 1.5 * scale, a)
        x1, y1 = _polar(cx, cy, r_out + 2.5 * scale, a)
        w = max(1.1, 1.35 * scale) if i % 2 == 0 else max(0.7, 0.85 * scale)
        parts.append(
            f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
            f'stroke="{tr["tick"]}" stroke-width="{w:.2f}" stroke-linecap="round" '
            f'stroke-opacity="0.90"/>'
        )
        if i < n:
            am = start + span * (i + 0.5) / n
            mx0, my0 = _polar(cx, cy, r_in + 1, am)
            mx1, my1 = _polar(cx, cy, r_out - 1, am)
            parts.append(
                f'<line x1="{mx0:.2f}" y1="{my0:.2f}" x2="{mx1:.2f}" y2="{my1:.2f}" '
                f'stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.18"/>'
            )
    # Outer rim stroke on track.
    rim = _annular_sector(cx, cy, r_out, r_in, start, end)
    parts.append(
        f'<path d="{rim}" fill="none" stroke="#e8f4ff" stroke-opacity="0.45" '
        f'stroke-width="0.9"/>'
    )
    parts.append('</g>')
    return '\n'.join(parts)


def _ring_rivets(cx, cy, radius, count, size, color='#6a8098') -> str:
    parts = []
    for i in range(count):
        a = 360.0 * i / count
        x, y = _polar(cx, cy, radius, a)
        parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{size:.2f}" fill="{color}" '
            f'stroke="#a8c0d4" stroke-width="0.5" opacity="0.85"/>'
        )
        parts.append(
            f'<circle cx="{x - size*0.25:.2f}" cy="{y - size*0.25:.2f}" '
            f'r="{size*0.35:.2f}" fill="#d0e0f0" opacity="0.35"/>'
        )
    return '\n'.join(parts)


def _hash_marks(cx, cy, r_in, r_out, start, end, step, color, width=0.7) -> str:
    parts = []
    a = start
    while a <= end + 0.01:
        x0, y0 = _polar(cx, cy, r_in, a)
        x1, y1 = _polar(cx, cy, r_out, a)
        parts.append(
            f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
            f'stroke="{color}" stroke-width="{width}" stroke-opacity="0.55"/>'
        )
        a += step
    return '\n'.join(parts)


def _consortium_emblem(cx, cy, s) -> str:
    """Small hex emblem — Consortium mark near Venus track."""
    pts = ' '.join(
        f'{cx + s*math.cos(math.radians(60*i-30)):.1f},'
        f'{cy + s*math.sin(math.radians(60*i-30)):.1f}'
        for i in range(6)
    )
    pts2 = ' '.join(
        f'{cx + s*0.62*math.cos(math.radians(60*i-30)):.1f},'
        f'{cy + s*0.62*math.sin(math.radians(60*i-30)):.1f}'
        for i in range(6)
    )
    return f'''<g id="emblem">
      <polygon points="{pts}" fill="#1a2838" stroke="#c8a878" stroke-width="1.4"/>
      <polygon points="{pts2}" fill="none" stroke="#e0c090" stroke-width="0.8"/>
      <circle cx="{cx}" cy="{cy}" r="{s*0.22:.1f}" fill="#c8a878"/>
      <circle cx="{cx}" cy="{cy}" r="{s*0.10:.1f}" fill="#1a2838"/>
    </g>'''


def _chrome(cx, cy, planet_r) -> str:
    scale = planet_r / DISC_R
    outer = _OUTER_R * scale
    gap = planet_r + 5.5 * scale
    mid_ring = (outer + gap) * 0.5
    parts = ['<g id="chrome">']

    parts.append(f'''
    <defs>
      <radialGradient id="ringPlate" cx="48%" cy="42%" r="58%">
        <stop offset="70%" stop-color="#080c12"/>
        <stop offset="88%" stop-color="#152030"/>
        <stop offset="96%" stop-color="#243448"/>
        <stop offset="100%" stop-color="#3a5068"/>
      </radialGradient>
      <linearGradient id="iconSteel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a5068"/>
        <stop offset="100%" stop-color="#152030"/>
      </linearGradient>
      <linearGradient id="iconHeat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8a4020"/>
        <stop offset="100%" stop-color="#4a1808"/>
      </linearGradient>
      <linearGradient id="iconWater" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2a6ab0"/>
        <stop offset="100%" stop-color="#143868"/>
      </linearGradient>
      <linearGradient id="iconCrystal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#60b0e8"/>
        <stop offset="100%" stop-color="#2060a0"/>
      </linearGradient>
      <filter id="chromeGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ''')

    # Track gradients (shared).
    for name, tr in _TRACKS.items():
        parts.append(
            f'<linearGradient id="grad_{name}" x1="0%" y1="0%" x2="100%" y2="100%">'
            f'<stop offset="0%" stop-color="{tr["c0"]}"/>'
            f'<stop offset="45%" stop-color="{tr["c1"]}"/>'
            f'<stop offset="100%" stop-color="{tr["c0"]}"/>'
            f'</linearGradient>'
        )

    # --- Ring plate (multi-layer metal) ---
    parts.append(f'''
    <path fill="url(#ringPlate)" fill-opacity="0.97" d="
      M{cx + outer:.2f},{cy:.2f}
      A{outer:.2f},{outer:.2f} 0 1 1 {cx - outer:.2f},{cy:.2f}
      A{outer:.2f},{outer:.2f} 0 1 1 {cx + outer:.2f},{cy:.2f}Z
      M{cx + gap:.2f},{cy:.2f}
      A{gap:.2f},{gap:.2f} 0 1 0 {cx - gap:.2f},{cy:.2f}
      A{gap:.2f},{gap:.2f} 0 1 0 {cx + gap:.2f},{cy:.2f}Z"/>
    ''')
    # Concentric machined grooves.
    for rr, col, w, op in (
        (outer - 1.2 * scale, '#a8c8e0', 2.4 * scale, 0.75),
        (outer - 4.5 * scale, '#4a6080', 1.0 * scale, 0.55),
        (mid_ring, '#2a3a50', 0.8 * scale, 0.40),
        (gap + 2.0 * scale, '#6a8098', 1.0 * scale, 0.50),
        (gap + 0.5 * scale, '#f0d0a8', 1.4 * scale, 0.28),
    ):
        parts.append(
            f'<circle cx="{cx}" cy="{cy}" r="{rr:.2f}" fill="none" '
            f'stroke="{col}" stroke-opacity="{op}" stroke-width="{w:.2f}"/>'
        )

    # Inner hash scale around planet limb (full 360°, fine ticks).
    parts.append('<g id="limbHash">')
    parts.append(_hash_marks(
        cx, cy, gap + 3.5 * scale, gap + 7.5 * scale,
        0, 359, 3.0, '#7a90a8', width=0.55 * scale))
    parts.append(_hash_marks(
        cx, cy, gap + 3.5 * scale, gap + 10.5 * scale,
        0, 359, 15.0, '#b0c8dc', width=0.9 * scale))
    parts.append('</g>')

    # Outer hash scale.
    parts.append('<g id="outerHash">')
    parts.append(_hash_marks(
        cx, cy, outer - 8 * scale, outer - 3 * scale,
        0, 359, 5.0, '#5a7088', width=0.55 * scale))
    parts.append('</g>')

    # Rivets.
    parts.append('<g id="rivets">')
    parts.append(_ring_rivets(cx, cy, outer - 6.5 * scale, 36, 1.35 * scale))
    parts.append(_ring_rivets(cx, cy, gap + 9 * scale, 24, 1.1 * scale, color='#5a7088'))
    parts.append('</g>')

    # Tracks — per-cell detail.
    for name, tr in _TRACKS.items():
        parts.append(_segmented_track(cx, cy, tr, scale, name))

    # Degree labels on oxygen / temp arcs (sparse).
    parts.append('<g id="trackLabels" font-family="DejaVu Sans, Arial, sans-serif" '
                 'font-weight="700">')
    o2 = _TRACKS['oxygen']
    for i, label in enumerate(('0', '7', '14')):
        a = o2['start'] + (o2['end'] - o2['start']) * i / 2
        lx, ly = _polar(cx, cy, (o2['r_mid'] - o2['half'] - 8) * scale, a)
        parts.append(
            f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="middle" dominant-baseline="middle" '
            f'font-size="{8.5 * scale:.1f}" fill="#9ec8e8" opacity="0.75">{label}</text>'
        )
    temp = _TRACKS['temperature']
    for i, label in enumerate(('-30', '0', '+8')):
        a = temp['start'] + (temp['end'] - temp['start']) * i / 2
        lx, ly = _polar(cx, cy, (temp['r_mid'] - temp['half'] - 8) * scale, a)
        parts.append(
            f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="middle" dominant-baseline="middle" '
            f'font-size="{8 * scale:.1f}" fill="#9ec8e8" opacity="0.75">{label}</text>'
        )
    parts.append('</g>')

    icon = max(22.0, 28 * scale)

    def place(deg, drawer, r_frac=1.0, isize=None):
        ic = isize if isize is not None else icon
        rr = outer * r_frac
        rx, ry = _polar(cx, cy, rr, deg)
        parts.append(_pointer(rx, ry, deg, max(6.5, 7.5 * scale)))
        # Icon pedestal ring.
        ix, iy = _polar(cx, cy, rr + ic * 0.58, deg)
        parts.append(
            f'<circle cx="{ix:.1f}" cy="{iy:.1f}" r="{ic*0.62:.1f}" '
            f'fill="#0c1420" stroke="#6a88a8" stroke-width="1" opacity="0.85"/>'
        )
        parts.append(drawer(ix - ic / 2, iy - ic / 2, ic))

    place(180, _icon_thermometer)
    place(0, _icon_crystal)
    place(45, _icon_heat)
    place(55, _icon_heat)
    place(330, _icon_percent)
    place(250, _icon_card, r_frac=1.02, isize=icon * 0.9)
    place(280, _icon_plant, r_frac=1.02, isize=icon * 0.9)

    wx, wy = _polar(cx, cy, outer * 1.07, 95)
    parts.append(
        f'<circle cx="{wx:.1f}" cy="{wy:.1f}" r="{icon*0.78:.1f}" '
        f'fill="#0c1420" stroke="#6a88a8" stroke-width="1" opacity="0.85"/>'
    )
    parts.append(_icon_water(wx - icon * 0.65, wy - icon * 0.55, icon * 1.3))

    # Emblem near top.
    ex, ey = _polar(cx, cy, outer * 1.08, 268)
    parts.append(_consortium_emblem(ex, ey, 11 * scale))

    # Primary labels with plate backing.
    def label_plate(deg, r_frac, text, fs):
        lx, ly = _polar(cx, cy, outer * r_frac, deg)
        tw = fs * len(text) * 0.42
        parts.append(
            f'<rect x="{lx - tw:.1f}" y="{ly - fs*0.55:.1f}" width="{tw*2:.1f}" '
            f'height="{fs*1.15:.1f}" rx="3" fill="#0a1520" fill-opacity="0.82" '
            f'stroke="#4a7090" stroke-width="0.8"/>'
        )
        parts.append(
            f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="middle" dominant-baseline="middle" '
            f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
            f'font-size="{fs:.1f}" fill="#8ad4ff" filter="url(#chromeGlow)">{text}</text>'
        )

    label_plate(145, 1.12, 'O₂', 18 * scale)
    label_plate(75, 1.11, 't°C', 18 * scale)
    zx, zy = _polar(cx, cy, _TRACKS['oxygen']['r_mid'] * scale * 1.0, 125)
    parts.append(
        f'<text x="{zx:.1f}" y="{zy:.1f}" text-anchor="middle" dominant-baseline="middle" '
        f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
        f'font-size="{12 * scale:.1f}" fill="#c4e4ff">0%</text>'
    )
    # Venus label.
    vx, vy = _polar(cx, cy, outer * 1.10, 265)
    parts.append(
        f'<text x="{vx:.1f}" y="{vy:.1f}" text-anchor="middle" '
        f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
        f'font-size="{11 * scale:.1f}" fill="#e0c090" opacity="0.85">VENUS</text>'
    )

    parts.append('</g>')
    return '\n'.join(parts)


def build_chrome_svg() -> str:
    """
    Chrome-only SVG (logical 891×860). Planet disc is transparent so a DEM
    disc can composite underneath. Black void outside the outer chrome ring.
    """
    cx, cy, r = DISC_CX, DISC_CY, DISC_R
    outer = _OUTER_R * (r / DISC_R)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{BOARD_W}" height="{BOARD_H}"
     viewBox="0 0 {BOARD_W} {BOARD_H}" version="1.1">
  <title>Consortium Mars board chrome (SVG)</title>
  <desc>Vector chrome for hybrid board. Planet is DEM hillshade composited
        under this layer. Hex OFFSET (144,160) / DISC
        ({DISC_CX},{DISC_CY},r={DISC_R}) locked to HTML pin frame.</desc>
  <defs>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.1"/>
    </filter>
  </defs>
  <!-- Black outside outer ring; interior (incl. planet disc) stays transparent. -->
  <path fill="#000000" fill-rule="evenodd" d="
    M0,0 H{BOARD_W} V{BOARD_H} H0 Z
    M{cx + outer:.2f},{cy:.2f}
    A{outer:.2f},{outer:.2f} 0 1 0 {cx - outer:.2f},{cy:.2f}
    A{outer:.2f},{outer:.2f} 0 1 0 {cx + outer:.2f},{cy:.2f} Z"/>
  {_chrome(cx, cy, r)}
</svg>
'''


def write_svg(path: str, seed: int = 20260731) -> str:
    """Write chrome-only SVG (seed kept for API compat; unused)."""
    del seed  # chrome is deterministic; planet seed lives in _board_dem
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(build_chrome_svg())
    return path


def rasterize_svg(svg_path: str, png_path: str, scale: int = 2) -> str:
    """Rasterize SVG → PNG at `scale` × viewBox (default 2 → 1782×1720)."""
    w, h = BOARD_W * scale, BOARD_H * scale
    os.makedirs(os.path.dirname(png_path) or '.', exist_ok=True)
    # Preserve alpha so the planet disc hole stays transparent.
    rsvg = subprocess.run(
        ['rsvg-convert', '-w', str(w), '-h', str(h),
         '--background-color=transparent', '-o', png_path, svg_path],
        capture_output=True, text=True)
    if rsvg.returncode == 0 and os.path.exists(png_path):
        return png_path
    try:
        import cairosvg
        cairosvg.svg2png(url=svg_path, write_to=png_path,
                         output_width=w, output_height=h,
                         background_color='rgba(0,0,0,0)')
        return png_path
    except Exception as exc:  # noqa: BLE001
        raise SystemExit(
            f'SVG rasterize failed (rsvg: {rsvg.stderr.strip()}; cairo: {exc})'
        ) from exc
