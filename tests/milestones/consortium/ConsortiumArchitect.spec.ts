import {expect} from 'chai';
import {ConsortiumArchitect} from '../../../src/server/milestones/consortium/ConsortiumArchitect';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE, CONSORTIUM_MA_BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('ConsortiumArchitect', () => {
  it('scores total megastructure segments contributed', () => {
    const milestone = new ConsortiumArchitect();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 200;
    const bridges = game.megastructuresData!.structures.filter((s) => s.kind === 'bridge');

    expect(milestone.getScore(player)).eq(0);
    expect(milestone.canClaim(player)).is.false;

    // Bridges have 4 segments; claim needs 5 total — spread across two bridges.
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
