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
      <defs>
        <linearGradient id="thermBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a3850"/><stop offset="100%" stop-color="#152030"/>
        </linearGradient>
      </defs>
      <rect width="{s}" height="{s}" rx="{s*0.14:.1f}" fill="url(#thermBg)"
            stroke="#c8dcec" stroke-width="1.4"/>
      <circle cx="{s*0.5:.1f}" cy="{s*0.70:.1f}" r="{s*0.17:.1f}" fill="#e84848"/>
      <rect x="{s*0.42:.1f}" y="{s*0.16:.1f}" width="{s*0.16:.1f}" height="{s*0.52:.1f}"
            rx="2" fill="#e8f0f8"/>
      <rect x="{s*0.46:.1f}" y="{s*0.30:.1f}" width="{s*0.08:.1f}" height="{s*0.40:.1f}"
            fill="#e84848"/>
    </g>'''


def _icon_heat(x, y, s) -> str:
    flames = []
    for i, ox in enumerate((-0.22, 0.0, 0.22)):
        pts = []
        for t in range(8):
            py = s * (0.20 + 0.58 * t / 7)
            px = s * (0.5 + ox + 0.07 * math.sin(t * 1.3 + i))
            pts.append(f'{px:.1f},{py:.1f}')
        flames.append(
            f'<polyline points="{" ".join(pts)}" fill="none" stroke="#ffb44a" '
            f'stroke-width="{max(2.2, s/9):.1f}" stroke-linecap="round"/>'
        )
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.12:.1f}" fill="#6a3018"
            stroke="#e09050" stroke-width="1.4"/>
      {''.join(flames)}
    </g>'''


def _icon_water(x, y, s) -> str:
    hex_pts = ' '.join(
        f'{s/2 + s*0.48*math.cos(math.radians(60*i-30)):.1f},'
        f'{s/2 + s*0.48*math.sin(math.radians(60*i-30)):.1f}'
        for i in range(6)
    )
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <polygon points="{hex_pts}" fill="#1e5a9a" stroke="#a0d4ff" stroke-width="1.4"/>
      <ellipse cx="{s*0.5:.1f}" cy="{s*0.50:.1f}" rx="{s*0.17:.1f}" ry="{s*0.20:.1f}" fill="#e0f0ff"/>
      <polygon points="{s*0.5:.1f},{s*0.20:.1f} {s*0.34:.1f},{s*0.48:.1f} {s*0.66:.1f},{s*0.48:.1f}"
               fill="#e0f0ff"/>
    </g>'''


def _icon_crystal(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <polygon points="{s*0.5:.1f},{s*0.10:.1f} {s*0.84:.1f},{s*0.5:.1f} {s*0.5:.1f},{s*0.90:.1f} {s*0.16:.1f},{s*0.5:.1f}"
               fill="#3a88d0" stroke="#d0ecff" stroke-width="1.4"/>
      <polygon points="{s*0.5:.1f},{s*0.22:.1f} {s*0.68:.1f},{s*0.5:.1f} {s*0.5:.1f},{s*0.72:.1f}"
               fill="#a0d4ff" opacity="0.55"/>
    </g>'''


def _icon_percent(x, y, s) -> str:
    return f'''<g transform="translate({x:.1f},{y:.1f})">
      <rect width="{s}" height="{s}" rx="{s*0.14:.1f}" fill="#1e5a9a"
            stroke="#b0dcff" stroke-width="1.4"/>
      <text x="{s*0.5:.1f}" y="{s*0.72:.1f}" text-anchor="middle" font-size="{s*0.55:.1f}"
            font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" fill="#f4faff">%</text>
    </g>'''


def _pointer(cx, cy, deg, size) -> str:
    tip = _polar(cx, cy, size * 0.1, deg + 180)
    b1 = _polar(cx, cy, size, deg - 28)
    b2 = _polar(cx, cy, size, deg + 28)
    return (
        f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {b1[0]:.1f},{b1[1]:.1f} '
        f'{b2[0]:.1f},{b2[1]:.1f}" fill="#b0b6c0"/>'
    )


def _chrome(cx, cy, planet_r) -> str:
    scale = planet_r / DISC_R
    outer = _OUTER_R * scale
    gap = planet_r + 5.5 * scale
    parts = ['<g id="chrome">']

    # Metallic ring plate with subtle radial shade.
    parts.append(f'''
    <defs>
      <radialGradient id="ringPlate" cx="50%" cy="45%" r="55%">
        <stop offset="78%" stop-color="#0a0e14"/>
        <stop offset="92%" stop-color="#141c28"/>
        <stop offset="100%" stop-color="#1c2838"/>
      </radialGradient>
    </defs>
    <path fill="url(#ringPlate)" fill-opacity="0.96" d="
      M{cx + outer:.2f},{cy:.2f}
      A{outer:.2f},{outer:.2f} 0 1 1 {cx - outer:.2f},{cy:.2f}
      A{outer:.2f},{outer:.2f} 0 1 1 {cx + outer:.2f},{cy:.2f}Z
      M{cx + gap:.2f},{cy:.2f}
      A{gap:.2f},{gap:.2f} 0 1 0 {cx - gap:.2f},{cy:.2f}
      A{gap:.2f},{gap:.2f} 0 1 0 {cx + gap:.2f},{cy:.2f}Z"/>
    <circle cx="{cx}" cy="{cy}" r="{outer:.2f}" fill="none"
            stroke="#8eb4d0" stroke-opacity="0.70" stroke-width="{2.2 * scale:.2f}"/>
    <circle cx="{cx}" cy="{cy}" r="{gap:.2f}" fill="none"
            stroke="#f0c8a0" stroke-opacity="0.18" stroke-width="{1.2 * scale:.2f}"/>
    ''')

    for name, tr in _TRACKS.items():
        r_mid = tr['r_mid'] * scale
        half = tr['half'] * scale
        r_out, r_in = r_mid + half, r_mid - half
        path = _annular_sector(cx, cy, r_out, r_in, tr['start'], tr['end'])
        gid = f'track_{name}'
        # Soft outer glow under track.
        glow = _annular_sector(cx, cy, r_out + 3 * scale, r_in - 2 * scale,
                               tr['start'], tr['end'])
        parts.append(
            f'<path d="{glow}" fill="{tr["c1"]}" opacity="0.12" filter="url(#softBlur)"/>'
        )
        parts.append(
            f'<linearGradient id="{gid}" x1="0%" y1="0%" x2="100%" y2="100%">'
            f'<stop offset="0%" stop-color="{tr["c0"]}"/>'
            f'<stop offset="55%" stop-color="{tr["c1"]}"/>'
            f'<stop offset="100%" stop-color="{tr["c0"]}"/>'
            f'</linearGradient>'
        )
        parts.append(
            f'<path d="{path}" fill="url(#{gid})" stroke="#e8f4ff" '
            f'stroke-opacity="0.40" stroke-width="0.8"/>'
        )
        # Inner glass highlight strip.
        hi = _annular_sector(cx, cy, r_out - 1, r_out - half * 0.55,
                             tr['start'], tr['end'])
        parts.append(f'<path d="{hi}" fill="#ffffff" opacity="0.14"/>')
        parts.append(_arc_ticks(
            cx, cy, r_in, r_out, tr['start'], tr['end'],
            tr['segments'], tr['tick'], width=max(1.0, 1.15 * scale)))

    icon = max(20.0, 26 * scale)

    def place(deg, drawer, r_frac=1.0):
        rr = outer * r_frac
        rx, ry = _polar(cx, cy, rr, deg)
        parts.append(_pointer(rx, ry, deg, max(6.0, 7 * scale)))
        ix, iy = _polar(cx, cy, rr + icon * 0.55, deg)
        parts.append(drawer(ix - icon / 2, iy - icon / 2, icon))

    place(180, _icon_thermometer)
    place(0, _icon_crystal)
    place(45, _icon_heat)
    place(55, _icon_heat)
    place(330, _icon_percent)
    wx, wy = _polar(cx, cy, outer * 1.06, 95)
    parts.append(_icon_water(wx - icon * 0.65, wy - icon * 0.55, icon * 1.25))

    ox, oy = _polar(cx, cy, outer * 1.10, 145)
    parts.append(
        f'<text x="{ox:.1f}" y="{oy:.1f}" text-anchor="middle" '
        f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
        f'font-size="{20 * scale:.1f}" fill="#7ecfff" '
        f'style="paint-order:stroke;stroke:#0a1520;stroke-width:3px">O₂</text>'
    )
    zx, zy = _polar(cx, cy, _TRACKS['oxygen']['r_mid'] * scale * 1.02, 128)
    parts.append(
        f'<text x="{zx:.1f}" y="{zy:.1f}" text-anchor="middle" '
        f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
        f'font-size="{13 * scale:.1f}" fill="#c4e4ff">0%</text>'
    )
    tx, ty = _polar(cx, cy, outer * 1.08, 75)
    parts.append(
        f'<text x="{tx:.1f}" y="{ty:.1f}" text-anchor="middle" '
        f'font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" '
        f'font-size="{20 * scale:.1f}" fill="#7ecfff" '
        f'style="paint-order:stroke;stroke:#0a1520;stroke-width:3px">t°C</text>'
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
