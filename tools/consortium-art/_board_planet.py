"""
Epic generative Consortium Mars disc (art direction B).

Photographic depth: rust plains, carved canyons, soft crater bowls,
subtle Consortium chasm hints, atmosphere limb. No flat wireframe look.
Does not sample mars.png RGB — only centre/radius are placement contracts.
"""

from __future__ import annotations

import math
import random
from PIL import Image, ImageDraw, ImageFilter


def _value_noise(size: int, octaves: int, seed: int):
    import numpy as np
    rng = random.Random(seed)
    acc = np.zeros((size, size), dtype=np.float32)
    weight = 0.0
    for o in range(octaves):
        cell = max(2, size // (2 ** (o + 2)))
        amp = 0.5 ** o
        grid = np.array(
            [[rng.random() for _ in range(cell)] for _ in range(cell)],
            dtype=np.float32)
        layer = Image.fromarray((grid * 255).astype('uint8'), 'L').resize(
            (size, size), Image.BICUBIC)
        acc += np.asarray(layer, dtype=np.float32) / 255.0 * amp
        weight += amp
    return acc / weight


def render_planet(diameter: int, seed: int = 20260731) -> Image.Image:
    """Supersampled epic Mars disc (RGBA)."""
    import numpy as np

    ss = 3
    s = max(64, diameter * ss)
    cx = cy = (s - 1) / 2.0
    r = s * 0.498

    # Prefer mid/low octaves — high-frequency value noise reads as sandpaper.
    n1 = _value_noise(s, 4, seed)
    n2 = _value_noise(s, 4, seed + 17)
    n3 = _value_noise(s, 3, seed + 41)
    n4 = _value_noise(s, 3, seed + 73)
    n5 = _value_noise(s, 3, seed + 99)

    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    dx = xx - cx
    dy = yy - cy
    dist = np.sqrt(dx * dx + dy * dy)
    inside = dist <= r
    nr = np.maximum(dist / r, 1e-6)

    # Spherical lighting — strong key from upper-left, soft fill.
    zn = np.sqrt(np.clip(1.0 - nr ** 2, 0, 1))
    key = 0.55 * (-dx / r) + 0.35 * (-dy / r) + 0.85 * zn
    lighting = 0.42 + 0.68 * key
    lighting = np.clip(lighting, 0.16, 1.35)
    # Soft terminator on the far side.
    lighting *= 0.78 + 0.22 * np.clip(zn + 0.15, 0, 1)

    # Mars palette — closer to photographic Tharsis hues.
    deep = np.array([62, 28, 22], dtype=np.float32)
    rust = np.array([168, 88, 48], dtype=np.float32)
    ochre = np.array([198, 132, 78], dtype=np.float32)
    dune = np.array([214, 158, 102], dtype=np.float32)
    highland = np.array([225, 175, 125], dtype=np.float32)
    shade = np.array([48, 26, 28], dtype=np.float32)
    canyon = np.array([72, 38, 32], dtype=np.float32)
    iridium = np.array([148, 168, 188], dtype=np.float32)
    crater_floor = np.array([96, 58, 42], dtype=np.float32)
    rim_lit = np.array([232, 178, 128], dtype=np.float32)
    haze = np.array([186, 150, 128], dtype=np.float32)

    # Broad albedo.
    albedo = 0.35 * n1 + 0.40 * n2 + 0.25 * n5
    ground = deep * (1 - albedo)[..., None] + rust * albedo[..., None]
    ground = ground * (1 - (0.35 * n3)[..., None]) + ochre * (0.35 * n3)[..., None]
    dune_m = np.clip((n2 - 0.55) / 0.35, 0, 1) ** 1.3
    ground = ground * (1 - dune_m[..., None]) + dune * dune_m[..., None]

    # Highland massifs — warm ridges, not neon.
    hi = np.clip((0.55 * n3 + 0.45 * n4 - 0.58) / 0.30, 0, 1) ** 1.5
    ground = ground * (1 - hi[..., None] * 0.85) + highland * (hi * 0.85)[..., None]

    # Primary rift canyon (epic, photographic) + a secondary branch.
    canyon_y = cy + 0.10 * r * np.sin(dx / r * 2.4 + n4 * 1.8)
    canyon_w = 0.038 * r * (1.0 + 0.55 * n3)
    cdist = np.abs(dy - canyon_y) / np.maximum(canyon_w, 1.0)
    canyon_m = np.exp(-(cdist ** 2)) * np.clip(1.0 - (np.abs(dx) / (0.90 * r)) ** 2, 0, 1)
    # Branch fork toward lower-right.
    by = cy + 0.28 * r + 0.08 * r * np.sin(dx / r * 1.4)
    bw = 0.022 * r * (1.0 + 0.4 * n2)
    bdist = np.abs(dy - by) / np.maximum(bw, 1.0)
    branch = np.exp(-(bdist ** 2)) * np.clip((dx / r + 0.15) / 0.85, 0, 1)
    canyon_m = np.maximum(canyon_m, branch * 0.85)
    canyon_m *= 0.60 + 0.40 * n2
    canyon_m = np.where(inside, canyon_m, 0.0)
    ground = ground * (1 - canyon_m[..., None] * 0.95) + canyon * (canyon_m * 0.95)[..., None]
    # Lit canyon walls.
    wall = np.exp(-((cdist - 1.05) ** 2) / 0.40) * (1.0 - canyon_m) * 0.62
    wall *= np.clip(1.0 - (np.abs(dx) / (0.90 * r)) ** 2, 0, 1)
    ground = ground * (1 - wall[..., None]) + rim_lit * wall[..., None]

    # Subtle Consortium sector hints (not three loud purple wedges).
    deg = (np.degrees(np.arctan2(-dy, dx)) + 360.0) % 360.0
    belt = np.zeros_like(dist)
    for sb in (90.0, 210.0, 330.0):
        d = np.minimum(np.abs(deg - sb) % 360.0, 360.0 - np.abs(deg - sb) % 360.0)
        d_w = d - 5.0 * (n2 - 0.5)
        half = 10.0 + 16.0 * nr
        b = np.clip(1.0 - d_w / half, 0, 1) ** 1.6
        b *= (0.08 + 0.55 * nr ** 1.4) * (0.5 + 0.5 * n4)
        belt = np.maximum(belt, b)
    belt = np.where(inside, belt, 0.0)
    ground = ground * (1 - belt[..., None] * 0.55) + shade * (belt * 0.55)[..., None]
    ground = ground * (1 - (belt * 0.18)[..., None]) + iridium * (belt * 0.18)[..., None]

    # Crater field — soft bowls, sunward lips only.
    rng = random.Random(seed)
    crater = np.zeros_like(dist)
    rim_hl = np.zeros_like(dist)
    spark = np.zeros_like(dist)
    for _ in range(42):
        cr = rng.uniform(0.018, 0.095) * r
        cd = rng.uniform(0.08, 0.82) * (r - cr)
        ang = rng.uniform(0.0, 2.0 * math.pi)
        ccx = cx + cd * math.cos(ang)
        ccy = cy + cd * math.sin(ang)
        depth = rng.uniform(0.5, 1.0)
        dcr = np.sqrt((xx - ccx) ** 2 + (yy - ccy) ** 2)
        u = dcr / cr
        floor = np.clip(1.0 - u / 0.70, 0, 1)
        floor = (floor ** 1.6) * depth
        crater = np.maximum(crater, floor)
        ring = np.clip(1.0 - np.abs(u - 0.86) / 0.16, 0, 1) * depth * 0.35
        # Bias rim toward light direction.
        sun = np.clip(0.5 + 0.5 * ((ccx - xx) + (ccy - yy)) / (cr + 1e-3), 0, 1)
        rim_hl = np.maximum(rim_hl, ring * sun)
        if depth > 0.82 and cr > 0.045 * r:
            spark = np.maximum(spark, np.clip(1.0 - u / 0.18, 0, 1) * depth * 0.22)

    ground = ground * (1 - crater[..., None] * 0.78) + crater_floor * (crater * 0.78)[..., None]
    ground = ground * (1 - rim_hl[..., None] * 0.40) + rim_lit * (rim_hl * 0.40)[..., None]
    ground = ground * (1 - spark[..., None] * 0.35) + iridium * (spark * 0.35)[..., None]

    # Dust streaks.
    streak = np.clip((n5 - 0.62) / 0.25, 0, 1) * (0.15 + 0.25 * n1) * (1.0 - canyon_m)
    ground = ground * (1 - streak[..., None] * 0.35) + dune * (streak * 0.35)[..., None]

    # Atmosphere limb + thin haze.
    limb = np.clip((nr - 0.88) / 0.12, 0, 1) ** 1.2
    ground = ground * (1 - limb[..., None] * 0.55) + haze * (limb * 0.55)[..., None]
    haze_m = (1.0 - zn) * 0.12 * n3
    ground = ground * (1 - haze_m[..., None]) + haze * haze_m[..., None]

    rgb = np.clip(ground * lighting[..., None], 0, 255).astype(np.uint8)
    rgb = np.where(inside[..., None], rgb, 0)
    img = Image.fromarray(rgb, 'RGB')

    # Kill residual stipple, then a gentle local-contrast pass.
    img = img.filter(ImageFilter.GaussianBlur(ss * 0.55))
    img = img.filter(ImageFilter.UnsharpMask(radius=ss * 1.4, percent=55, threshold=2))

    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(ss * 0.85))
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0))
    out.putalpha(mask)
    return out.resize((diameter, diameter), Image.LANCZOS)
