import {isPlayerId, PlayerId} from '@/common/Types';

const STORAGE_KEY = 'tm_last_player_id';
const COOKIE_NAME = 'tm_last_player';
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
const SKIP_RESUME_KEY = 'tm_skip_resume';

function localStorageSupported(): boolean {
  return typeof localStorage !== 'undefined';
}

function setCookie(playerId: PlayerId): void {
  if (typeof document === 'undefined') {
    return;
  }
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(playerId)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function readCookie(): string | undefined {
  if (typeof document === 'undefined' || !document.cookie) {
    return undefined;
  }
  for (const part of document.cookie.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === COOKIE_NAME) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return rest.join('=');
      }
    }
  }
  return undefined;
}

function clearCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Persist the player id so the home-screen PWA can resume after start_url="/". */
export function rememberPlayerId(playerId: PlayerId): void {
  if (localStorageSupported()) {
    try {
      localStorage.setItem(STORAGE_KEY, playerId);
    } catch {
      // quota / private mode
    }
  }
  setCookie(playerId);
}

export function getLastPlayerId(): PlayerId | undefined {
  if (localStorageSupported()) {
    try {
      const fromStorage = localStorage.getItem(STORAGE_KEY);
      if (fromStorage !== null && isPlayerId(fromStorage)) {
        return fromStorage;
      }
    } catch {
      // ignore
    }
  }
  const fromCookie = readCookie();
  if (fromCookie !== undefined && isPlayerId(fromCookie)) {
    return fromCookie;
  }
  return undefined;
}

export function clearLastPlayerId(): void {
  if (localStorageSupported()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  clearCookie();
}

const BARE_PLAYER_ID = /^p[A-Za-z0-9_-]+$/;

/** Extract a player id from a bare id or a full player URL. */
export function parsePlayerIdFromText(text: string): PlayerId | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  // Prefer query extraction first — isPlayerId only checks a leading "p", so
  // strings like "player?id=…" would otherwise match incorrectly.
  const match = /(?:^|[?&])id=(p[A-Za-z0-9_-]+)/.exec(trimmed);
  if (match !== null && isPlayerId(match[1])) {
    return match[1];
  }
  try {
    const base = typeof location !== 'undefined' ? location.origin : 'https://example.invalid';
    const url = new URL(trimmed, base.endsWith('/') ? base : base + '/');
    const id = url.searchParams.get('id');
    if (id !== null && isPlayerId(id)) {
      return id;
    }
  } catch {
    // not a URL
  }
  if (BARE_PLAYER_ID.test(trimmed) && isPlayerId(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export function playerHref(playerId: PlayerId): string {
  return `player?id=${encodeURIComponent(playerId)}`;
}

/** True when running as an installed home-screen web app. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const nav = window.navigator as Navigator & {standalone?: boolean};
  if (nav.standalone === true) {
    return true;
  }
  if (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  return false;
}

export function shouldSkipResume(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(SKIP_RESUME_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSkipResume(skip: boolean): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    if (skip) {
      sessionStorage.setItem(SKIP_RESUME_KEY, '1');
    } else {
      sessionStorage.removeItem(SKIP_RESUME_KEY);
    }
  } catch {
    // ignore
  }
}
