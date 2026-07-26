import {expect} from 'chai';
import {KeystoneConsortium} from '../../../../src/server/cards/consortium/corporations/KeystoneConsortium';
import {SiteForeman} from '../../../../src/server/cards/consortium/SiteForeman';
import {ScaffoldYard} from '../../../../src/server/cards/consortium/ScaffoldYard';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {Payment} from '../../../../src/common/inputs/Payment';
import {Megastructures} from '../../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';

describe('KeystoneConsortium', () => {
  it('starts with 2 iridium and discounts segments by 3', () => {
    const card = new KeystoneConsortium();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    player.playCorporationCard(card);
    expect(player.iridium).eq(2);
    expect(Megastructures.segmentDiscountMc(player)).eq(BALANCE.KEYSTONE_CONSORTIUM_DISCOUNT);

    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0))
      .eq(BALANCE.BRIDGE_SEGMENT_COST_MC - BALANCE.KEYSTONE_CONSORTIUM_DISCOUNT);
  });

  it('three stacked segment discounts floor at zero', () => {
    const card = new KeystoneConsortium();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    player.playedCards.push(new SiteForeman());
    cast(new ScaffoldYard().play(player), undefined);

    // 3 + 2 + 3 = 8; bridge keystone costs 8 → floor 0
    expect(Megastructures.segmentDiscountMc(player)).eq(8);
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    const keystoneIndex = BALANCE.BRIDGE_SEGMENT_COUNT - 1;
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, keystoneIndex)).eq(0);
    expect(Megastructures.effectiveSegmentCostMc(player, bridge, 0)).eq(
      Math.max(0, BALANCE.BRIDGE_SEGMENT_COST_MC - 8));
  });

  it('raises M€ production when placing a keystone', () => {
    const card = new KeystoneConsortium();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    for (let i = 0; i < BALANCE.BRIDGE_SEGMENT_COUNT - 1; i++) {
      bridge.segments[i].owner = player.id;
    }
    player.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    player.megaCredits = 20;
    const prodBefore = player.production.megacredits;
    // effective cost = 8 - 3 = 5; pay 2 iridium (min) + 5 MC? iridium worth 4 → 8, enough alone
    Megastructures.placeSegment(player, bridge, Payment.of({
      iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM,
      megacredits: 0,
    }));
    expect(bridge.completed).is.true;
    // Keystone Consortium +1, plus bridge contributor bonus for all owned segments.
    expect(player.production.megacredits).eq(
      prodBefore + 1 +
      BALANCE.BRIDGE_SEGMENT_COUNT * BALANCE.BRIDGE_MC_PRODUCTION_PER_SEGMENT);
  });
});
