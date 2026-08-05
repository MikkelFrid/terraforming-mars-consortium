import {expect} from 'chai';
import {ClaimStakes} from '../../../../src/server/cards/consortium/preludes/ClaimStakes';
import {Tag} from '../../../../src/common/cards/Tag';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('ClaimStakes', () => {
  it('grants iridium and digs Prospecting cards', () => {
    const card = new ClaimStakes();
    const [game, player] = testGame(2, {consortiumExpansion: true});
    const beforeBank = game.iridiumBank;

    cast(card.play(player), undefined);

    expect(player.iridium).eq(2);
    expect(game.iridiumBank).eq(beforeBank - 2);
    expect(player.cardsInHand).has.lengthOf(2);
    expect(player.cardsInHand.every((c) => c.tags.includes(Tag.PROSPECTING))).is.true;
  });
});
