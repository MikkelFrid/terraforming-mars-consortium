import {expect} from 'chai';
import {SalvageClaim} from '../../../src/server/cards/consortium/SalvageClaim';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('SalvageClaim', () => {
  it('gains 1 iridium and draws a card', () => {
    const card = new SalvageClaim();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 5;
    const handBefore = player.cardsInHand.length;

    cast(card.play(player), undefined);
    runAllActions(game);

    expect(player.iridium).eq(1);
    expect(player.cardsInHand).has.length(handBefore + 1);
  });
});
