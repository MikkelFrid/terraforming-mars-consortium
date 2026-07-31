import {expect} from 'chai';
import {Rackham} from '../../../../src/server/cards/consortium/ceos/Rackham';
import {Algae} from '../../../../src/server/cards/base/Algae';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';

describe('Rackham', () => {
  it('lifts iridium payment gate for one generation', () => {
    const card = new Rackham();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true});
    player.playedCards.push(card);

    const algae = new Algae();
    expect(player.affordOptionsForCard(algae).iridium).is.false;

    cast(card.action(player), undefined);
    expect(card.isDisabled).is.true;
    expect(card.opgActionIsActive).is.true;
    expect(player.affordOptionsForCard(algae).iridium).is.true;

    player.finishProductionPhase();
    expect(card.opgActionIsActive).is.false;
    expect(player.affordOptionsForCard(algae).iridium).is.false;
  });
});
