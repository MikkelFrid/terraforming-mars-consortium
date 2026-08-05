import {expect} from 'chai';
import {ImpactBasinClaim} from '../../../src/server/cards/consortium/ImpactBasinClaim';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';

describe('ImpactBasinClaim', () => {
  it('places a special tile on a crater field and gains 2 iridium', () => {
    const card = new ImpactBasinClaim();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    // Leave headroom for placement bonus + card grant.
    game.iridiumBank = 10;

    expect(card.canPlay(player)).is.true;
    cast(card.play(player), undefined);
    runAllActions(game);

    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    expect(selectSpace.spaces.every((s) => s.spaceType === SpaceType.CRATER_FIELD)).is.true;
    const space = selectSpace.spaces[0];
    selectSpace.cb(space);

    expect(space.tile?.tileType).eq(TileType.IMPACT_BASIN_CLAIM);
    // Card grants 2; crater placement also grants 2 when bank has any.
    expect(player.iridium).eq(4);
  });
});
