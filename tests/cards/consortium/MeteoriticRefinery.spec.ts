import {expect} from 'chai';
import {MeteoriticRefinery} from '../../../src/server/cards/consortium/MeteoriticRefinery';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {fakeCard} from '../../TestingUtils';
import {Tag} from '../../../src/common/cards/Tag';

describe('MeteoriticRefinery', () => {
  it('requires 1 iridium to play', () => {
    const card = new MeteoriticRefinery();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    expect(card.canPlay(player)).is.false;
    player.iridium = 1;
    expect(card.canPlay(player)).is.true;
  });

  it('gains 2 M€ when the owner spends iridium', () => {
    const card = new MeteoriticRefinery();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.iridium = 3;
    player.megaCredits = 0;
    game.iridiumBank = 10;

    const prospecting = fakeCard({cost: 8, tags: [Tag.PROSPECTING]});
    player.pay(Payment.of({iridium: 2}));
    // Spend returns iridium to bank; effect grants 2 M€ once per pay().
    expect(player.iridium).eq(1);
    expect(player.megaCredits).eq(2);
    void prospecting;
  });
});
