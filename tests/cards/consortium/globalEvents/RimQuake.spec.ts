import {expect} from 'chai';
import {RimQuake} from '../../../../src/server/cards/consortium/globalEvents/RimQuake';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {TileType} from '../../../../src/common/TileType';
import {unlockBridgeSector} from '../../../../src/server/boards/ConsortiumBoard';
import {testGame} from '../../../TestGame';
import {Turmoil} from '../../../../src/server/turmoil/Turmoil';

describe('RimQuake', () => {
  it('charges M€ based on owned frontier tiles', () => {
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      turmoilExtension: true,
      boardName: BoardName.CONSORTIUM,
    });
    unlockBridgeSector(game.board.spaces, 0);
    const frontier = game.board.spaces.find((s) =>
      s.bridge === 0 && s.tile === undefined && s.locked !== true)!;
    game.addTile(player, frontier, {tileType: TileType.CITY});
    player.megaCredits = 20;
    const turmoil = Turmoil.getTurmoil(game);
    const influence = turmoil.getInfluence(player);

    new RimQuake().resolve(game, turmoil);

    expect(player.megaCredits).eq(20 - Math.max(0, 2 - influence));
  });
});
