import {expect} from 'chai';
import {ImpactGlassWorks} from '../../../src/server/cards/consortium/ImpactGlassWorks';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('ImpactGlassWorks', () => {
  it('gains 1 iridium per crater tile on Mars, capped at 4', () => {
    const card = new ImpactGlassWorks();
    const [game, player, player2] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    game.iridiumBank = 20;

    // Unlock all frontier sectors so locked crater fields become placeable.
    unlockBridgeSector(game.board.spaces, 0);
    unlockBridgeSector(game.board.spaces, 1);
    unlockBridgeSector(game.board.spaces, 2);

    const craters = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined);
    expect(craters.length).to.be.at.least(5);
    for (let i = 0; i < 5; i++) {
      game.addTile(i % 2 === 0 ? player : player2, craters[i], {tileType: TileType.CITY});
    }
    player.iridium = 0;
    cast(card.play(player), undefined);
    expect(player.iridium).eq(BALANCE.IMPACT_GLASS_WORKS_IRIDIUM_CAP);
  });

  it('scales below the cap', () => {
    const card = new ImpactGlassWorks();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    game.iridiumBank = 10;
    const craters = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.CRATER_FIELD &&
      s.tile === undefined &&
      s.locked !== true);
    game.addTile(player, craters[0], {tileType: TileType.CITY});
    game.addTile(player, craters[1], {tileType: TileType.GREENERY});
    player.iridium = 0;
    cast(card.play(player), undefined);
    expect(player.iridium).eq(2);
  });
});
