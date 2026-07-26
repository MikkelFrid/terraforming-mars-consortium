import {expect} from 'chai';
import {DeepCrustMapping} from '../../../src/server/cards/consortium/DeepCrustMapping';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('DeepCrustMapping', () => {
  it('draws 2 cards and gains 1 iridium', () => {
    const card = new DeepCrustMapping();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 5;
    const handBefore = player.cardsInHand.length;

    cast(card.play(player), undefined);
    runAllActions(game);

    expect(player.iridium).eq(1);
    expect(player.cardsInHand).has.length(handBefore + 2);
  });
});
