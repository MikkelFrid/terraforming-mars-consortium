import {expect} from 'chai';
import {AssayRights} from '../../../src/server/cards/consortium/AssayRights';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {fakeCard} from '../../TestingUtils';
import {Tag} from '../../../src/common/cards/Tag';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {IProjectCard} from '../../../src/server/cards/IProjectCard';

describe('AssayRights', () => {
  it('takes one Structure or Prospecting card from the top 3 and discards the rest', () => {
    const card = new AssayRights();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});

    const prospecting = fakeCard({name: 'Fake Prospecting' as any, tags: [Tag.PROSPECTING]});
    const structure = fakeCard({name: 'Fake Structure' as any, tags: [Tag.STRUCTURE]});
    const other = fakeCard({name: 'Fake Other' as any, tags: [Tag.SPACE]});
    game.projectDeck.drawPile.push(other, structure, prospecting);

    const select = cast(card.play(player), SelectCard<IProjectCard>);
    expect(select.cards).to.have.members([prospecting, structure]);
    select.cb([prospecting]);

    expect(player.cardsInHand).to.deep.eq([prospecting]);
    expect(game.projectDeck.discardPile).to.include(structure);
    expect(game.projectDeck.discardPile).to.include(other);
    expect(game.projectDeck.discardPile).to.not.include(prospecting);
  });

  it('discards all three when none match', () => {
    const card = new AssayRights();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const a = fakeCard({name: 'A' as any, tags: [Tag.SPACE]});
    const b = fakeCard({name: 'B' as any, tags: [Tag.EARTH]});
    const c = fakeCard({name: 'C' as any, tags: [Tag.CITY]});
    game.projectDeck.drawPile.push(c, b, a);

    cast(card.play(player), undefined);
    expect(player.cardsInHand).to.be.empty;
    expect(game.projectDeck.discardPile).to.include.members([a, b, c]);
  });
});
