import {expect} from 'chai';
import {CoreSampleSurvey} from '../../../src/server/cards/consortium/CoreSampleSurvey';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';

describe('CoreSampleSurvey', () => {
  it('gains 2 iridium', () => {
    const card = new CoreSampleSurvey();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    cast(card.play(player), undefined);
    expect(player.iridium).eq(2);
    expect(game.iridiumBank).eq(8);
  });
});
