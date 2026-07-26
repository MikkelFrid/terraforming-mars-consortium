import {expect} from 'chai';
import {BasaltQuarry} from '../../../src/server/cards/consortium/BasaltQuarry';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('BasaltQuarry', () => {
  it('places on highland and raises steel production', () => {
    const card = new BasaltQuarry();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.production.steel).eq(1);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) => s.spaceType === SpaceType.HIGHLAND)).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.BASALT_QUARRY);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new BasaltQuarry();
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
