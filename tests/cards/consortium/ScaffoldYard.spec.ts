import {expect} from 'chai';
import {ScaffoldYard} from '../../../src/server/cards/consortium/ScaffoldYard';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('ScaffoldYard', () => {
  it('discounts the next megastructure segment this generation by 3 M€', () => {
    const card = new ScaffoldYard();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const bridge = player.game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;

    cast(card.play(player), undefined);
    expect(player.nextMegastructureSegmentDiscount).eq(BALANCE.SCAFFOLD_YARD_DISCOUNT);
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0))
      .eq(BALANCE.BRIDGE_SEGMENT_COST_MC - BALANCE.SCAFFOLD_YARD_DISCOUNT);

    player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC - BALANCE.SCAFFOLD_YARD_DISCOUNT;
    Megastructures.placeSegment(player, bridge, Payment.of({
      megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC - BALANCE.SCAFFOLD_YARD_DISCOUNT,
    }));
    expect(player.nextMegastructureSegmentDiscount).eq(0);
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 1)).eq(BALANCE.BRIDGE_SEGMENT_COST_MC);
  });

  it('stacks with Site Foreman', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const bridge = player.game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    player.playedCards.push(new SiteForeman());
    cast(new ScaffoldYard().play(player), undefined);

    const expected = BALANCE.BRIDGE_SEGMENT_COST_MC -
      BALANCE.SITE_FOREMAN_DISCOUNT -
      BALANCE.SCAFFOLD_YARD_DISCOUNT;
    expect(Megastructures.segmentDiscountMc(player))
      .eq(BALANCE.SITE_FOREMAN_DISCOUNT + BALANCE.SCAFFOLD_YARD_DISCOUNT);
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0)).eq(expected);
  });
});
