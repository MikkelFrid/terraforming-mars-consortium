import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {TileType} from '../../src/common/TileType';
import {unlockBridgeSector} from '../../src/server/boards/ConsortiumBoard';

describe('ConsortiumMapOverlay', () => {
  it('stamps terrain and locked frontier onto Tharsis when Consortium is on', () => {
    const [game, player] = testGame(1, {
      consortiumExpansion: true,
      boardName: BoardName.THARSIS,
    });

    const spaces = game.board.spaces.filter((s) => s.spaceType !== SpaceType.COLONY);
    const highlands = spaces.filter((s) => s.spaceType === SpaceType.HIGHLAND);
    const craters = spaces.filter((s) => s.spaceType === SpaceType.CRATER_FIELD);
    const chasms = spaces.filter((s) => s.spaceType === SpaceType.CHASM);
    const locked = spaces.filter((s) => s.locked === true);

    expect(highlands.length).to.be.at.least(3);
    expect(craters.length).to.be.at.least(4);
    expect(chasms.length).to.eq(9);
    expect(locked.length).to.eq(12);

    for (const space of locked) {
      expect(space.bridge).to.be.oneOf([0, 1, 2]);
      expect(game.board.canPlaceTile(space)).is.false;
      expect(game.board.getAvailableSpacesOnLand(player)).to.not.include(space);
    }

    // Unlocking a bridge opens that sector's frontier.
    const sector0 = locked.filter((s) => s.bridge === 0);
    unlockBridgeSector(game.board.spaces, 0);
    for (const space of sector0) {
      expect(space.locked).to.not.eq(true);
      expect(game.board.canPlaceTile(space)).is.true;
    }
  });

  it('does not overlay native Consortium maps', () => {
    const [game] = testGame(1, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    // Massif locked count is 27 — overlay would be 12.
    const locked = game.board.spaces.filter((s) => s.locked === true).length;
    expect(locked).to.eq(27);
  });

  it('does not overlay when Consortium expansion is off', () => {
    const [game] = testGame(1, {
      consortiumExpansion: false,
      boardName: BoardName.THARSIS,
    });
    const terrain = game.board.spaces.filter((s) =>
      s.spaceType === SpaceType.HIGHLAND ||
      s.spaceType === SpaceType.CRATER_FIELD ||
      s.spaceType === SpaceType.CHASM ||
      s.locked === true);
    expect(terrain).to.be.empty;
  });

  it('rejects placement on locked overlay frontier via addTile', () => {
    const [game, player] = testGame(1, {
      consortiumExpansion: true,
      boardName: BoardName.HELLAS,
    });
    const locked = game.board.spaces.find((s) => s.locked === true);
    expect(locked).to.not.be.undefined;
    expect(() => game.addTile(player, locked!, {tileType: TileType.CITY}))
      .to.throw(/locked frontier/);
  });
});
