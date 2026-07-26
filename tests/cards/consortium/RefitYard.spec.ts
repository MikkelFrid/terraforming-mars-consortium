import {expect} from 'chai';
import {RefitYard} from '../../../src/server/cards/consortium/RefitYard';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('RefitYard', () => {
  it('action spends 3 M€ for 1 steel and 1 titanium', () => {
    const card = new RefitYard();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.megaCredits = 3;
    player.steel = 0;
    player.titanium = 0;
    expect(card.canAct(player)).is.true;
    cast(card.action(player), undefined);
    expect(player.megaCredits).eq(0);
    expect(player.steel).eq(1);
    expect(player.titanium).eq(1);
  });
});
