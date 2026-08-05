"""
DEM / hillshade Consortium Mars disc (hybrid board art).

Heightmap geology (canyon valleys, crater bowls, volcanoes) + Lambertian
hillshade + Mars albedo ramp. This is the planet half of the hybrid
pipeline; chrome stays SVG (_board_svg.py).
"""

from __future__ import annotations

import math
import random
from PIL import Image, ImageDraw, ImageFilter


def _fbm(size: int, octaves: int, seed: int, base_cell: int = 8):
    import numpy as np
    rng = random.Random(seed)
    acc = np.zeros((size, size), dtype=np.float32)
    weight = 0.0
    for o in range(octaves):
        cell = max(2, base_cell * (2 ** o))
        # Invert: octave 0 = largest features.
        cell = max(2, size // (2 ** (o + 2)))
        amp = 0.55 ** o
        grid = np.array(
            [[rng.random() for _ in range(cell)] for _ in range(cell)],
            dtype=np.float32)
        layer = Image.fromarray((grid * 255).astype('uint8'), 'L').resize(
            (size, size), Image.BICUBIC)
        # Mild blur kills bicubic block artifacts → less "cheap noise".
        layer = layer.filter(ImageFilter.GaussianBlur(max(0.4, size / cell / 6)))
        acc += np.asarray(layer, dtype=np.float32) / 255.0 * amp
        weight += amp
    return acc / weight


def render_dem_planet(diameter: int, seed: int = 20260731) -> Image.Image:
    """
    Supersampled DEM Mars disc (RGBA).
    Features are carved into a height field, then hillshaded — not stroked on top.
    """
    import numpy as np

    ss = 3
    s = max(96, diameter * ss)
    cx = cy = (s - 1) / 2.0
    r = s * 0.498

    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    dx = xx - cx
    dy = yy - cy
    dist = np.sqrt(dx * dx + dy * dy)
    inside = dist <= r
    nr = np.maximum(dist / r, 1e-6)

    # --- Height field -------------------------------------------------------
    # Keep base noise low so carved geology (canyon/craters) dominates.
    h = _fbm(s, 4, seed, base_cell=8) * 0.28
    h += _fbm(s, 3, seed + 11) * 0.18
    # Broad continents / lowlands.
    macro = _fbm(s, 3, seed + 41)
    h += (macro - 0.5) * 0.42

    # Tharsis-like highland bulge (NW).
    vol_cx, vol_cy = cx - 0.32 * r, cy - 0.28 * r
    vol_d = np.sqrt((xx - vol_cx) ** 2 + (yy - vol_cy) ** 2)
    bulge = np.exp(-(vol_d / (0.28 * r)) ** 2) * 0.55
    h += bulge
    # Shield volcano peaks.
    for (vu, vv, vr, vh) in (
        (-0.38, -0.28, 0.055, 0.45),
        (-0.28, -0.38, 0.045, 0.38),
        (-0.48, -0.18, 0.040, 0.32),
        (-0.22, -0.22, 0.035, 0.28),
    ):
        pcx, pcy = cx + vu * r, cy + vv * r
        pd = np.sqrt((xx - pcx) ** 2 + (yy - pcy) ** 2)
        cone = np.clip(1.0 - pd / (vr * r), 0, 1) ** 1.6
        h += cone * vh

    # Primary canyon as a carved valley (height drop), not a stroke.
    def carve_canyon(path_uv, width_u, depth):
        # path_uv: list of (u,v) control samples along the rift.
        pts = [(cx + u * r, cy + v * r) for u, v in path_uv]
        field = np.full((s, s), 1e9, dtype=np.float32)
        # Sample polyline distance densely.
        samples = []
        for i in range(len(pts) - 1):
            x0, y0 = pts[i]
            x1, y1 = pts[i + 1]
            nseg = max(8, int(np.hypot(x1 - x0, y1 - y0) / 3))
            for t in range(nseg + 1):
                tt = t / nseg
                samples.append((x0 + (x1 - x0) * tt, y0 + (y1 - y0) * tt))
        for sx_, sy_ in samples:
            d = (xx - sx_) ** 2 + (yy - sy_) ** 2
            field = np.minimum(field, d)
        dist_c = np.sqrt(field)
        w = width_u * r
        # Smooth valley profile.
        profile = np.exp(-(dist_c / w) ** 2)
        # Wall lip slightly raised.
        lip = np.exp(-((dist_c - 1.15 * w) / (0.45 * w)) ** 2) * 0.12
        return profile * depth, lip

    # Smooth sinuous canyon (Valles-like), not a lightning bolt polyline.
    main_uv = []
    for i in range(36):
        u = -0.85 + 1.70 * i / 35
        v = 0.06 + 0.07 * math.sin(u * 3.2) + 0.03 * math.sin(u * 7.1)
        main_uv.append((u, v))
    br1 = []
    for i in range(18):
        t = i / 17
        br1.append((0.05 + 0.52 * t, 0.08 + 0.42 * t + 0.04 * math.sin(t * 5)))
    br2 = []
    for i in range(14):
        t = i / 13
        br2.append((-0.28 - 0.12 * t, 0.04 + 0.38 * t + 0.03 * math.cos(t * 4)))
    canyon = np.zeros_like(h)
    lip_acc = np.zeros_like(h)
    for path, wu, dep in ((main_uv, 0.052, 0.85), (br1, 0.030, 0.55), (br2, 0.022, 0.42)):
        prof, lip = carve_canyon(path, wu, dep)
        canyon = np.maximum(canyon, prof)
        lip_acc = np.maximum(lip_acc, lip)
    h = h - canyon + lip_acc

    # Consortium sector chasms — soft meandering rifts (not razor lines).
    for sb in (90.0, 210.0, 330.0):
        rad = math.radians(sb)
        dirx, diry = math.cos(rad), math.sin(rad)
        # Perpendicular for meander.
        px_, py_ = -diry, dirx
        t = dx * dirx + dy * diry
        across = dx * px_ + dy * py_
        meander = 0.035 * r * np.sin(t / r * 9.0 + sb)
        d_rift = np.abs(across - meander)
        rift = np.exp(-(d_rift / (0.028 * r)) ** 2)
        band = (t >= 0.42 * r) & (t <= 0.94 * r)
        h -= np.where(band, rift * 0.22, 0.0)

    # Crater bowls carved into height.
    rng = random.Random(seed)
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
    crater_depth = np.zeros_like(h)
    crater_rim = np.zeros_like(h)
    for u, v, size, depth in landmarks:
        pcx, pcy = cx + u * r, cy + v * r
        cr = size * r
        dcr = np.sqrt((xx - pcx) ** 2 + (yy - pcy) ** 2)
        u01 = dcr / cr
        floor = np.clip(1.0 - u01 / 0.72, 0, 1) ** 1.45 * depth
        rim = np.clip(1.0 - np.abs(u01 - 0.88) / 0.14, 0, 1) * depth * 0.22
        crater_depth = np.maximum(crater_depth, floor)
        crater_rim = np.maximum(crater_rim, rim)
    for _ in range(70):
        size = rng.uniform(0.010, 0.040)
        cd = rng.uniform(0.12, 0.88) * r
        ang = rng.uniform(0, 2 * math.pi)
        pcx = cx + cd * math.cos(ang)
        pcy = cy + cd * math.sin(ang)
        # Avoid deepest canyon corridor.
        if abs((pcy - cy) / r - 0.08) < 0.07 and abs((pcx - cx) / r) < 0.7:
            continue
        cr = size * r
        depth = rng.uniform(0.45, 0.95)
        dcr = np.sqrt((xx - pcx) ** 2 + (yy - pcy) ** 2)
        u01 = dcr / cr
        floor = np.clip(1.0 - u01 / 0.70, 0, 1) ** 1.5 * depth
        rim = np.clip(1.0 - np.abs(u01 - 0.86) / 0.14, 0, 1) * depth * 0.18
        crater_depth = np.maximum(crater_depth, floor)
        crater_rim = np.maximum(crater_rim, rim)
    h = h - crater_depth * 0.55 + crater_rim

    # Polar depression / ice shelf (slightly raised rim, flat top).
    ice_d = np.sqrt((xx - (cx - 0.05 * r)) ** 2 + (yy - (cy - 0.78 * r)) ** 2)
    ice = np.exp(-(ice_d / (0.16 * r)) ** 2)
    h += ice * 0.12

    # Spherical shell bias — flatten toward limb so shade reads round.
    h = h * (0.82 + 0.18 * np.sqrt(np.clip(1.0 - nr ** 2, 0, 1)))

    # Normalize height inside disc.
    h_in = np.where(inside, h, np.nan)
    h_min = np.nanpercentile(h_in, 2)
    h_max = np.nanpercentile(h_in, 98)
    hn = np.clip((h - h_min) / max(h_max - h_min, 1e-6), 0, 1)
    hn = np.where(inside, hn, 0.0)

    # --- Hillshade ----------------------------------------------------------
    # Mild blur height before gradients → coherent relief, not pixel noise.
    h_img = Image.fromarray((hn * 255).astype('uint8'), 'L')
    h_img = h_img.filter(ImageFilter.GaussianBlur(ss * 0.7))
    hn_s = np.asarray(h_img, dtype=np.float32) / 255.0
    gy, gx = np.gradient(hn_s)
    # Exaggerate slope for readable relief under hexes.
    strength = 3.6
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(hn_s)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx / norm, ny / norm, nz / norm
    # Key light upper-left + fill.
    lx, ly, lz = -0.55, -0.40, 0.75
    ln = math.sqrt(lx * lx + ly * ly + lz * lz)
    lx, ly, lz = lx / ln, ly / ln, lz / ln
    diffuse = np.clip(nx * lx + ny * ly + nz * lz, 0, 1)
    # Ambient occlusion proxy from height.
    ao = 0.55 + 0.45 * hn_s
    shade = (0.22 + 0.78 * diffuse) * ao
    # Spherical terminator.
    zn = np.sqrt(np.clip(1.0 - nr ** 2, 0, 1))
    shade *= 0.55 + 0.45 * zn
    shade = np.clip(shade, 0.08, 1.25)

    # --- Albedo / color ramp ------------------------------------------------
    albedo = 0.40 * macro + 0.35 * _fbm(s, 4, seed + 73) + 0.25 * hn_s
    # Palette biased toward photographic Tharsis ochres (warmer, less chocolate).
    deep = np.array([72, 36, 28], dtype=np.float32)
    rust = np.array([186, 98, 52], dtype=np.float32)
    ochre = np.array([214, 142, 86], dtype=np.float32)
    dune = np.array([228, 172, 118], dtype=np.float32)
    highland = np.array([236, 188, 138], dtype=np.float32)
    shade_c = np.array([52, 28, 24], dtype=np.float32)
    ice_c = np.array([210, 198, 186], dtype=np.float32)

    t = np.clip(albedo, 0, 1)
    ground = deep * (1 - t)[..., None] + rust * t[..., None]
    ground = ground * (1 - (0.45 * t)[..., None]) + ochre * (0.45 * t)[..., None]
    hi = np.clip((hn_s - 0.62) / 0.30, 0, 1)
    ground = ground * (1 - hi[..., None] * 0.75) + highland * (hi * 0.75)[..., None]
    # Canyon floors darker / cooler.
    ground = ground * (1 - canyon[..., None] * 0.55) + shade_c * (canyon * 0.55)[..., None]
    # Dustier dunes on mid slopes.
    dune_m = np.clip((albedo - 0.55) / 0.30, 0, 1) * (1.0 - canyon) * (1.0 - hi)
    ground = ground * (1 - dune_m[..., None] * 0.35) + dune * (dune_m * 0.35)[..., None]
    # Polar ice — subtle, not a glossy white cap.
    ground = ground * (1 - ice[..., None] * 0.40) + ice_c * (ice * 0.40)[..., None]

    rgb = np.clip(ground * shade[..., None], 0, 255).astype(np.uint8)

    # Barely-there grit (high-freq comes from hillshade, not stipple).
    grit = _fbm(s, 2, seed + 99)
    grit = (grit - 0.5) * 3.5
    rgb = np.clip(rgb.astype(np.float32) + grit[..., None], 0, 255).astype(np.uint8)

    # Atmosphere limb.
    limb = np.clip((nr - 0.88) / 0.12, 0, 1) ** 1.2
    haze = np.array([210, 175, 148], dtype=np.float32)
    rgb_f = rgb.astype(np.float32)
    rgb_f = rgb_f * (1 - limb[..., None] * 0.48) + haze * (limb * 0.48)[..., None]
    rgb = np.clip(rgb_f, 0, 255).astype(np.uint8)
    rgb = np.where(inside[..., None], rgb, 0)

    img = Image.fromarray(rgb, 'RGB')
    img = img.filter(ImageFilter.GaussianBlur(ss * 0.25))
    img = img.filter(ImageFilter.UnsharpMask(radius=ss * 1.1, percent=50, threshold=2))

    mask = Image.new('L', (s, s), 0)
    ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(ss * 0.8))
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0))
    out.putalpha(mask)
    return out.resize((diameter, diameter), Image.LANCZOS)
