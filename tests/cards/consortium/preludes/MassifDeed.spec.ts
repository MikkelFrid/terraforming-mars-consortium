import {expect} from 'chai';
import {MassifDeed} from '../../../../src/server/cards/consortium/preludes/MassifDeed';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SelectSpace} from '../../../../src/server/inputs/SelectSpace';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';

describe('MassifDeed', () => {
  it('raises M€ production and places a city adjacent to highland', () => {
    const card = new MassifDeed();
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });

    expect(card.canPlay(player)).is.true;
    cast(card.play(player), undefined);
    runAllActions(game);

    expect(player.production.megacredits).eq(1);
    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    const space = selectSpace.spaces[0];
    expect(game.board.getAdjacentSpaces(space).some((a) => a.spaceType === SpaceType.HIGHLAND)).is.true;
    selectSpace.cb(space);
    expect(space.player).eq(player);
  });
});
