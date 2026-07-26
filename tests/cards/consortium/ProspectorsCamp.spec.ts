import {expect} from 'chai';
import {ProspectorsCamp} from '../../../src/server/cards/consortium/ProspectorsCamp';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';

describe('ProspectorsCamp', () => {
  it('gains 1 iridium per owned crater field tile', () => {
    const card = new ProspectorsCamp();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const craters = game.board.getAvailableSpacesOnLand(player)
      .filter((s) => s.spaceType === SpaceType.CRATER_FIELD)
      .slice(0, 3);
    for (const space of craters) {
      game.addTile(player, space, {tileType: TileType.GREENERY});
    }
    player.iridium = 0;
    game.iridiumBank = 20;

    cast(card.play(player), undefined);
    expect(player.iridium).eq(3);
  });
});
