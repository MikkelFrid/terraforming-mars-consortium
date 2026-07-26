import {expect} from 'chai';
import {Mason} from '../../../src/server/milestones/consortium/Mason';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE, CONSORTIUM_MA_BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('Mason', () => {
  it('scores total megastructure segments contributed', () => {
    const milestone = new Mason();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 200;
    const bridges = game.megastructuresData!.structures.filter((s) => s.kind === 'bridge');

    expect(milestone.getScore(player)).eq(0);
    expect(milestone.canClaim(player)).is.false;

    for (let i = 0; i < 3; i++) {
      Megastructures.placeSegment(player, bridges[0], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    for (let i = 0; i < 2; i++) {
      Megastructures.placeSegment(player, bridges[1], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    expect(milestone.getScore(player)).eq(CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS);
    expect(milestone.canClaim(player)).is.true;
  });
});
