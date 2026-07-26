import {expect} from 'chai';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('SiteForeman', () => {
  it('permanently discounts megastructure segments by 2 M€ while in play', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const bridge = player.game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0)).eq(BALANCE.BRIDGE_SEGMENT_COST_MC);

    player.playedCards.push(new SiteForeman());
    expect(Megastructures.segmentDiscountMc(player)).eq(BALANCE.SITE_FOREMAN_DISCOUNT);
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0))
      .eq(BALANCE.BRIDGE_SEGMENT_COST_MC - BALANCE.SITE_FOREMAN_DISCOUNT);
  });
});
