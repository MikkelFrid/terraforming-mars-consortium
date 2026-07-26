import {expect} from 'chai';
import {IridiumCartel} from '../../../src/server/cards/consortium/IridiumCartel';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('IridiumCartel', () => {
  it('requires 2 Prospecting tags and gains 3 iridium', () => {
    const card = new IridiumCartel();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;

    player.tagsForTest = {prospecting: 1};
    expect(card.canPlay(player)).is.false;
    player.tagsForTest = {prospecting: 2};
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.iridium).eq(3);
  });

  it('scores 1 VP per 2 Prospecting tags including itself', () => {
    const card = new IridiumCartel();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.tagsForTest = {prospecting: 1};
    expect(card.getVictoryPoints(player)).eq(0);
    player.tagsForTest = {prospecting: 2};
    expect(card.getVictoryPoints(player)).eq(1);
    player.tagsForTest = {prospecting: 4};
    expect(card.getVictoryPoints(player)).eq(2);
  });
});
