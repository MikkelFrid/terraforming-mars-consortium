import {expect} from 'chai';
import {RimSurvey} from '../../../../src/server/cards/consortium/preludes/RimSurvey';
import {Tag} from '../../../../src/common/cards/Tag';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('RimSurvey', () => {
  it('digs one Structure and one Prospecting card', () => {
    const card = new RimSurvey();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true});

    cast(card.play(player), undefined);

    expect(player.cardsInHand).has.lengthOf(2);
    expect(player.cardsInHand.some((c) => c.tags.includes(Tag.STRUCTURE))).is.true;
    expect(player.cardsInHand.some((c) => c.tags.includes(Tag.PROSPECTING))).is.true;
  });
});
