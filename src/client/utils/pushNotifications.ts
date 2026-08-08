import {paths} from '@/common/app/paths';
import {isPlayerId, PlayerId} from '@/common/Types';

export type PushEnableResult =
  | 'ok'
  | 'unsupported'
  | 'denied'
  | 'not-configured'
  | 'no-player'
  | 'error';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function playerIdFromLocation(search: string = window.location.search): PlayerId | undefined {
  const id = new URLSearchParams(search).get('id');
  if (id !== null && isPlayerId(id)) {
    return id;
  }
  return undefined;
}

export function pushNotificationsSupported(): boolean {
  return typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

async function fetchVapidPublicKey(): Promise<string | undefined> {
  const res = await fetch('/' + paths.API_PUSH_VAPID_KEY);
  if (!res.ok) {
    return undefined;
  }
  const json = await res.json() as {configured?: boolean; publicKey?: string | null};
  if (!json.configured || !json.publicKey) {
    return undefined;
  }
  return json.publicKey;
}

/**
 * Opt in to Web Push for the current player URL. On iOS this requires the
 * site to be installed to the Home Screen (standalone PWA).
 */
export async function enablePushNotifications(
  playerId: PlayerId | undefined = playerIdFromLocation(),
): Promise<PushEnableResult> {
  if (!pushNotificationsSupported()) {
    return 'unsupported';
  }
  if (playerId === undefined) {
    return 'no-player';
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    return 'denied';
  }

  const publicKey = await fetchVapidPublicKey();
  if (publicKey === undefined) {
    return 'not-configured';
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription === null) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return 'error';
    }

    const res = await fetch('/' + paths.API_PUSH_SUBSCRIBE + '?id=' + encodeURIComponent(playerId), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {p256dh: json.keys.p256dh, auth: json.keys.auth},
      }),
    });
    if (!res.ok) {
      return 'error';
    }
    return 'ok';
  } catch (err) {
    console.warn('enablePushNotifications failed', err);
    return 'error';
  }
}

export async function disablePushNotifications(
  playerId: PlayerId | undefined = playerIdFromLocation(),
): Promise<void> {
  if (!pushNotificationsSupported() || playerId === undefined) {
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription === null) {
      return;
    }
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await fetch('/' + paths.API_PUSH_SUBSCRIBE + '?id=' + encodeURIComponent(playerId), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({endpoint, unsubscribe: true}),
    });
  } catch (err) {
    console.warn('disablePushNotifications failed', err);
  }
}
