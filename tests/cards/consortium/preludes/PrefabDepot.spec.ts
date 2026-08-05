import {expect} from 'chai';
import {PrefabDepot} from '../../../../src/server/cards/consortium/preludes/PrefabDepot';
import {Tag} from '../../../../src/common/cards/Tag';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('PrefabDepot', () => {
  it('grants steel, digs Structure, and sets one-shot segment discount', () => {
    const card = new PrefabDepot();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true});

    cast(card.play(player), undefined);

    expect(player.steel).eq(4);
    expect(player.cardsInHand).has.lengthOf(1);
    expect(player.cardsInHand[0].tags.includes(Tag.STRUCTURE)).is.true;
    expect(player.nextMegastructureSegmentDiscount).eq(BALANCE.PREFAB_DEPOT_DISCOUNT);
  });
});
