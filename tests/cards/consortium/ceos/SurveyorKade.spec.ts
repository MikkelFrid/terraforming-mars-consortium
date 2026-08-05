import {expect} from 'chai';
import {SurveyorKade} from '../../../../src/server/cards/consortium/ceos/SurveyorKade';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {TileType} from '../../../../src/common/TileType';
import {unlockBridgeSector} from '../../../../src/server/boards/ConsortiumBoard';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('SurveyorKade', () => {
  it('grants iridium per owned crater, capped at 3', () => {
    const card = new SurveyorKade();
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    player.playedCards.push(card);

    // Unlock frontier so locked crater fields become placeable.
    unlockBridgeSector(game.board.spaces, 0);
    unlockBridgeSector(game.board.spaces, 1);
    unlockBridgeSector(game.board.spaces, 2);

    const craters = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined && s.locked !== true);
    expect(craters.length).to.be.at.least(4);
    for (let i = 0; i < 4; i++) {
      game.addTile(player, craters[i], {tileType: TileType.CITY});
    }
    // Crater placement may have granted iridium — isolate the CEO grant.
    player.iridium = 0;
    game.iridiumBank = 10;

    expect(card.canAct(player)).is.true;
    cast(card.action(player), undefined);
    expect(player.iridium).eq(3);
    expect(card.isDisabled).is.true;
  });
});
