import {expect} from 'chai';
import {MineralRights} from '../../../src/server/cards/consortium/MineralRights';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';

describe('MineralRights', () => {
  it('grants 1 extra M€ when gaining crater-field iridium', () => {
    const card = new MineralRights();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    cast(card.play(player), undefined);
    player.playedCards.push(card);
    player.megaCredits = 0;
    player.iridium = 0;
    game.iridiumBank = 10;

    const crater = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD &&
      s.tile === undefined &&
      s.locked !== true)!;
    game.addTile(player, crater, {tileType: TileType.CITY});
    expect(player.iridium).eq(1);
    expect(player.megaCredits).eq(1);
  });
});
