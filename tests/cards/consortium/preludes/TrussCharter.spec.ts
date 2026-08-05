import {expect} from 'chai';
import {TrussCharter} from '../../../../src/server/cards/consortium/preludes/TrussCharter';
import {Megastructures} from '../../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('TrussCharter', () => {
  it('applies permanent segment discount while in play', () => {
    const card = new TrussCharter();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true});

    cast(card.play(player), undefined);
    player.playedCards.push(card);

    expect(Megastructures.segmentDiscountMc(player)).eq(BALANCE.TRUSS_CHARTER_DISCOUNT);
  });
});
