import {expect} from 'chai';
import {BondedFreight} from '../../../src/server/cards/consortium/BondedFreight';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('BondedFreight', () => {
  it('gains 1 titanium and 1 iridium', () => {
    const card = new BondedFreight();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.titanium = 0;
    player.iridium = 0;
    game.iridiumBank = 10;
    cast(card.play(player), undefined);
    expect(player.titanium).eq(1);
    expect(player.iridium).eq(1);
  });
});
