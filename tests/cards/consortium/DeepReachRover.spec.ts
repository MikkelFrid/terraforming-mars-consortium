import {expect} from 'chai';
import {DeepReachRover} from '../../../src/server/cards/consortium/DeepReachRover';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';

describe('DeepReachRover', () => {
  it('action grants 1 iridium only when the owner has a frontier tile', () => {
    const card = new DeepReachRover();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 5;

    expect(card.canAct(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    const frontier = game.board.spaces.find((s) =>
      s.bridge !== undefined && s.tile === undefined && s.locked !== true)!;
    game.addTile(player, frontier, {tileType: TileType.CITY});

    expect(card.canAct(player)).is.true;
    cast(card.action(player), undefined);
    expect(player.iridium).eq(1);
  });
});
