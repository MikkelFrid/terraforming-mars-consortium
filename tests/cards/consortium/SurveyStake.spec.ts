import {expect} from 'chai';
import {SurveyStake} from '../../../src/server/cards/consortium/SurveyStake';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {fakeCard} from '../../TestingUtils';
import {Tag} from '../../../src/common/cards/Tag';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {IProjectCard} from '../../../src/server/cards/IProjectCard';

describe('SurveyStake', () => {
  it('keeps one Structure card from two drawn and discards the other', () => {
    const card = new SurveyStake();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const structure = fakeCard({name: 'Fake Structure' as any, tags: [Tag.STRUCTURE]});
    const other = fakeCard({name: 'Fake Other' as any, tags: [Tag.SPACE]});
    game.projectDeck.drawPile.push(other, structure);

    cast(card.play(player), undefined);
    expect(player.cardsInHand).to.deep.eq([structure]);
    expect(game.projectDeck.discardPile).to.include(other);
  });

  it('lets the player choose when both drawn cards have Structure tags', () => {
    const card = new SurveyStake();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const a = fakeCard({name: 'Struct A' as any, tags: [Tag.STRUCTURE]});
    const b = fakeCard({name: 'Struct B' as any, tags: [Tag.STRUCTURE, Tag.BUILDING]});
    game.projectDeck.drawPile.push(b, a);

    const select = cast(card.play(player), SelectCard<IProjectCard>);
    expect(select.cards).to.have.members([a, b]);
    select.cb([b]);
    expect(player.cardsInHand).to.deep.eq([b]);
    expect(game.projectDeck.discardPile).to.include(a);
  });

  it('discards both when neither has a Structure tag', () => {
    const card = new SurveyStake();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const a = fakeCard({name: 'A' as any, tags: [Tag.EARTH]});
    const b = fakeCard({name: 'B' as any, tags: [Tag.CITY]});
    game.projectDeck.drawPile.push(b, a);

    cast(card.play(player), undefined);
    expect(player.cardsInHand).to.be.empty;
    expect(game.projectDeck.discardPile).to.include.members([a, b]);
  });
});
