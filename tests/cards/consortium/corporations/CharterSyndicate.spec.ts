import {expect} from 'chai';
import {CharterSyndicate} from '../../../../src/server/cards/consortium/corporations/CharterSyndicate';
import {GrandContractor} from '../../../../src/server/cards/consortium/GrandContractor';
import {SiteForeman} from '../../../../src/server/cards/consortium/SiteForeman';
import {ScaffoldYard} from '../../../../src/server/cards/consortium/ScaffoldYard';
import {IridiumCartel} from '../../../../src/server/cards/consortium/IridiumCartel';
import {testGame} from '../../../TestGame';
import {fakeCard} from '../../../TestingUtils';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {Tag} from '../../../../src/common/cards/Tag';
import {CardType} from '../../../../src/common/cards/CardType';

describe('CharterSyndicate', () => {
  it('satisfies a 3-Structure-tag requirement with 2 real tags', () => {
    const card = new CharterSyndicate();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    // Corp itself has 1 Structure tag; add one more → 2 real
    player.playedCards.push(new SiteForeman());
    expect(player.tags.count(Tag.STRUCTURE, 'raw')).eq(2);

    const grand = new GrandContractor();
    expect(grand.canPlay(player)).is.true;
  });

  it('scores Grand Contractor on the real megastructure count only', () => {
    const card = new CharterSyndicate();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    player.playedCards.push(new SiteForeman(), new ScaffoldYard());
    // 3 Structure tags raw (corp + 2); doubled for requirements but VP is megastructure-based
    const grand = new GrandContractor();
    expect(grand.canPlay(player)).is.true;
    expect(grand.getVictoryPoints(player)).eq(0);

    // Iridium Cartel VP uses raw Prospecting count — Syndicate must not double it
    player.playedCards.push(
      fakeCard({tags: [Tag.PROSPECTING], type: CardType.AUTOMATED}),
      fakeCard({tags: [Tag.PROSPECTING], type: CardType.AUTOMATED}),
    );
    const cartel = new IridiumCartel();
    // 2 Prospecting → 1 VP at per:2; if doubled would be 2 VP
    expect(cartel.getVictoryPoints(player)).eq(1);
  });
});
