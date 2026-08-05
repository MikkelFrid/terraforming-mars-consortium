/** Design width of `.filterDiv` / Card chrome (px). */
export const CARD_DESIGN_WIDTH_PX = 240;

/** Approximate design height of project/corp card chrome (px). */
export const CARD_DESIGN_HEIGHT_PX = 335;

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

export function loadMobileCardGridSize(): MobileCardGridSize {
  if (typeof localStorage === 'undefined') {
    return 'm';
  }
  const raw = localStorage.getItem(MOBILE_CARD_GRID_SIZE_KEY);
  return isMobileCardGridSize(raw) ? raw : 'm';
}

export function saveMobileCardGridSize(size: MobileCardGridSize): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(MOBILE_CARD_GRID_SIZE_KEY, size);
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
