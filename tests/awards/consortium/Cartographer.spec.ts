import {expect} from 'chai';
import {Cartographer} from '../../../src/server/awards/consortium/Cartographer';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';

describe('Cartographer', () => {
  it('scores owned frontier tiles and reports ties', () => {
    const award = new Cartographer();
    const [game, p1, p2] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    for (const sector of [0, 1, 2]) {
      unlockBridgeSector(game.board.spaces, sector);
    }
    const frontiers = game.board.spaces.filter((s) =>
      s.bridge !== undefined && s.tile === undefined && s.locked !== true);

    game.addTile(p1, frontiers[0], {tileType: TileType.CITY});
    game.addTile(p2, frontiers[1], {tileType: TileType.CITY});
    expect(award.getScore(p1)).eq(1);
    expect(award.getScore(p2)).eq(1);
    expect(award.getScore(p1)).eq(award.getScore(p2));

    game.addTile(p1, frontiers[2], {tileType: TileType.GREENERY});
    expect(award.getScore(p1)).eq(2);
    expect(award.getScore(p2)).eq(1);
  });
});
