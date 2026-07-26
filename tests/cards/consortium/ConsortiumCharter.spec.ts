import {expect} from 'chai';
import {ConsortiumCharter} from '../../../src/server/cards/consortium/ConsortiumCharter';
import {ModularTruss} from '../../../src/server/cards/consortium/ModularTruss';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('ConsortiumCharter', () => {
  it('requires 2 Structure tags', () => {
    const card = new ConsortiumCharter();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;
    player.playedCards.push(new ModularTruss());
    expect(card.canPlay(player)).is.false;
    player.playedCards.push(new SiteForeman());
    expect(card.canPlay(player)).is.true;
  });

  it('raises M€ production 1 step and is worth 1 VP', () => {
    const card = new ConsortiumCharter();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(new ModularTruss(), new SiteForeman());
    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(1);
    expect(card.getVictoryPoints(player)).eq(1);
  });
});
