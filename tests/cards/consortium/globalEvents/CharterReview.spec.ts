import {expect} from 'chai';
import {CharterReview} from '../../../../src/server/cards/consortium/globalEvents/CharterReview';
import {SiteForeman} from '../../../../src/server/cards/consortium/SiteForeman';
import {SalvageClaim} from '../../../../src/server/cards/consortium/SalvageClaim';
import {testGame} from '../../../TestGame';
import {Turmoil} from '../../../../src/server/turmoil/Turmoil';

describe('CharterReview', () => {
  it('pays 2 M€ per Structure/Prospecting tag (max 5) plus influence', () => {
    const [game, player] = testGame(2, {
      consortiumExpansion: true,
      turmoilExtension: true,
    });
    player.playedCards.push(new SiteForeman(), new SalvageClaim());
    const turmoil = Turmoil.getTurmoil(game);
    const influence = turmoil.getInfluence(player);

    new CharterReview().resolve(game, turmoil);

    expect(player.megaCredits).eq(2 * (2 + influence));
  });
});
