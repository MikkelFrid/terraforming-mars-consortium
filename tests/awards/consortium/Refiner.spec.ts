import {expect} from 'chai';
import {Refiner} from '../../../src/server/awards/consortium/Refiner';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Game} from '../../../src/server/Game';
import {Iridium} from '../../../src/server/consortium/Iridium';

describe('Refiner', () => {
  it('scores cumulative iridium spent and reports ties', () => {
    const award = new Refiner();
    const [game, p1, p2] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    p1.iridium = 5;
    p2.iridium = 5;
    game.iridiumBank = 0;

    Iridium.spend(p1, 2);
    Iridium.spend(p2, 2);
    expect(award.getScore(p1)).eq(2);
    expect(award.getScore(p2)).eq(2);
    expect(award.getScore(p1)).eq(award.getScore(p2));

    Iridium.spend(p1, 1);
    expect(award.getScore(p1)).eq(3);
    expect(award.getScore(p2)).eq(2);
  });

  it('cumulative iridium spent survives serialization', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 4;
    game.iridiumBank = 0;
    player.pay(Payment.of({iridium: 3}));
    expect(player.iridiumSpent).eq(3);

    const restored = Game.deserialize(game.serialize());
    expect(restored.players[0].iridiumSpent).eq(3);
    expect(new Refiner().getScore(restored.players[0])).eq(3);
  });
});
