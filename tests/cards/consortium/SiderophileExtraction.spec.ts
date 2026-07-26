import {expect} from 'chai';
import {SiderophileExtraction} from '../../../src/server/cards/consortium/SiderophileExtraction';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {Tag} from '../../../src/common/cards/Tag';

describe('SiderophileExtraction', () => {
  it('requires a crater field tile and has no building tag', () => {
    const card = new SiderophileExtraction();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.tags).to.not.include(Tag.BUILDING);
    expect(card.canPlay(player)).is.false;

    const crater = game.board.getAvailableSpacesOnLand(player).find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD)!;
    game.addTile(player, crater, {tileType: TileType.GREENERY});
    expect(card.canPlay(player)).is.true;
  });

  it('gains 2 iridium on play and 1 at generation start when the bank has any', () => {
    const card = new SiderophileExtraction();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const crater = game.board.getAvailableSpacesOnLand(player).find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD)!;
    game.addTile(player, crater, {tileType: TileType.GREENERY});
    // Placement may have granted 1; reset for a clean assertion.
    player.iridium = 0;
    game.iridiumBank = 10;

    cast(card.play(player), undefined);
    player.playedCards.push(card);
    expect(player.iridium).eq(2);

    card.onGenerationStart(player);
    expect(player.iridium).eq(3);
    expect(game.iridiumBank).eq(7);

    game.iridiumBank = 0;
    card.onGenerationStart(player);
    expect(player.iridium).eq(3);
  });
});
