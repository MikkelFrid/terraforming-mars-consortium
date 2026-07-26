import {expect} from 'chai';
import {IridiumAuthority} from '../../../../src/server/cards/consortium/corporations/IridiumAuthority';
import {testGame} from '../../../TestGame';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {TileType} from '../../../../src/common/TileType';

describe('IridiumAuthority', () => {
  it('starts with 2 iridium', () => {
    const card = new IridiumAuthority();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    player.playCorporationCard(card);
    expect(player.iridium).eq(2);
    // Own starting grant also fires the Authority effect (+1 M€)
    expect(player.megaCredits).eq(43);
  });

  it('fires on another player\'s crater grant', () => {
    const card = new IridiumAuthority();
    const [game, player, opponent] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    player.megaCredits = 0;

    const crater = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.CRATER_FIELD &&
      s.tile === undefined &&
      s.locked !== true)!;
    game.addTile(opponent, crater, {tileType: TileType.CITY});
    expect(opponent.iridium).eq(1);
    expect(player.megaCredits).eq(1);
  });
});
