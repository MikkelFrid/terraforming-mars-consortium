import {expect} from 'chai';
import {HighlandAnchor} from '../../../src/server/cards/consortium/HighlandAnchor';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';

describe('HighlandAnchor', () => {
  it('requires owning a highland tile', () => {
    const card = new HighlandAnchor();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    expect(card.canPlay(player)).is.true;
  });

  it('places a special tile on a highland space and gains 2 iridium', () => {
    const card = new HighlandAnchor();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;

    const owned = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, owned, {tileType: TileType.CITY});

    cast(card.play(player), undefined);
    runAllActions(game);

    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    expect(selectSpace.spaces.every((s) => s.spaceType === SpaceType.HIGHLAND)).is.true;
    const space = selectSpace.spaces[0];
    selectSpace.cb(space);

    expect(space.tile?.tileType).eq(TileType.HIGHLAND_ANCHOR);
    expect(player.iridium).eq(2);
  });
});
