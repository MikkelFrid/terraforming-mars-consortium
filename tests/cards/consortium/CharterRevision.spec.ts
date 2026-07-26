import {expect} from 'chai';
import {CharterRevision} from '../../../src/server/cards/consortium/CharterRevision';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('CharterRevision', () => {
  it('draws 3 cards and raises M€ production 1', () => {
    const card = new CharterRevision();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const hand = player.cardsInHand.length;
    cast(card.play(player), undefined);
    expect(player.cardsInHand.length).eq(hand + 3);
    expect(player.production.megacredits).eq(1);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new CharterRevision();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));
    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.megacredits).eq(1);
  });
});
