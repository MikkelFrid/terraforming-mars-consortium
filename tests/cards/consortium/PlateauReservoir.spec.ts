import {expect} from 'chai';
import {PlateauReservoir} from '../../../src/server/cards/consortium/PlateauReservoir';
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

describe('PlateauReservoir', () => {
  it('requires 3 oceans, places on highland, raises plant production 2', () => {
    const card = new PlateauReservoir();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    // Consortium has no reserved ocean spaces; place ocean-on-land.
    const lands = game.board.getAvailableSpacesOnLand(player)
      .filter((s) => s.spaceType === SpaceType.LAND);
    expect(lands.length).to.be.at.least(3);
    for (let i = 0; i < 3; i++) {
      game.addOcean(player, lands[i]);
    }
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.production.plants).eq(2);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) => s.spaceType === SpaceType.HIGHLAND)).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.PLATEAU_RESERVOIR);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new PlateauReservoir();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));
    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.plants).eq(2);
  });
});
