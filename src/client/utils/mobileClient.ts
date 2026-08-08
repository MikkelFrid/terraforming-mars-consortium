import {getPreferences, MobileClientMode, PreferencesManager} from '@/client/utils/PreferencesManager';

export const MOBILE_VIEWPORT = 'width=device-width, initial-scale=1, viewport-fit=cover';
export const DESKTOP_VIEWPORT = 'width=1260, user-scalable=1';

const MOBILE_BODY_CLASS = 'mobile-client';

/** URL overrides: ?mobile=1 force on, ?mobile=0 force off. */
export function mobileQueryOverride(): boolean | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const param = new URLSearchParams(window.location.search).get('mobile');
  if (param === '1' || param === 'true' || param === 'on') {
    return true;
  }
  if (param === '0' || param === 'false' || param === 'off') {
    return false;
  }
  return undefined;
}

export function isNarrowViewport(widthPx: number = typeof window !== 'undefined' ? window.innerWidth : 1280): boolean {
  return widthPx < 900;
}

/**
 * Shortest screen side in CSS px. Unlike `window.innerWidth`, this is not
 * inflated by the desktop `width=1260` viewport meta in index.html — so a
 * phone still reports ~390 even before the mobile viewport is applied.
 */
export function deviceShortSidePx(
  screenLike: {width: number; height: number} | undefined =
    typeof screen !== 'undefined' ? screen : undefined,
  fallbackLayoutPx: number = typeof window !== 'undefined' ? window.innerWidth : 1280,
): number {
  if (screenLike === undefined) {
    return fallbackLayoutPx;
  }
  const w = screenLike.width || 0;
  const h = screenLike.height || 0;
  if (w <= 0 || h <= 0) {
    return fallbackLayoutPx;
  }
  return Math.min(w, h);
}

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Auto heuristic: phone-sized screens always; coarse-pointer tablets under
 * 1200px also qualify. Uses min(layout, device short side) so the default
 * desktop viewport meta cannot hide a real phone.
 */
export function autoShouldUseMobileClient(
  layoutWidthPx: number = typeof window !== 'undefined' ? window.innerWidth : 1280,
  shortSidePx: number = deviceShortSidePx(undefined, layoutWidthPx),
): boolean {
  const effectiveWidth = Math.min(layoutWidthPx, shortSidePx);
  if (isNarrowViewport(effectiveWidth)) {
    return true;
  }
  return isCoarsePointer() && effectiveWidth < 1200;
}

export function resolveMobileClientMode(mode: MobileClientMode = getPreferences().mobile_client): boolean {
  const override = mobileQueryOverride();
  if (override !== undefined) {
    return override;
  }
  if (mode === 'on') {
    return true;
  }
  if (mode === 'off') {
    return false;
  }
  return autoShouldUseMobileClient();
}

export function shouldUseMobileClient(): boolean {
  return resolveMobileClientMode();
}

export function setMobileClientPreference(mode: MobileClientMode): void {
  PreferencesManager.INSTANCE.set('mobile_client', mode);
}

export function ensureViewportMeta(): HTMLMetaElement {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (meta === null) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    document.head.appendChild(meta);
  }
  return meta;
}

export function applyClientViewport(mode: 'mobile' | 'desktop'): void {
  if (typeof document === 'undefined') {
    return;
  }
  const meta = ensureViewportMeta();
  meta.setAttribute('content', mode === 'mobile' ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT);
  document.body.classList.toggle(MOBILE_BODY_CLASS, mode === 'mobile');
  document.documentElement.classList.toggle(MOBILE_BODY_CLASS, mode === 'mobile');
}

/** Call before mounting Vue so player-home forks on a correct viewport. */
export function bootstrapMobileClientViewport(): void {
  if (typeof document === 'undefined') {
    return;
  }
  applyClientViewport(shouldUseMobileClient() ? 'mobile' : 'desktop');
}
