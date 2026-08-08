import * as responses from '../server/responses';
import {getVapidPublicKey, isPushConfigured} from '../push/PushNotifier';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';

/** Public VAPID key for PushManager.subscribe (safe to expose). */
export class ApiPushVapidKey extends Handler {
  public static readonly INSTANCE = new ApiPushVapidKey();

  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, {
      configured: isPushConfigured(),
      publicKey: getVapidPublicKey() ?? null,
    });
  }
}
