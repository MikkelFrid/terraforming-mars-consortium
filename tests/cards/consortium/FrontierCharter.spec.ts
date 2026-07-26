import {expect} from 'chai';
import {FrontierCharter} from '../../../src/server/cards/consortium/FrontierCharter';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';

describe('FrontierCharter', () => {
  it('scores 1 VP per 2 owned frontier tiles', () => {
    const card = new FrontierCharter();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    unlockBridgeSector(game.board.spaces, 0);
    unlockBridgeSector(game.board.spaces, 1);
    const frontiers = game.board.spaces.filter((s) =>
      s.bridge !== undefined && s.tile === undefined && s.locked !== true);

    expect(card.getVictoryPoints(player)).eq(0);
    game.addTile(player, frontiers[0], {tileType: TileType.CITY});
    expect(card.getVictoryPoints(player)).eq(0);
    game.addTile(player, frontiers[1], {tileType: TileType.GREENERY});
    expect(card.getVictoryPoints(player)).eq(1);
    game.addTile(player, frontiers[2], {tileType: TileType.CITY});
    expect(card.getVictoryPoints(player)).eq(1);
    game.addTile(player, frontiers[3], {tileType: TileType.GREENERY});
    expect(card.getVictoryPoints(player)).eq(2);
  });
});
