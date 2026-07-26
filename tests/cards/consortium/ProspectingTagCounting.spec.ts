import {expect} from 'chai';
import {AssayRights} from '../../../src/server/cards/consortium/AssayRights';
import {SalvageClaim} from '../../../src/server/cards/consortium/SalvageClaim';
import {IridiumCartel} from '../../../src/server/cards/consortium/IridiumCartel';
import {CardType} from '../../../src/common/cards/CardType';
import {Tag} from '../../../src/common/cards/Tag';
import {BoardName} from '../../../src/common/boards/BoardName';
import {testGame} from '../../TestGame';

/**
 * Documents the locked design: Salvage Claim and Assay Rights are automated so
 * their Prospecting tags always count. Events store tags in eventTags and are
 * excluded from default Tags.count unless Odyssey is in play.
 */
describe('Consortium Prospecting tag counting', () => {
  it('Salvage Claim and Assay Rights are automated, not events', () => {
    expect(new SalvageClaim().type).eq(CardType.AUTOMATED);
    expect(new AssayRights().type).eq(CardType.AUTOMATED);
  });

  it('Prospecting tags on Salvage Claim and Assay Rights count for Iridium Cartel', () => {
    const [/* game */, player] = testGame(1, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    const cartel = new IridiumCartel();
    player.playedCards.push(new SalvageClaim(), new AssayRights(), cartel);

    expect(player.tags.count(Tag.PROSPECTING)).eq(3);
    expect(cartel.getVictoryPoints(player)).eq(1);
  });
});
