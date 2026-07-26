import {expect} from 'chai';
import {StandardGauge} from '../../../src/server/cards/consortium/StandardGauge';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('StandardGauge', () => {
  it('raises steel production 1 step', () => {
    const card = new StandardGauge();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    cast(card.play(player), undefined);
    expect(player.production.steel).eq(1);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new StandardGauge();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));
    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.steel).eq(1);
  });
});
