import {expect} from 'chai';
import {ConsortiumLevy} from '../../../src/server/cards/consortium/ConsortiumLevy';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {ScaffoldYard} from '../../../src/server/cards/consortium/ScaffoldYard';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('ConsortiumLevy', () => {
  it('gains 2 M€ per Structure tag', () => {
    const card = new ConsortiumLevy();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(new SiteForeman(), new ScaffoldYard());
    player.megaCredits = 0;
    cast(card.play(player), undefined);
    expect(player.megaCredits).eq(4);
  });
});
