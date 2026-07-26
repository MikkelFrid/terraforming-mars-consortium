import {expect} from 'chai';
import {Pathfinder} from '../../../src/server/milestones/consortium/Pathfinder';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {CONSORTIUM_MA_BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('Pathfinder', () => {
  it('scores owned tiles in frontier zones', () => {
    const milestone = new Pathfinder();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const frontiers = game.board.spaces.filter((s) =>
      s.bridge !== undefined && s.tile === undefined);

    expect(milestone.getScore(player)).eq(0);
    expect(milestone.canClaim(player)).is.false;

    for (let i = 0; i < CONSORTIUM_MA_BALANCE.PATHFINDER_FRONTIER_TILES; i++) {
      game.addTile(player, frontiers[i], {tileType: TileType.CITY});
    }
    expect(milestone.getScore(player)).eq(CONSORTIUM_MA_BALANCE.PATHFINDER_FRONTIER_TILES);
    expect(milestone.canClaim(player)).is.true;
  });
});
