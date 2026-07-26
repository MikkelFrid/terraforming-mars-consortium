import {expect} from 'chai';
import {CharterRevision} from '../../../src/server/cards/consortium/CharterRevision';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('CharterRevision', () => {
  it('draws 3 cards and raises M€ production 1', () => {
    const card = new CharterRevision();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const hand = player.cardsInHand.length;
    cast(card.play(player), undefined);
    expect(player.cardsInHand.length).eq(hand + 3);
    expect(player.production.megacredits).eq(1);
  });
});
