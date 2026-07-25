import {expect} from 'chai';
import {TileType} from '../../src/common/TileType';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {Board} from '../../src/server/boards/Board';
import {testGame} from '../TestGame';

describe('Consortium terrain', () => {
  it('rejects placement on a chasm', () => {
    const [game, player] = testGame(1);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.CHASM;

    expect(Board.isUnplaceableSpaceType(space.spaceType)).is.true;
    expect(game.board.canPlaceTile(space)).is.false;
    expect(game.board.getAvailableSpacesOnLand(player)).to.not.include(space);
    expect(() => game.addTile(player, space, {tileType: TileType.CITY}))
      .to.throw(/unplaceable/);
  });

  it('rejects ocean on highland but allows other tiles', () => {
    const [game, player] = testGame(1);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.HIGHLAND;

    expect(game.board.canPlaceTile(space)).is.true;
    expect(game.board.getAvailableSpacesOnLand(player)).to.include(space);

    expect(() => game.addTile(player, space, {tileType: TileType.OCEAN}))
      .to.throw(/Oceans may not be placed on highland/);

    game.addTile(player, space, {tileType: TileType.CITY});
    expect(space.tile?.tileType).eq(TileType.CITY);
  });

  it('allows greenery on highland', () => {
    const [game, player] = testGame(1);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.HIGHLAND;

    game.addTile(player, space, {tileType: TileType.GREENERY});
    expect(space.tile?.tileType).eq(TileType.GREENERY);
  });

  it('crater field hook fires once per space', () => {
    const [game, player] = testGame(1);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.CRATER_FIELD;

    expect(space.craterBonusClaimed).is.undefined;

    game.addTile(player, space, {tileType: TileType.CITY});
    expect(space.craterBonusClaimed).is.true;

    // Second placement after clearing the tile must not re-claim the bonus.
    game.removeTile(space.id);
    expect(space.craterBonusClaimed).is.true;

    let setCount = 0;
    const claimed = true;
    Object.defineProperty(space, 'craterBonusClaimed', {
      configurable: true,
      enumerable: true,
      get: () => claimed,
      set: () => {
        setCount++;
      },
    });

    game.addTile(player, space, {tileType: TileType.GREENERY});
    expect(setCount).eq(0);
    expect(space.tile?.tileType).eq(TileType.GREENERY);
  });

  it('serializes craterBonusClaimed', () => {
    const [game, player] = testGame(1);
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.CRATER_FIELD;
    game.addTile(player, space, {tileType: TileType.CITY});

    const serialized = game.board.serialize();
    const serializedSpace = serialized.spaces.find((s) => s.id === space.id);
    expect(serializedSpace?.craterBonusClaimed).eq(true);

    const restored = Board.deserializeSpace(serializedSpace!, [player]);
    expect(restored.craterBonusClaimed).eq(true);
  });
});
