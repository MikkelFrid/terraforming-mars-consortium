import {expect} from 'chai';
import {TalusReclamation} from '../../../src/server/cards/consortium/TalusReclamation';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../src/server/consortium/Frontier';

describe('TalusReclamation', () => {
  it('requires a completed bridge and rejects non-former-chasm targets', () => {
    const card = new TalusReclamation();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    expect(card.canPlay(player)).is.true;

    const select = cast(card.play(player), SelectSpace);
    expect(select.spaces.length).to.be.greaterThan(0);
    expect(select.spaces.every((s) => Frontier.isFormerChasm(s))).is.true;
    expect(select.spaces.every((s) => !Frontier.isFrontierSpace(s))).is.true;

    const oxygen = game.getOxygenLevel();
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.GREENERY);
    expect(game.getOxygenLevel()).eq(oxygen + 1);
  });
});
