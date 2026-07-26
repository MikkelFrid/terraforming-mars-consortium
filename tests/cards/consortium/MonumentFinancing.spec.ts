import {expect} from 'chai';
import {MonumentFinancing} from '../../../src/server/cards/consortium/MonumentFinancing';
import {ModularTruss} from '../../../src/server/cards/consortium/ModularTruss';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('MonumentFinancing', () => {
  it('raises M€ production 2 steps', () => {
    const card = new MonumentFinancing();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(2);
  });

  it('scores 1 VP per 3 Structure tags including itself', () => {
    const card = new MonumentFinancing();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    expect(card.getVictoryPoints(player)).eq(0);
    player.playedCards.push(new ModularTruss(), new SiteForeman());
    // 3 Structure tags total → 1 VP
    expect(card.getVictoryPoints(player)).eq(1);
  });
});
