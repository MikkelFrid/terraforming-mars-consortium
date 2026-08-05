/** Design width of `.filterDiv` / Card chrome (px). */
export const CARD_DESIGN_WIDTH_PX = 240;

/**
 * Scale so a fixed 240px card fills phone width for the focus sheet.
 * Never below 1.0 (browse is for thumbs; focus must be readable).
 */
export function focusCardScale(viewportWidthPx: number, horizontalPaddingPx: number = 24): number {
  const available = Math.max(160, viewportWidthPx - horizontalPaddingPx);
  return Math.min(1.55, Math.max(1.0, available / CARD_DESIGN_WIDTH_PX));
}
