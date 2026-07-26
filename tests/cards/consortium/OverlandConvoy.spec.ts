import {expect} from 'chai';
import {OverlandConvoy} from '../../../src/server/cards/consortium/OverlandConvoy';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';

describe('OverlandConvoy', () => {
  it('gains 2 M€ per owned frontier tile', () => {
    const card = new OverlandConvoy();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    unlockBridgeSector(game.board.spaces, 0);
    const frontiers = game.board.spaces.filter((s) =>
      s.bridge !== undefined && s.tile === undefined && s.locked !== true);
    game.addTile(player, frontiers[0], {tileType: TileType.CITY});
    game.addTile(player, frontiers[1], {tileType: TileType.GREENERY});

    player.megaCredits = 0;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(4);
  });
});
