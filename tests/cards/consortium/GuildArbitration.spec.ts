import {expect} from 'chai';
import {GuildArbitration} from '../../../src/server/cards/consortium/GuildArbitration';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {fakeCard} from '../../TestingUtils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Tag} from '../../../src/common/cards/Tag';
import {CardType} from '../../../common/cards/CardType';

describe('GuildArbitration', () => {
  it('requires 3 Earth tags and gains 8 M€', () => {
    const card = new GuildArbitration();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    // Card itself has 1 Earth tag; need 2 more already in play.
    player.playedCards.push(
      fakeCard({tags: [Tag.EARTH], type: CardType.AUTOMATED}),
      fakeCard({tags: [Tag.EARTH], type: CardType.AUTOMATED}),
    );
    expect(card.canPlay(player)).is.true;

    player.megaCredits = 0;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(8);
  });
});
