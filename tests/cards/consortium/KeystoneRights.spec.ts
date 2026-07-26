import {expect} from 'chai';
import {KeystoneRights} from '../../../src/server/cards/consortium/KeystoneRights';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('KeystoneRights', () => {
  it('requires 1 iridium to play', () => {
    const card = new KeystoneRights();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    expect(card.canPlay(player)).is.false;
    player.iridium = 1;
    expect(card.canPlay(player)).is.true;
  });

  it('scores only once even when the owner places two keystones', () => {
    const card = new KeystoneRights();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.iridium = 10;
    game.iridiumBank = 20;
    player.megaCredits = 200;

    const bridges = game.megastructuresData!.structures.filter((s) => s.kind === 'bridge');
    for (const bridge of bridges.slice(0, 2)) {
      for (let i = 0; i < BALANCE.BRIDGE_SEGMENT_COUNT - 1; i++) {
        Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
      }
      Megastructures.placeSegment(player, bridge, Payment.of({
        iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM,
      }));
      expect(bridge.completed).is.true;
    }

    expect(card.data).is.true;
    expect(card.getVictoryPoints(player)).eq(BALANCE.KEYSTONE_RIGHTS_EXTRA_VP);
  });
});
