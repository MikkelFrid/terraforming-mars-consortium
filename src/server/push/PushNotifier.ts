import webpush from 'web-push';
import * as constants from '../../common/constants';
import {PlayerId} from '../../common/Types';
import {PushPayload, StoredPushSubscription} from '../../common/push/PushTypes';
import {Database} from '../database/Database';
import {IPlayer} from '../IPlayer';

const THROTTLE_MS = 45_000;
const lastNotifyAt = new Map<PlayerId, number>();

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) {
    return true;
  }
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    return false;
  }
  const subject = (process.env.VAPID_SUBJECT?.trim() || process.env.URL_ROOT?.trim() || 'mailto:admin@localhost');
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export function getVapidPublicKey(): string | undefined {
  const key = process.env.VAPID_PUBLIC_KEY?.trim();
  return key || undefined;
}

/** Reset module state (tests). */
export function resetPushNotifierForTests(): void {
  vapidConfigured = false;
  lastNotifyAt.clear();
}

export class PushNotifier {
  /**
   * Fire-and-forget "your turn" web push. Safe to call from setWaitingFor —
   * never throws into game logic.
   */
  public static notifyYourTurn(player: IPlayer): void {
    if (player.game.isSoloMode()) {
      return;
    }
    void PushNotifier.sendYourTurn(player.id, player.game.generation).catch((err) => {
      console.warn('PushNotifier.notifyYourTurn failed', err);
    });
  }

  public static async sendYourTurn(playerId: PlayerId, generation: number): Promise<void> {
    if (!configureVapid()) {
      return;
    }
    const now = Date.now();
    const last = lastNotifyAt.get(playerId) ?? 0;
    if (now - last < THROTTLE_MS) {
      return;
    }
    lastNotifyAt.set(playerId, now);

    let subs: ReadonlyArray<StoredPushSubscription>;
    try {
      subs = await Database.getInstance().getPushSubscriptions(playerId);
    } catch (err) {
      console.warn('PushNotifier: failed to load subscriptions', err);
      return;
    }
    if (subs.length === 0) {
      return;
    }

    const payload: PushPayload = {
      title: constants.APP_NAME,
      body: `Your turn — Generation ${generation}`,
      url: `/player?id=${playerId}`,
    };
    const body = JSON.stringify(payload);

    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          body,
        );
      } catch (err: any) {
        const status = err?.statusCode ?? err?.status;
        // Gone / expired subscription — drop it.
        if (status === 404 || status === 410) {
          try {
            await Database.getInstance().deletePushSubscription(sub.endpoint);
          } catch (deleteErr) {
            console.warn('PushNotifier: failed to delete stale subscription', deleteErr);
          }
        } else {
          console.warn('PushNotifier: send failed', status, err?.message ?? err);
        }
      }
    }));
  }
}
