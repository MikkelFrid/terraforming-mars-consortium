/* global RequestInit */

import * as constants from '@/common/constants';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {SoundManager} from '@/client/utils/SoundManager';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {paths} from '@/common/app/paths';
import {statusCode} from '@/common/http/statusCode';
import {InputResponse} from '@/common/inputs/InputResponse';
import {INVALID_RUN_ID, AppErrorResponse} from '@/common/app/AppErrorId';
import raw_settings from '@/genfiles/settings.json';
import {WaitingForModel} from '@/common/models/WaitingForModel';
import {isPlayerId} from '@/common/Types';
import {ParticipantId} from '@/common/Types';

const CANNOT_CONTACT_SERVER = 'Unable to reach the server. It may be restarting or down for maintenance.';

export {CANNOT_CONTACT_SERVER};

/** Host callbacks so desktop WaitingFor and the mobile client share submit/poll/notify. */
export type TurnSessionHost = {
  getId: () => ParticipantId;
  getRunId: () => string;
  getGameAge: () => number;
  getUndoCount: () => number;
  isServerBusy: () => boolean;
  setServerBusy: (busy: boolean) => void;
  showAlert: (title: string, message: string, cb?: () => void) => void;
  /** Apply a fresh player view after a successful POST (desktop remounts; mobile may patch). */
  onPlayerView: (playerView: PlayerViewModel | undefined) => void;
  refreshParticipant: () => void;
  isPlayer: () => boolean;
};

export function notifyYourTurn(): void {
  if (getPreferences().enable_sounds) {
    SoundManager.playActivePlayerSound();
  }

  if (typeof Notification === 'undefined') {
    return;
  }

  if (Notification.permission !== 'granted') {
    void Notification.requestPermission();
    return;
  }

  const notificationOptions = {
    icon: 'favicon.ico',
    body: 'It\'s your turn!',
  };
  const notificationTitle = constants.APP_NAME;
  try {
    new Notification(notificationTitle, notificationOptions);
  } catch (_e) {
    if (!window.isSecureContext || !navigator.serviceWorker) {
      return;
    }
    navigator.serviceWorker.ready.then((registration) => {
      void registration.showNotification(notificationTitle, notificationOptions);
    }).catch((err) => {
      console.warn('Failed to display notification with serviceWorker', err);
    });
  }
}

export function submitPlayerInput(host: TurnSessionHost, response: InputResponse): void {
  if (host.isServerBusy()) {
    console.warn('Server request in progress');
    return;
  }

  const url = paths.PLAYER_INPUT + '?id=' + host.getId();
  const options: RequestInit = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({runId: host.getRunId(), ...response}),
  };

  host.setServerBusy(true);
  fetch(url, options)
    .then(async (res) => {
      if (res.ok) {
        host.onPlayerView(await res.json());
        return;
      }
      if (res.status === statusCode.badRequest) {
        const resp = await res.json() as AppErrorResponse;
        let cb = () => {};
        if (resp.id === INVALID_RUN_ID) {
          cb = () => setTimeout(() => window.location.reload(), 100);
        }
        host.showAlert('Error with input', resp.message, cb);
      } else {
        host.showAlert('Error processing response', 'Unexpected response from server. Please try again.');
        console.error(res.statusText);
      }
    })
    .catch((e) => {
      host.showAlert('Error sending input,', CANNOT_CONTACT_SERVER);
      console.error(e);
    })
    .finally(() => {
      host.setServerBusy(false);
    });
}

export function resetPlayerInput(host: TurnSessionHost): void {
  if (host.isServerBusy()) {
    console.warn('Server request in progress');
    return;
  }
  const url = paths.RESET + '?id=' + host.getId();
  host.setServerBusy(true);
  fetch(url, {method: 'GET'})
    .then(async (res) => {
      if (res.ok) {
        host.onPlayerView(await res.json());
        return;
      }
      host.showAlert('Error processing response', 'Unexpected response from server. Please try again.');
    })
    .catch((e) => {
      host.showAlert('Error sending input,', CANNOT_CONTACT_SERVER);
      console.error(e);
    })
    .finally(() => {
      host.setServerBusy(false);
    });
}

export type WaitingForPollHandle = {
  cancel: () => void;
};

/**
 * Poll API_WAITING_FOR until GO/REFRESH or cancel.
 * Returns a handle; caller must cancel on unmount.
 */
export function startWaitingForPoll(
  host: TurnSessionHost,
  onWaitingColors: (colors: WaitingForModel['waitingFor']) => void,
  onGo: () => void,
): WaitingForPollHandle {
  let timeoutId: number | undefined;
  let cancelled = false;

  const ask = () => {
    if (cancelled) {
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open(
      'GET',
      paths.API_WAITING_FOR +
        window.location.search +
        '&gameAge=' + host.getGameAge() +
        '&undoCount=' + host.getUndoCount(),
    );
    xhr.onerror = function() {
      if (cancelled) {
        return;
      }
      host.showAlert('Error fetching state', CANNOT_CONTACT_SERVER, () => schedule());
    };
    xhr.onload = () => {
      if (cancelled) {
        return;
      }
      if (xhr.status === statusCode.ok) {
        const result = xhr.response as WaitingForModel;
        onWaitingColors(result.waitingFor);
        if (result.result === 'GO') {
          host.refreshParticipant();
          onGo();
          return;
        } else if (result.result === 'REFRESH') {
          host.refreshParticipant();
          return;
        }
        schedule();
      } else {
        host.showAlert(
          'Error with input',
          `Received unexpected response from server (${xhr.status}). This is often due to the server restarting.`,
          () => schedule(),
        );
      }
    };
    xhr.responseType = 'json';
    xhr.send();
  };

  const schedule = () => {
    if (cancelled) {
      return;
    }
    timeoutId = window.setTimeout(ask, raw_settings.waitingForTimeout);
  };

  schedule();

  return {
    cancel: () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    },
  };
}

/** Convenience: whether the participant id is a player (vs spectator). */
export function participantIsPlayer(id: ParticipantId): boolean {
  return isPlayerId(id);
}
