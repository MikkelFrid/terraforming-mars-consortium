import {expect} from 'chai';
import {Tag} from '../../src/common/cards/Tag';
import {CardName} from '../../src/common/cards/CardName';
import {CardType} from '../../src/common/cards/CardType';
import {fakeCard, testGame} from '../TestingUtils';

describe('Structure and Prospecting tags', () => {
  it('wild tag counts as structure and as prospecting', () => {
    const [/* game */, player] = testGame(1);
    player.playedCards.push(fakeCard({
      type: CardType.AUTOMATED,
      tags: [Tag.WILD],
    }));

    expect(player.tags.count(Tag.STRUCTURE)).eq(1);
    expect(player.tags.count(Tag.PROSPECTING)).eq(1);
    expect(player.tags.count(Tag.STRUCTURE, 'raw')).eq(0);
    expect(player.tags.count(Tag.PROSPECTING, 'raw')).eq(0);
  });

  it('requires N structure tags validates correctly', () => {
    const [/* game */, player] = testGame(1);
    const needsTwoStructures = fakeCard({
      name: 'Needs Two Structures' as CardName,
      cost: 0,
      requirements: [{tag: Tag.STRUCTURE, count: 2}],
    });

    expect(player.canPlay(needsTwoStructures)).is.false;

    player.playedCards.push(fakeCard({tags: [Tag.STRUCTURE]}));
    expect(player.canPlay(needsTwoStructures)).is.false;

    player.playedCards.push(fakeCard({tags: [Tag.STRUCTURE]}));
    expect(player.canPlay(needsTwoStructures)).is.true;
  });

  it('structure tag requirement accepts wild tags toward the count', () => {
    const [/* game */, player] = testGame(1);
    const needsOneStructure = fakeCard({
      name: 'Needs One Structure' as CardName,
      cost: 0,
      requirements: [{tag: Tag.STRUCTURE, count: 1}],
    });

    expect(player.canPlay(needsOneStructure)).is.false;
    player.playedCards.push(fakeCard({tags: [Tag.WILD]}));
    expect(player.canPlay(needsOneStructure)).is.true;
  });
});
