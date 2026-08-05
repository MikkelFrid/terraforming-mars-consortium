import {expect} from 'chai';
import {CraterLease} from '../../../../src/server/cards/consortium/preludes/CraterLease';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SelectSpace} from '../../../../src/server/inputs/SelectSpace';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';

describe('CraterLease', () => {
  it('places a city on a crater field when available', () => {
    const card = new CraterLease();
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });

    cast(card.play(player), undefined);
    runAllActions(game);

    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    expect(selectSpace.spaces.every((s) => s.spaceType === SpaceType.CRATER_FIELD)).is.true;
    selectSpace.cb(selectSpace.spaces[0]);
    expect(selectSpace.spaces[0].player).eq(player);
  });

  it('falls back to iridium and M€ without crater spaces', () => {
    const card = new CraterLease();
    const [game, player] = testGame(2, {consortiumExpansion: true});
    // Tharsis has no crater fields.
    const beforeBank = game.iridiumBank;

    cast(card.play(player), undefined);

    expect(player.iridium).eq(1);
    expect(player.megaCredits).eq(3);
    expect(game.iridiumBank).eq(beforeBank - 1);
  });
});
