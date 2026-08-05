import {expect} from 'chai';
import {MasonRhee} from '../../../../src/server/cards/consortium/ceos/MasonRhee';
import {Tag} from '../../../../src/common/cards/Tag';
import {SelectCard} from '../../../../src/server/inputs/SelectCard';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';

describe('MasonRhee', () => {
  it('draws Structure cards and keeps two', () => {
    const card = new MasonRhee();
    const [game, player] = testGame(2, {consortiumExpansion: true});
    player.playedCards.push(card);

    expect(card.canAct(player)).is.true;
    cast(card.action(player), undefined);
    runAllActions(game);

    const select = cast(player.popWaitingFor(), SelectCard);
    expect(select.cards).has.lengthOf(3);
    expect(select.cards.every((c) => c.tags.includes(Tag.STRUCTURE))).is.true;
    select.cb([select.cards[0], select.cards[1]]);
    expect(player.cardsInHand).has.lengthOf(2);
  });
});
