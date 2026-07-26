import {expect} from 'chai';
import {LoadBearingStudy} from '../../../src/server/cards/consortium/LoadBearingStudy';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {fakeCard} from '../../TestingUtils';

describe('LoadBearingStudy', () => {
  it('draws 3 cards and gains 2 iridium', () => {
    const card = new LoadBearingStudy();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const a = fakeCard({name: 'A' as any});
    const b = fakeCard({name: 'B' as any});
    const c = fakeCard({name: 'C' as any});
    game.projectDeck.drawPile.push(c, b, a);
    player.iridium = 0;
    game.iridiumBank = 5;

    cast(card.play(player), undefined);
    expect(player.cardsInHand).to.have.members([a, b, c]);
    expect(player.iridium).eq(2);
    expect(card.getVictoryPoints(player)).eq(1);
  });
});
