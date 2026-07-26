import {expect} from 'chai';
import {EjectaBlanket} from '../../../src/server/cards/consortium/EjectaBlanket';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';

describe('EjectaBlanket', () => {
  it('places adjacent to a crater field and gains steel and iridium', () => {
    const card = new EjectaBlanket();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.steel = 0;
    player.iridium = 0;
    game.iridiumBank = 10;
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.steel).eq(2);
    expect(player.iridium).eq(1);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) =>
      game.board.getAdjacentSpaces(s).some((a) => a.spaceType === SpaceType.CRATER_FIELD))).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.EJECTA_BLANKET);
  });
});
