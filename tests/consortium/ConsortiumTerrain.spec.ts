import {expect} from 'chai';
import {TileType} from '../../src/common/TileType';
import {SpaceBonus} from '../../src/common/boards/SpaceBonus';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {CRATER_FIELD_IRIDIUM_GRANT, IRIDIUM_BANK_CAPACITY} from '../../src/common/constants';
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

  it('crater iridium icons do not double-grant with the terrain hook', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.CRATER_FIELD;
    space.bonus = Array(CRATER_FIELD_IRIDIUM_GRANT).fill(SpaceBonus.IRIDIUM);
    game.iridiumBank = IRIDIUM_BANK_CAPACITY;
    player.iridium = 0;

    game.addTile(player, space, {tileType: TileType.CITY});

    expect(player.iridium).eq(CRATER_FIELD_IRIDIUM_GRANT);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY - CRATER_FIELD_IRIDIUM_GRANT);
    expect(space.craterBonusClaimed).is.true;

    // Survey-style re-grant of space.bonus must not pull more crater iridium.
    game.grantSpaceBonuses(player, space);
    expect(player.iridium).eq(CRATER_FIELD_IRIDIUM_GRANT);
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
