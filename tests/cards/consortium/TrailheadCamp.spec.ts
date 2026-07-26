import {expect} from 'chai';
import {TrailheadCamp} from '../../../src/server/cards/consortium/TrailheadCamp';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../src/server/consortium/Frontier';

describe('TrailheadCamp', () => {
  it('is unplayable while frontiers are locked, playable after a sector unlocks', () => {
    const card = new TrailheadCamp();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(Frontier.countOpenSectors(game)).eq(0);
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    expect(card.canPlay(player)).is.true;
  });

  it('places a special tile on a frontier space', () => {
    const card = new TrailheadCamp();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    unlockBridgeSector(game.board.spaces, 0);

    cast(card.play(player), undefined);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) => Frontier.isFrontierSpace(s))).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.TRAILHEAD_CAMP);
  });
});
