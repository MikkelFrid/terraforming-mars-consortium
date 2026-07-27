import {expect} from 'chai';
import {IridiumReserve} from '../../../src/server/cards/consortium/IridiumReserve';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('IridiumReserve', () => {
  it('grants 2 iridium and raises iridium payment value above the default', () => {
    const card = new IridiumReserve();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    expect(player.getIridiumValue()).eq(5);

    cast(card.play(player), undefined);
    expect(player.iridium).eq(2);
    expect(player.getIridiumValue()).eq(BALANCE.IRIDIUM_RESERVE_VALUE);

    const paid = player.payingAmount(Payment.of({iridium: 2}), {iridium: true});
    expect(paid).eq(12);
  });
});
