import {expect} from 'chai';
import {HighlandGrant} from '../../../../src/server/cards/consortium/preludes/HighlandGrant';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SelectSpace} from '../../../../src/server/inputs/SelectSpace';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';

describe('HighlandGrant', () => {
  it('raises steel production and places a highland city', () => {
    const card = new HighlandGrant();
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });

    expect(card.canPlay(player)).is.true;
    cast(card.play(player), undefined);
    runAllActions(game);

    expect(player.production.steel).eq(1);
    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    expect(selectSpace.spaces.every((s) => s.spaceType === SpaceType.HIGHLAND)).is.true;
    selectSpace.cb(selectSpace.spaces[0]);
    expect(selectSpace.spaces[0].player).eq(player);
  });
});
