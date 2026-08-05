import {expect} from 'chai';
import {MegastructureAudit} from '../../../../src/server/cards/consortium/globalEvents/MegastructureAudit';
import {Megastructures} from '../../../../src/server/consortium/Megastructures';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {Payment} from '../../../../src/common/inputs/Payment';
import {testGame} from '../../../TestGame';
import {Turmoil} from '../../../../src/server/turmoil/Turmoil';

describe('MegastructureAudit', () => {
  it('rewards players with 2+ segments on incomplete tracks', () => {
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      turmoilExtension: true,
      boardName: BoardName.CONSORTIUM,
    });
    player.megaCredits = 100;
    const bridge = game.megastructuresData!.structures.find((s) => s.kind === 'bridge')!;
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: 12}));
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: 12}));

    new MegastructureAudit().resolve(game, Turmoil.getTurmoil(game));

    expect(player.production.megacredits).eq(1);
  });
});
