import {expect} from 'chai';
import {ApiPushSubscribe} from '../../src/server/routes/ApiPushSubscribe';
import {ApiPushVapidKey} from '../../src/server/routes/ApiPushVapidKey';
import {Game} from '../../src/server/Game';
import {TestPlayer} from '../TestPlayer';
import {MockResponse} from './HttpMocks';
import {RouteTestScaffolding} from './RouteTestScaffolding';
import {statusCode} from '../../src/common/http/statusCode';
import {Database} from '../../src/server/database/Database';
import {SQLite, IN_MEMORY_SQLITE_PATH} from '../../src/server/database/SQLite';
import {resetPushNotifierForTests} from '../../src/server/push/PushNotifier';
import {restoreTestDatabase, setTestDatabase} from '../testing/setup';

async function postJson(scaffolding: RouteTestScaffolding, body: unknown, res: MockResponse): Promise<void> {
  const post = scaffolding.post(ApiPushSubscribe.INSTANCE, res);
  const emit = Promise.resolve().then(() => {
    scaffolding.req.emitter.emit('data', JSON.stringify(body));
    scaffolding.req.emitter.emit('end');
  });
  await Promise.all([emit, post]);
}

describe('ApiPushSubscribe', () => {
  let scaffolding: RouteTestScaffolding;
  let res: MockResponse;
  let previousPublic: string | undefined;
  let previousPrivate: string | undefined;

  before(async () => {
    const db = new SQLite(IN_MEMORY_SQLITE_PATH);
    await db.initialize();
    setTestDatabase(db);
  });

  after(() => {
    restoreTestDatabase();
  });

  beforeEach(() => {
    scaffolding = new RouteTestScaffolding();
    res = new MockResponse();
    previousPublic = process.env.VAPID_PUBLIC_KEY;
    previousPrivate = process.env.VAPID_PRIVATE_KEY;
    process.env.VAPID_PUBLIC_KEY = 'BDD11cwdyx0SEjEMsLW4u2DzZPUwEzxu7JSIR4YIWx_b0133QwC2CdE5XWxEsr2YZe5FIjS_93E34E8F0xid0DA';
    process.env.VAPID_PRIVATE_KEY = '-Ed5DpwKqD3e4JweU3f3Z3D0Ld-hUNERkSN_17_XMmY';
    resetPushNotifierForTests();
  });

  afterEach(() => {
    if (previousPublic === undefined) {
      delete process.env.VAPID_PUBLIC_KEY;
    } else {
      process.env.VAPID_PUBLIC_KEY = previousPublic;
    }
    if (previousPrivate === undefined) {
      delete process.env.VAPID_PRIVATE_KEY;
    } else {
      process.env.VAPID_PRIVATE_KEY = previousPrivate;
    }
    resetPushNotifierForTests();
  });

  it('vapid endpoint reports configured public key', async () => {
    scaffolding.url = '/api/push/vapid';
    await scaffolding.get(ApiPushVapidKey.INSTANCE, res);
    expect(res.statusCode).eq(statusCode.ok);
    const body = JSON.parse(res.content);
    expect(body.configured).eq(true);
    expect(body.publicKey).a('string');
  });

  it('stores a push subscription for a player', async () => {
    const player = TestPlayer.BLUE.newPlayer();
    const game = Game.newInstance('g-push-1', [player], player);
    await scaffolding.ctx.gameLoader.add(game);

    scaffolding.url = '/api/push/subscribe?id=' + player.id;
    await postJson(scaffolding, {
      endpoint: 'https://push.example/sub-1',
      keys: {p256dh: 'p256', auth: 'auth'},
    }, res);
    expect(res.statusCode).eq(statusCode.ok);

    const subs = await Database.getInstance().getPushSubscriptions(player.id);
    expect(subs).length(1);
    expect(subs[0].endpoint).eq('https://push.example/sub-1');
  });

  it('unsubscribes by endpoint', async () => {
    const player = TestPlayer.RED.newPlayer();
    const game = Game.newInstance('g-push-2', [player], player);
    await scaffolding.ctx.gameLoader.add(game);

    await Database.getInstance().savePushSubscription({
      playerId: player.id,
      endpoint: 'https://push.example/sub-2',
      keys: {p256dh: 'p', auth: 'a'},
    });

    scaffolding.url = '/api/push/subscribe?id=' + player.id;
    res = new MockResponse();
    await postJson(scaffolding, {
      endpoint: 'https://push.example/sub-2',
      unsubscribe: true,
    }, res);
    expect(res.statusCode).eq(statusCode.ok);
    expect(await Database.getInstance().getPushSubscriptions(player.id)).length(0);
  });
});
