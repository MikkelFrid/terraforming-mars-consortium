import {expect} from 'chai';
import {BondedLabour} from '../../../src/server/cards/consortium/BondedLabour';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('BondedLabour', () => {
  it('gains 4 M€ for each megastructure contributed to', () => {
    const card = new BondedLabour();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const bridges = game.megastructuresData!.structures.filter((s) => s.kind === 'bridge');
    player.megaCredits = 100;
    Megastructures.placeSegment(player, bridges[0], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(player, bridges[1], Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    player.megaCredits = 0;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(8);
  });

  it('gains nothing with no contributions', () => {
    const card = new BondedLabour();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 0;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(0);
  });
});
