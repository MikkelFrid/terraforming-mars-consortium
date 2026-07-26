import {expect} from 'chai';
import {UnionHall} from '../../../src/server/cards/consortium/UnionHall';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {TileType} from '../../../src/common/TileType';

describe('UnionHall', () => {
  it('places a city and raises M€ production per completed megastructure', () => {
    const card = new UnionHall();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 10;
    game.iridiumBank = 20;
    player.megaCredits = 200;

    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    for (let i = 0; i < BALANCE.BRIDGE_SEGMENT_COUNT - 1; i++) {
      Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    Megastructures.placeSegment(player, bridge, Payment.of({
      iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM,
    }));
    expect(bridge.completed).is.true;
    expect(Megastructures.countCompleted(game)).eq(1);

    const before = player.production.megacredits;
    cast(card.play(player), undefined);
    runAllActions(game);
    const selectSpace = cast(player.popWaitingFor(), SelectSpace);
    selectSpace.cb(selectSpace.spaces[0]);
    expect(selectSpace.spaces[0].tile?.tileType).eq(TileType.CITY);
    expect(player.production.megacredits).eq(before + 1);
  });
});
