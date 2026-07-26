import {expect} from 'chai';
import {JointVenture} from '../../../src/server/cards/consortium/JointVenture';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('JointVenture', () => {
  it('requires a megastructure contribution and raises M€ production 4', () => {
    const card = new JointVenture();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(4);
  });
});
