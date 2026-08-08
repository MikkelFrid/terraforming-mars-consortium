import {PlayerId} from '../Types';

/** Browser PushSubscription JSON shape we persist and send with web-push. */
export type PushSubscriptionJSON = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type StoredPushSubscription = PushSubscriptionJSON & {
  playerId: PlayerId;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};
