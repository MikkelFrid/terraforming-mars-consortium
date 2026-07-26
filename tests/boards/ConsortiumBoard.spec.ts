import {expect} from 'chai';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {ConsortiumBoard, isFrontierUnlocked} from '../../src/server/boards/ConsortiumBoard';
import {SeededRandom} from '../../src/common/utils/Random';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {Board} from '../../src/server/boards/Board';

describe('ConsortiumBoard', () => {
  it('loads all 127 spaces with expected type counts', () => {
    const board = ConsortiumBoard.newInstance(
      {...DEFAULT_GAME_OPTIONS, boardName: BoardName.CONSORTIUM, consortiumExpansion: true},
      new SeededRandom(0),
    );
    const mars = board.spaces.filter((s) => s.spaceType !== SpaceType.COLONY);
    expect(mars).to.have.length(127);

    const counts = {
      land: mars.filter((s) => s.spaceType === SpaceType.LAND).length,
      crater: mars.filter((s) => s.spaceType === SpaceType.CRATER_FIELD).length,
      chasm: mars.filter((s) => s.spaceType === SpaceType.CHASM).length,
      ocean: mars.filter((s) => s.spaceType === SpaceType.OCEAN).length,
      highland: mars.filter((s) => s.spaceType === SpaceType.HIGHLAND).length,
    };
    expect(counts).to.deep.eq({land: 72, crater: 12, chasm: 24, ocean: 13, highland: 6});
  });

  it('has 13 ocean spaces, all in the core zone, none on highland', () => {
    // Core = ring <= 4 (see build_board.py). Oceans must never overlap highland.
    const board = ConsortiumBoard.newInstance(
      {...DEFAULT_GAME_OPTIONS, boardName: BoardName.CONSORTIUM, consortiumExpansion: true},
      new SeededRandom(0),
    );
    const oceans = board.spaces.filter((s) => s.spaceType === SpaceType.OCEAN);
    expect(oceans).to.have.length(13);
    expect(oceans.length).to.be.at.least(9);

    const highlands = new Set(
      board.spaces
        .filter((s) => s.spaceType === SpaceType.HIGHLAND)
        .map((s) => `${s.q},${s.r}`),
    );
    for (const ocean of oceans) {
      expect(ocean.q).to.not.be.undefined;
      expect(ocean.r).to.not.be.undefined;
      const ring = (Math.abs(ocean.q!) + Math.abs(ocean.r!) + Math.abs(ocean.q! + ocean.r!)) / 2;
      expect(ring).to.be.at.most(4);
      expect(highlands.has(`${ocean.q},${ocean.r}`)).is.false;
    }
  });

  it('can place an ocean tile on a Consortium ocean space', () => {
    const [game, player] = testGame(1, {
      boardName: BoardName.CONSORTIUM,
      consortiumExpansion: true,
    });
    const oceanSpace = game.board.getAvailableSpacesForOcean(player)[0];
    expect(oceanSpace).to.not.be.undefined;
    expect(oceanSpace.spaceType).eq(SpaceType.OCEAN);
    game.addOcean(player, oceanSpace);
    expect(oceanSpace.tile?.tileType).eq(TileType.OCEAN);
    expect(game.board.getOceanSpaces()).to.have.length(1);
  });

  it('locked frontier spaces reject placement', () => {
    const [game, player] = testGame(1, {
      boardName: BoardName.CONSORTIUM,
      consortiumExpansion: true,
    });
    const locked = game.board.spaces.find((s) => s.locked === true);
    expect(locked).to.not.be.undefined;
    expect(isFrontierUnlocked(locked!)).is.false;
    expect(game.board.canPlaceTile(locked!)).is.false;
    expect(game.board.getAvailableSpacesOnLand(player)).to.not.include(locked);

    expect(() => game.addTile(player, locked!, {tileType: TileType.CITY}))
      .to.throw(/locked frontier/);
  });

  it('chasm spaces reject placement', () => {
    const [game, player] = testGame(1, {
      boardName: BoardName.CONSORTIUM,
      consortiumExpansion: true,
    });
    const chasm = game.board.spaces.find((s) => s.spaceType === SpaceType.CHASM);
    expect(chasm).to.not.be.undefined;
    expect(Board.isUnplaceableSpaceType(chasm!.spaceType)).is.true;
    expect(game.board.getAvailableSpacesOnLand(player)).to.not.include(chasm);
    expect(() => game.addTile(player, chasm!, {tileType: TileType.CITY}))
      .to.throw(/unplaceable/);
  });

  it('ocean on highland is rejected', () => {
    const [game, player] = testGame(1, {
      boardName: BoardName.CONSORTIUM,
      consortiumExpansion: true,
    });
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined && s.player === undefined);
    expect(highland).to.not.be.undefined;
    expect(() => game.addTile(player, highland!, {tileType: TileType.OCEAN}))
      .to.throw(/Oceans may not be placed on highland/);

    // Non-ocean tiles are allowed.
    game.addTile(player, highland!, {tileType: TileType.CITY});
    expect(highland!.tile?.tileType).eq(TileType.CITY);
  });

  it('axial adjacency is connected for the center', () => {
    const board = ConsortiumBoard.newInstance(
      {...DEFAULT_GAME_OPTIONS, boardName: BoardName.CONSORTIUM},
      new SeededRandom(0),
    );
    const center = board.spaces.find((s) => s.q === 0 && s.r === 0);
    expect(center).to.not.be.undefined;
    expect(board.getAdjacentSpaces(center!)).to.have.length(6);
  });
});
