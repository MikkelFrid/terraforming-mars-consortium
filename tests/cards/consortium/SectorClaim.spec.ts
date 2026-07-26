import {expect} from 'chai';
import {SectorClaim} from '../../../src/server/cards/consortium/SectorClaim';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('SectorClaim', () => {
  it('requires an open frontier sector', () => {
    const card = new SectorClaim();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    expect(card.canPlay(player)).is.true;
  });

  it('rebates 4 M€ when the owner places a tile in a frontier zone', () => {
    const card = new SectorClaim();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    player.playedCards.push(card);
    player.megaCredits = 0;

    const frontier = game.board.spaces.find((s) =>
      s.bridge !== undefined && s.tile === undefined && s.locked !== true)!;
    game.addTile(player, frontier, {tileType: TileType.CITY});
    runAllActions(game);
    expect(player.megaCredits).eq(BALANCE.SECTOR_CLAIM_REBATE);
  });
});
