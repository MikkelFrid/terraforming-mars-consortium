import {expect} from 'chai';
import {ImpactGlassWorks} from '../../../src/server/cards/consortium/ImpactGlassWorks';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('ImpactGlassWorks', () => {
  it('gains 1 iridium per crater tile on Mars, capped at 4', () => {
    const card = new ImpactGlassWorks();
    const [game, player, player2] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 20;

    const craters = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined);
    // Place 5 crater tiles (mix of owners) — should still cap at 4
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
    player.iridium = 0;
    game.iridiumBank = 10;
    const craters = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.CRATER_FIELD && s.tile === undefined);
    game.addTile(player, craters[0], {tileType: TileType.CITY});
    game.addTile(player, craters[1], {tileType: TileType.GREENERY});
    player.iridium = 0;
    cast(card.play(player), undefined);
    expect(player.iridium).eq(2);
  });
});
