import {expect} from 'chai';
import {ForepersonVale} from '../../../../src/server/cards/consortium/ceos/ForepersonVale';
import {Megastructures} from '../../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {OrOptions} from '../../../../src/server/inputs/OrOptions';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('ForepersonVale', () => {
  it('offers discounted megastructure contribute once', () => {
    const card = new ForepersonVale();
    const [/* game */, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    player.megaCredits = 40;
    player.playedCards.push(card);

    expect(card.canAct(player)).is.true;
    const input = cast(card.action(player), OrOptions);
    expect(input.options).is.not.empty;
    expect(card.isDisabled).is.true;
    expect(player.nextMegastructureSegmentDiscount).eq(BALANCE.FOREPERSON_VALE_DISCOUNT);

    // Discount is consumed on placeSegment; probe that contribute is still valid shape.
    expect(Megastructures.contributeAction(player)).is.not.undefined;
  });
});
