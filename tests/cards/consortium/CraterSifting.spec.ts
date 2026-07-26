import {expect} from 'chai';
import {CraterSifting} from '../../../src/server/cards/consortium/CraterSifting';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';

describe('CraterSifting', () => {
  it('requires owning a crater-field tile and grants 2 iridium', () => {
    const card = new CraterSifting();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    expect(card.canPlay(player)).is.false;

    const crater = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD &&
      s.tile === undefined &&
      s.locked !== true)!;
    game.addTile(player, crater, {tileType: TileType.CITY});
    const before = player.iridium;
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.iridium).eq(before + 2);
  });
});
