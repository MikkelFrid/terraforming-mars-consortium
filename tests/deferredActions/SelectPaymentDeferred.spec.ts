import {expect} from 'chai';
import {SelectPaymentDeferred} from '../../src/server/deferredActions/SelectPaymentDeferred';
import {SelectPayment} from '../../src/server/inputs/SelectPayment';
import {Payment} from '../../src/common/inputs/Payment';
import {testGame} from '../TestGame';
import {TestPlayer} from '../TestPlayer';
import {cast} from '../../src/common/utils/utils';

describe('SelectPaymentDeferred', () => {
  let player: TestPlayer;

  beforeEach(() => {
    [/* game */, player] = testGame(1, {consortiumExpansion: true});
  });

  it('amount 0 without minIridium auto-resolves empty payment', () => {
    let paid: Payment | undefined;
    const deferred = new SelectPaymentDeferred(player, 0).andThen((p) => {
      paid = p;
    });
    expect(deferred.execute()).is.undefined;
    expect(paid).deep.eq(Payment.of({}));
  });

  it('amount 0 with minIridium still opens SelectPayment for the keystone gate', () => {
    player.iridium = 2;
    player.megaCredits = 0;
    const deferred = new SelectPaymentDeferred(player, 0, {
      canUseIridium: true,
      minIridium: 2,
    });
    const input = cast(deferred.execute(), SelectPayment);
    expect(input.amount).eq(0);
    expect(input.minIridium).eq(2);
  });
});
