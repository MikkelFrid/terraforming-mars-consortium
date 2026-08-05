/**
 * Pure math for the mobile BoardCamera (pan + pinch + clamp).
 * Transform is applied as: translate(x, y) scale(scale) with origin top-left.
 */

export type CameraSize = {width: number, height: number};

export type CameraState = {
  /** World translation in viewport pixels (after scale). */
  x: number,
  y: number,
  /** Zoom level (1 = design pixels). */
  scale: number,
};

export const DEFAULT_MAX_SCALE = 1.75;
export const DEFAULT_PADDING_PX = 12;
/** Movement below this (px) counts as a tap, not a pan. */
export const PAN_TAP_THRESHOLD_PX = 8;

/** Fit scale so content width fills the viewport (with padding). */
export function fitScale(
  viewport: CameraSize,
  content: CameraSize,
  paddingPx: number = DEFAULT_PADDING_PX,
): number {
  const availW = Math.max(1, viewport.width - paddingPx * 2);
  const availH = Math.max(1, viewport.height - paddingPx * 2);
  const sx = availW / Math.max(1, content.width);
  const sy = availH / Math.max(1, content.height);
  // Prefer fitting width on phones; never upscale past 1 for the "fit" floor.
  return Math.min(1, sx, sy);
}

export function clampScale(
  scale: number,
  minScale: number,
  maxScale: number = DEFAULT_MAX_SCALE,
): number {
  return Math.min(maxScale, Math.max(minScale, scale));
}

/**
 * Clamp translation so the scaled content always covers the viewport center
 * band — empty margins stay within paddingPx when content is larger than the
 * viewport; when smaller, content is centered.
 */
export function clampTranslation(
  state: CameraState,
  viewport: CameraSize,
  content: CameraSize,
  paddingPx: number = DEFAULT_PADDING_PX,
): CameraState {
  const scale = state.scale;
  const scaledW = content.width * scale;
  const scaledH = content.height * scale;

  let minX: number;
  let maxX: number;
  if (scaledW <= viewport.width - paddingPx * 2) {
    const centered = (viewport.width - scaledW) / 2;
    minX = centered;
    maxX = centered;
  } else {
    minX = viewport.width - paddingPx - scaledW;
    maxX = paddingPx;
  }

  let minY: number;
  let maxY: number;
  if (scaledH <= viewport.height - paddingPx * 2) {
    const centered = (viewport.height - scaledH) / 2;
    minY = centered;
    maxY = centered;
  } else {
    minY = viewport.height - paddingPx - scaledH;
    maxY = paddingPx;
  }

  return {
    scale,
    x: Math.min(maxX, Math.max(minX, state.x)),
    y: Math.min(maxY, Math.max(minY, state.y)),
  };
}

/** Initial camera: fit scale, centered. */
export function initialCamera(
  viewport: CameraSize,
  content: CameraSize,
  paddingPx: number = DEFAULT_PADDING_PX,
): CameraState {
  const scale = fitScale(viewport, content, paddingPx);
  return clampTranslation({x: 0, y: 0, scale}, viewport, content, paddingPx);
}

/** Zoom toward a viewport point (e.g. pinch midpoint or wheel cursor). */
export function zoomAt(
  state: CameraState,
  viewport: CameraSize,
  content: CameraSize,
  nextScale: number,
  pivotViewportX: number,
  pivotViewportY: number,
  minScale: number,
  maxScale: number = DEFAULT_MAX_SCALE,
  paddingPx: number = DEFAULT_PADDING_PX,
): CameraState {
  const scale = clampScale(nextScale, minScale, maxScale);
  if (scale === state.scale) {
    return clampTranslation(state, viewport, content, paddingPx);
  }
  // Keep the world point under the pivot fixed.
  const worldX = (pivotViewportX - state.x) / state.scale;
  const worldY = (pivotViewportY - state.y) / state.scale;
  const next: CameraState = {
    scale,
    x: pivotViewportX - worldX * scale,
    y: pivotViewportY - worldY * scale,
  };
  return clampTranslation(next, viewport, content, paddingPx);
}

export function panBy(
  state: CameraState,
  viewport: CameraSize,
  content: CameraSize,
  dx: number,
  dy: number,
  paddingPx: number = DEFAULT_PADDING_PX,
): CameraState {
  return clampTranslation(
    {scale: state.scale, x: state.x + dx, y: state.y + dy},
    viewport,
    content,
    paddingPx,
  );
}

export function distance(a: {x: number, y: number}, b: {x: number, y: number}): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function midpoint(
  a: {x: number, y: number},
  b: {x: number, y: number},
): {x: number, y: number} {
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
}
