import {expect} from 'chai';
import {AssayBond} from '../../../../src/server/cards/consortium/preludes/AssayBond';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';

describe('AssayBond', () => {
  it('grants iridium and charges 5 M€', () => {
    const card = new AssayBond();
    const [game, player] = testGame(2, {consortiumExpansion: true});
    player.megaCredits = 10;
    const beforeBank = game.iridiumBank;

    expect(card.canPlay(player)).is.true;
    cast(card.play(player), undefined);
    runAllActions(game);

    expect(player.iridium).eq(2);
    expect(player.megaCredits).eq(5);
    expect(game.iridiumBank).eq(beforeBank - 2);
  });
});
