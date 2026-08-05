/** Design width of `.filterDiv` / Card chrome (px). */
export const CARD_DESIGN_WIDTH_PX = 240;

/**
 * Design height of card chrome (px).
 * Taller than a short project card so corps/preludes are not clipped when scaled.
 */
export const CARD_DESIGN_HEIGHT_PX = 380;

export type MobileCardGridSize = 's' | 'm' | 'l';

export const MOBILE_CARD_GRID_SIZE_KEY = 'mobile_card_grid_size';

/** Columns per grid size preset (phone-first). */
export const MOBILE_CARD_GRID_COLS: Record<MobileCardGridSize, number> = {
  s: 4,
  m: 3,
  l: 2,
};

export function isMobileCardGridSize(value: unknown): value is MobileCardGridSize {
  return value === 's' || value === 'm' || value === 'l';
}

function browserLocalStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    const storage = window.localStorage;
    // Probe — jsdom opaque origins throw SecurityError on use.
    storage.getItem(MOBILE_CARD_GRID_SIZE_KEY);
    return storage;
  } catch {
    return undefined;
  }
}

export function loadMobileCardGridSize(): MobileCardGridSize {
  try {
    const raw = browserLocalStorage()?.getItem(MOBILE_CARD_GRID_SIZE_KEY);
    return isMobileCardGridSize(raw) ? raw : 'm';
  } catch {
    return 'm';
  }
}

export function saveMobileCardGridSize(size: MobileCardGridSize): void {
  try {
    browserLocalStorage()?.setItem(MOBILE_CARD_GRID_SIZE_KEY, size);
  } catch {
    // ignore unavailable storage
  }
}

/**
 * Scale so a fixed 240px card fills phone width for the focus sheet.
 * Never below 1.0 (browse is for thumbs; focus must be readable).
 */
export function focusCardScale(viewportWidthPx: number, horizontalPaddingPx: number = 24): number {
  const available = Math.max(160, viewportWidthPx - horizontalPaddingPx);
  return Math.min(1.55, Math.max(1.0, available / CARD_DESIGN_WIDTH_PX));
}

/** Tile scale for a grid cell given outer grid width, column count, and gap. */
export function gridCardScale(
  gridWidthPx: number,
  columns: number,
  gapPx: number = 8,
): number {
  const cols = Math.max(1, columns);
  const gaps = gapPx * (cols - 1);
  const cell = Math.max(48, (gridWidthPx - gaps) / cols);
  return Math.min(1, cell / CARD_DESIGN_WIDTH_PX);
}

export function gridTileSize(scale: number): {width: number, height: number} {
  return {
    width: Math.round(CARD_DESIGN_WIDTH_PX * scale),
    height: Math.round(CARD_DESIGN_HEIGHT_PX * scale),
  };
}
