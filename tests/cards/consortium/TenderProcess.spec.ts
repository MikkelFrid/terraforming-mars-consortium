import {expect} from 'chai';
import {TenderProcess} from '../../../src/server/cards/consortium/TenderProcess';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {runAllActions} from '../../TestingUtils';

describe('TenderProcess', () => {
  it('looks at top 4 and keeps 2', () => {
    const card = new TenderProcess();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const hand = player.cardsInHand.length;
    cast(card.play(player), undefined);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectCard);
    expect(select.cards).to.have.length(4);
    select.cb([select.cards[0], select.cards[1]]);
    expect(player.cardsInHand.length).eq(hand + 2);
  });
});
