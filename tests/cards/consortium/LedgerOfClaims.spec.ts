import {expect} from 'chai';
import {LedgerOfClaims} from '../../../src/server/cards/consortium/LedgerOfClaims';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../src/server/consortium/Frontier';

describe('LedgerOfClaims', () => {
  it('counts crater, highland, and frontier tiles and rounds down per 3', () => {
    const card = new LedgerOfClaims();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.getVictoryPoints(player)).eq(0);

    const crater = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined)!;
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    unlockBridgeSector(game.board.spaces, 0);
    const frontier = game.board.spaces.find((s) =>
      Frontier.isFrontierSpace(s) && s.tile === undefined && s.locked !== true)!;

    game.addTile(player, crater, {tileType: TileType.CITY});
    game.addTile(player, highland, {tileType: TileType.GREENERY});
    game.addTile(player, frontier, {tileType: TileType.CITY});
    // 3 tiles → 1 VP
    expect(card.getVictoryPoints(player)).eq(1);

    // One more highland → 4 tiles → still 1 VP (round down)
    const highland2 = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland2, {tileType: TileType.CITY});
    expect(card.getVictoryPoints(player)).eq(1);

    // Two more → 6 tiles → 2 VP
    const crater2 = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined)!;
    const frontier2 = game.board.spaces.find((s) =>
      Frontier.isFrontierSpace(s) && s.tile === undefined && s.locked !== true && s.id !== frontier.id)!;
    game.addTile(player, crater2, {tileType: TileType.GREENERY});
    game.addTile(player, frontier2, {tileType: TileType.GREENERY});
    expect(card.getVictoryPoints(player)).eq(2);
  });
});
