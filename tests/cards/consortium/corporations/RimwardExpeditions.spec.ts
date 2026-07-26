import {expect} from 'chai';
import {RimwardExpeditions} from '../../../../src/server/cards/consortium/corporations/RimwardExpeditions';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {TileType} from '../../../../src/common/TileType';
import {Payment} from '../../../../src/common/inputs/Payment';
import {Megastructures} from '../../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';
import {unlockBridgeSector} from '../../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../../src/server/consortium/Frontier';

describe('RimwardExpeditions', () => {
  it('rebates 3 M€ on frontier tile placements', () => {
    const card = new RimwardExpeditions();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    unlockBridgeSector(game.board.spaces, 0);
    const frontier = game.board.spaces.find((s) =>
      Frontier.isFrontierSpace(s) && s.tile === undefined && s.locked !== true)!;
    player.megaCredits = 0;
    game.addTile(player, frontier, {tileType: TileType.CITY});
    runAllActions(game);
    expect(player.megaCredits).eq(BALANCE.RIMWARD_FRONTIER_REBATE);
  });

  it('pays out on a bridge it did not contribute to', () => {
    const card = new RimwardExpeditions();
    const [game, player, contributor] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    // Contributor fills all segments including keystone; Rimward owner contributes nothing
    for (let i = 0; i < BALANCE.BRIDGE_SEGMENT_COUNT - 1; i++) {
      bridge.segments[i].owner = contributor.id;
    }
    contributor.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    contributor.megaCredits = BALANCE.BRIDGE_KEYSTONE_COST_MC;
    player.megaCredits = 0;
    const hand = player.cardsInHand.length;
    Megastructures.placeSegment(contributor, bridge, Payment.of({
      iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM,
    }));
    expect(bridge.completed).is.true;
    expect(player.megaCredits).eq(BALANCE.RIMWARD_BRIDGE_COMPLETE_MC);
    expect(player.cardsInHand.length).eq(hand + 1);
    // Contributor owns all segments — Rimward still free-rides
    expect(bridge.segments.every((s) => s.owner === contributor.id)).is.true;
  });
});
