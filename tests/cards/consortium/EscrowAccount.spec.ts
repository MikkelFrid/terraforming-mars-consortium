import {expect} from 'chai';
import {EscrowAccount} from '../../../src/server/cards/consortium/EscrowAccount';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('EscrowAccount', () => {
  it('gains 3 M€ and draws a card', () => {
    const card = new EscrowAccount();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 0;
    const hand = player.cardsInHand.length;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(3);
    expect(player.cardsInHand.length).eq(hand + 1);
  });
});
