import {expect} from 'chai';
import {IridiumEmbargo} from '../../../../src/server/cards/consortium/globalEvents/IridiumEmbargo';
import {testGame} from '../../../TestGame';
import {Turmoil} from '../../../../src/server/turmoil/Turmoil';
import {Iridium} from '../../../../src/server/consortium/Iridium';

describe('IridiumEmbargo', () => {
  it('returns one iridium to the bank', () => {
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      turmoilExtension: true,
    });
    Iridium.grant(player, 2);
    const bankBefore = game.iridiumBank;

    new IridiumEmbargo().resolve(game, Turmoil.getTurmoil(game));

    expect(player.iridium).eq(1);
    expect(game.iridiumBank).eq(bankBefore + 1);
  });

  it('charges M€ when the player has no iridium', () => {
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      turmoilExtension: true,
    });
    player.iridium = 0;
    player.megaCredits = 10;
    const turmoil = Turmoil.getTurmoil(game);
    const influence = turmoil.getInfluence(player);

    new IridiumEmbargo().resolve(game, turmoil);

    expect(player.megaCredits).eq(10 - Math.max(0, 4 - influence));
  });
});
