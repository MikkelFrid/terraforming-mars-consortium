import {expect} from 'chai';
import {Underwriter} from '../../../src/server/awards/consortium/Underwriter';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('Underwriter', () => {
  it('scores megastructure segments contributed and reports ties', () => {
    const award = new Underwriter();
    const [game, p1, p2] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    p1.megaCredits = 200;
    p2.megaCredits = 200;
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;

    Megastructures.placeSegment(p1, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(p2, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    expect(award.getScore(p1)).eq(1);
    expect(award.getScore(p2)).eq(1);
    expect(award.getScore(p1)).eq(award.getScore(p2));

    Megastructures.placeSegment(p1, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    expect(award.getScore(p1)).eq(2);
    expect(award.getScore(p2)).eq(1);
  });
});
