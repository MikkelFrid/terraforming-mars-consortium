import {expect} from 'chai';
import {GrandContractor} from '../../../src/server/cards/consortium/GrandContractor';
import {ModularTruss} from '../../../src/server/cards/consortium/ModularTruss';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {ScaffoldYard} from '../../../src/server/cards/consortium/ScaffoldYard';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('GrandContractor', () => {
  it('requires 3 Structure tags', () => {
    const card = new GrandContractor();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(new ModularTruss(), new SiteForeman());
    expect(card.canPlay(player)).is.false;
    player.playedCards.push(new ScaffoldYard());
    expect(card.canPlay(player)).is.true;
  });

  it('scores 1 VP per megastructure with at least 2 segments from the owner', () => {
    const card = new GrandContractor();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 200;
    const bridges = game.megastructuresData!.structures.filter((s) => s.kind === 'bridge');

    Megastructures.placeSegment(player, bridges[0], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(player, bridges[0], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(player, bridges[1], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    expect(card.getVictoryPoints(player)).eq(1);
    Megastructures.placeSegment(player, bridges[1], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    expect(card.getVictoryPoints(player)).eq(2);
  });
});
