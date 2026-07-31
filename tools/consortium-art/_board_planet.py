"""
Fully generative Consortium Mars disc.

Does not sample mars.png RGB. Geography is synthesized so the board can be
sharp at any ART_SCALE. Only the disc centre/radius (passed in) must match
the hex field — that is the placement contract.
"""

from __future__ import annotations

import math
import random
from PIL import Image, ImageDraw, ImageFilter


def _value_noise(size: int, octaves: int, seed: int):
    """Return float HxW array in 0..1 (requires numpy)."""
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
    """
    Supersampled generative Mars disc (RGBA square).

    Sharp structure first, light grain last. Consortium identity = rust
    plains, cool iridium chasm belts at 90/210/330°, carved rift, hard
    crater bowls, highland ridges, lit limb.
    """
    import numpy as np

    # 3× supersample → crisp after LANCZOS downscale.
    ss = 3
    s = max(64, diameter * ss)
    cx = cy = (s - 1) / 2.0
    r = s * 0.498

    n1 = _value_noise(s, 5, seed)
    n2 = _value_noise(s, 4, seed + 17)
    n3 = _value_noise(s, 3, seed + 41)
    # Ridge / erosion field.
    n4 = _value_noise(s, 4, seed + 73)

    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    dx = xx - cx
    dy = yy - cy
    dist = np.sqrt(dx * dx + dy * dy)
    inside = dist <= r

    zn = np.sqrt(np.clip(1.0 - (dist / r) ** 2, 0, 1))
    lighting = 0.50 + 0.58 * (
        0.52 * (-dx / r) + 0.30 * (-dy / r) + 0.80 * zn)
    lighting = np.clip(lighting, 0.20, 1.25)

    warm = np.array([178, 102, 60], dtype=np.float32)
    dust = np.array([212, 148, 98], dtype=np.float32)
    dark = np.array([52, 30, 28], dtype=np.float32)
    highland = np.array([228, 172, 118], dtype=np.float32)
    chasm = np.array([36, 24, 52], dtype=np.float32)
    iridium = np.array([155, 180, 200], dtype=np.float32)
    crater_floor = np.array([88, 56, 44], dtype=np.float32)
    rim_col = np.array([230, 175, 125], dtype=np.float32)
    limb_col = np.array([195, 160, 140], dtype=np.float32)

    t = n1
    ground = dark * (1 - t)[..., None] + warm * t[..., None]
    dust_m = 0.20 + 0.55 * n2
    ground = ground * (1 - dust_m[..., None]) + dust * dust_m[..., None]

    # Highland ridges — thresholded noise with sharp falloff.
    hi_raw = (n3 * 0.65 + n4 * 0.35)
    hi_m = np.clip((hi_raw - 0.62) / 0.28, 0, 1) ** 1.4
    ground = ground * (1 - hi_m[..., None]) + highland * hi_m[..., None]

    # Jagged chasm belts at Consortium sector bearings.
    deg = (np.degrees(np.arctan2(-dy, dx)) + 360.0) % 360.0
    rim = np.clip(dist / r, 0, 1)
    belt = np.zeros_like(dist)
    for sb in (90.0, 210.0, 330.0):
        d = np.abs(deg - sb) % 360.0
        d = np.minimum(d, 360.0 - d)
        half = 14.0 + 24.0 * rim
        # Noise-warped angular distance → irregular edges.
        d_w = d - 6.0 * (n2 - 0.5)
        b = np.clip(1.0 - d_w / half, 0, 1)
        b = b * b * (0.15 + 0.95 * rim ** 1.15)
        belt = np.maximum(belt, b)
    belt = np.where(inside, belt, 0.0)
    ground = ground * (1 - belt[..., None]) + chasm * belt[..., None]
    ground = ground * (1 - (belt * 0.35)[..., None]) + iridium * (belt * 0.35)[..., None]

    # Carved rift canyon across the mid-band.
    canyon_y = cy + 0.10 * r * np.sin(dx / r * 2.8 + n4 * 1.2)
    canyon = np.exp(-((dy - canyon_y) / (0.038 * r)) ** 2)
    canyon *= np.clip(1.0 - (np.abs(dx) / (0.82 * r)) ** 2, 0, 1)
    canyon *= 0.65 + 0.35 * n3
    canyon = np.where(inside, canyon, 0.0)
    ground = ground * (1 - canyon[..., None] * 0.9) + chasm * (canyon * 0.9)[..., None]
    # Bright canyon rims.
    canyon_rim = np.exp(-((dy - canyon_y) / (0.070 * r)) ** 2) * (1.0 - canyon)
    canyon_rim *= np.clip(1.0 - (np.abs(dx) / (0.82 * r)) ** 2, 0, 1) * 0.55
    ground = ground * (1 - canyon_rim[..., None]) + rim_col * canyon_rim[..., None]

    # Hard crater bowls.
    rng = random.Random(seed)
    crater = np.zeros_like(dist)
    rim_hl = np.zeros_like(dist)
    spark = np.zeros_like(dist)
    for _ in range(48):
        cr = rng.uniform(0.020, 0.10) * r
        cd = rng.uniform(0.05, 0.82) * (r - cr)
        ang = rng.uniform(0.0, 2.0 * math.pi)
        ccx = cx + cd * math.cos(ang)
        ccy = cy + cd * math.sin(ang)
        depth = rng.uniform(0.55, 1.0)
        dcr = np.sqrt((xx - ccx) ** 2 + (yy - ccy) ** 2)
        u = dcr / cr
        floor = np.clip(1.0 - u / 0.68, 0, 1)
        floor = floor * floor * depth
        crater = np.maximum(crater, floor)
        # Soft sunward lip only — full bright rings read as UI, not terrain.
        ring = np.clip(1.0 - np.abs(u - 0.88) / 0.14, 0, 1) * depth * 0.45
        rim_hl = np.maximum(rim_hl, ring)
        if depth > 0.85 and cr > 0.05 * r:
            spark = np.maximum(spark, np.clip(1.0 - u / 0.20, 0, 1) * depth * 0.25)

    ground = ground * (1 - crater[..., None] * 0.85) + crater_floor * (crater * 0.85)[..., None]
    ground = ground * (1 - rim_hl[..., None] * 0.28) + rim_col * (rim_hl * 0.28)[..., None]
    ground = ground * (1 - spark[..., None] * 0.30) + iridium * (spark * 0.30)[..., None]

    # Atmosphere limb.
    limb = np.clip((dist / r - 0.90) / 0.10, 0, 1)
    ground = ground * (1 - limb[..., None] * 0.45) + limb_col * (limb * 0.45)[..., None]

    rgb = np.clip(ground * lighting[..., None], 0, 255).astype(np.uint8)
    rgb = np.where(inside[..., None], rgb, 0)
    img = Image.fromarray(rgb, 'RGB')

    # Very light grain only — structure must stay readable.
    grain = Image.effect_noise((s, s), 5).convert('L')
    g = np.asarray(grain, dtype=np.int16) - 128
    arr = np.asarray(img, dtype=np.int16)
    arr = np.clip(arr + (g[..., None] * 0.18).astype(np.int16), 0, 255).astype(np.uint8)
    img = Image.fromarray(arr, 'RGB')

    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(ss * 0.9))
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0))
    out.putalpha(mask)
    return out.resize((diameter, diameter), Image.LANCZOS)
