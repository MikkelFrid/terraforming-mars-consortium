import {expect} from 'chai';
import {SegmentPrefabrication} from '../../../src/server/cards/consortium/SegmentPrefabrication';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('SegmentPrefabrication', () => {
  it('action spends 2 steel to gain 1 iridium', () => {
    const card = new SegmentPrefabrication();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.steel = 2;
    player.iridium = 0;
    game.iridiumBank = 5;

    expect(card.canAct(player)).is.true;
    cast(card.action(player), undefined);
    expect(player.steel).eq(0);
    expect(player.iridium).eq(1);
  });

  it('cannot act without 2 steel or when the bank is empty', () => {
    const card = new SegmentPrefabrication();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.steel = 1;
    game.iridiumBank = 5;
    expect(card.canAct(player)).is.false;

    player.steel = 2;
    game.iridiumBank = 0;
    expect(card.canAct(player)).is.false;
  });
});
