import {expect} from 'chai';
import {ChasmDescent} from '../../../src/server/cards/consortium/ChasmDescent';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../src/server/consortium/Frontier';

describe('ChasmDescent', () => {
  it('requires a completed bridge and targets only former chasms', () => {
    const card = new ChasmDescent();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;

    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.length).to.be.greaterThan(0);
    expect(select.spaces.every((s) => Frontier.isFormerChasm(s))).is.true;
    expect(select.spaces.every((s) => !Frontier.isFrontierSpace(s))).is.true;

    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.CHASM_DESCENT);
    expect(player.iridium).eq(3);
  });
});
