import {expect} from 'chai';
import {RegolithSifters} from '../../../src/server/cards/consortium/RegolithSifters';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('RegolithSifters', () => {
  it('raises steel production and gains 1 iridium', () => {
    const card = new RegolithSifters();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 5;

    cast(card.play(player), undefined);
    expect(player.production.steel).eq(1);
    expect(player.iridium).eq(1);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new RegolithSifters();
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
