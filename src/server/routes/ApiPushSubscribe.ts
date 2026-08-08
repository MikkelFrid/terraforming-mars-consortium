import * as responses from '../server/responses';
import {isPlayerId} from '../../common/Types';
import {PushSubscriptionJSON} from '../../common/push/PushTypes';
import {Database} from '../database/Database';
import {isPushConfigured} from '../push/PushNotifier';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {statusCode} from '../../common/http/statusCode';

function isValidSubscription(body: any): body is PushSubscriptionJSON {
  return body !== undefined &&
    typeof body.endpoint === 'string' &&
    body.endpoint.length > 0 &&
    body.keys !== undefined &&
    typeof body.keys.p256dh === 'string' &&
    typeof body.keys.auth === 'string';
}

function readBody(req: Request): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.once('end', () => resolve(body));
  });
}

/**
 * Register or remove a Web Push subscription for a player id (same auth as ApiPlayer).
 * POST body subscription JSON to subscribe; include `"unsubscribe": true` to remove.
 */
export class ApiPushSubscribe extends Handler {
  public static readonly INSTANCE = new ApiPushSubscribe();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.url.searchParams.get('id');
    if (playerId === null || !isPlayerId(playerId)) {
      responses.badRequest(req, res, 'missing or invalid id parameter');
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(await readBody(req));
    } catch (_e) {
      responses.badRequest(req, res, 'invalid JSON body');
      return;
    }

    if (parsed?.unsubscribe === true) {
      const endpoint = typeof parsed.endpoint === 'string' ? parsed.endpoint : undefined;
      if (!endpoint) {
        responses.badRequest(req, res, 'missing endpoint');
        return;
      }
      await Database.getInstance().deletePushSubscription(endpoint);
      res.writeHead(statusCode.ok, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ok: true}));
      return;
    }

    if (!isPushConfigured()) {
      responses.badRequest(req, res, 'Push notifications are not configured on this server');
      return;
    }

    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      responses.notFound(req, res);
      return;
    }
    try {
      const player = game.getPlayerById(playerId);
      if (!this.isUser(player.user, ctx)) {
        responses.notAuthorized(req, res);
        return;
      }
    } catch (err) {
      console.warn(`unable to find player ${playerId}`, err);
      responses.notFound(req, res);
      return;
    }

    if (!isValidSubscription(parsed)) {
      responses.badRequest(req, res, 'invalid push subscription');
      return;
    }

    await Database.getInstance().savePushSubscription({
      playerId,
      endpoint: parsed.endpoint,
      keys: parsed.keys,
    });
    ctx.ipTracker.addParticipant(playerId, ctx.ip);
    res.writeHead(statusCode.ok, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ok: true}));
  }
}
