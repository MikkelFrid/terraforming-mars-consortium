import {expect} from 'chai';
import {Assayer} from '../../../src/server/milestones/consortium/Assayer';
import {ModularTruss} from '../../../src/server/cards/consortium/ModularTruss';
import {SiteForeman} from '../../../src/server/cards/consortium/SiteForeman';
import {ScaffoldYard} from '../../../src/server/cards/consortium/ScaffoldYard';
import {SalvageClaim} from '../../../src/server/cards/consortium/SalvageClaim';
import {AssayRights} from '../../../src/server/cards/consortium/AssayRights';
import {CoreSampleSurvey} from '../../../src/server/cards/consortium/CoreSampleSurvey';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {CONSORTIUM_MA_BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('Assayer', () => {
  it('scores Prospecting and Structure tags combined', () => {
    const milestone = new Assayer();
    const [/* game */, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});

    expect(milestone.getScore(player)).eq(0);
    expect(milestone.canClaim(player)).is.false;

    player.playedCards.push(
      new ModularTruss(),
      new SiteForeman(),
      new ScaffoldYard(),
      new SalvageClaim(),
      new AssayRights(),
      new CoreSampleSurvey(),
    );
    expect(milestone.getScore(player)).eq(CONSORTIUM_MA_BALANCE.ASSAYER_TAG_TOTAL);
    expect(milestone.canClaim(player)).is.true;
  });
});
