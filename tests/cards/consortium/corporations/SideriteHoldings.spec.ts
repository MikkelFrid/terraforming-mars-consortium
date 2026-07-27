import {expect} from 'chai';
import {SideriteHoldings} from '../../../../src/server/cards/consortium/corporations/SideriteHoldings';
import {IridiumReserve} from '../../../../src/server/cards/consortium/IridiumReserve';
import {ScarpFoundry} from '../../../../src/server/cards/consortium/ScarpFoundry';
import {Algae} from '../../../../src/server/cards/base/Algae';
import {testGame} from '../../../TestGame';
import {cast} from '../../../../src/common/utils/utils';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {TileType} from '../../../../src/common/TileType';
import {Payment} from '../../../../src/common/inputs/Payment';

describe('SideriteHoldings', () => {
  it('starts with 4 iridium', () => {
    const card = new SideriteHoldings();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.iridium = 0;
    game.iridiumBank = 10;
    player.playCorporationCard(card);
    expect(player.iridium).eq(4);
    expect(player.megaCredits).eq(38);
  });

  it('can pay for a card with no Structure or Prospecting tag; another player cannot', () => {
    const card = new SideriteHoldings();
    const [game, player, opponent] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);

    const algae = new Algae(); // Plant tag only
    expect(player.affordOptionsForCard(algae).iridium).is.true;
    expect(opponent.affordOptionsForCard(algae).iridium).is.false;
  });

  it('composes with Iridium Reserve and Scarp Foundry without double counting', () => {
    const siderite = new SideriteHoldings();
    const reserve = new IridiumReserve();
    const scarp = new ScarpFoundry();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(siderite);
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    cast(scarp.play(player), undefined);
    player.playedCards.push(scarp);
    game.iridiumBank = 10;
    player.iridium = 0;
    cast(reserve.play(player), undefined);
    player.playedCards.push(reserve);

    expect(player.getIridiumValue()).eq(6);
    expect(player.getSteelValue()).eq(2);
    expect(player.getMegastructureSteelValue()).eq(3);

    // Ordinary card: steel 2, iridium 6 (Siderite opens the gate)
    const algaePaid = player.payingAmount(Payment.of({steel: 1, iridium: 1}), {
      steel: true,
      iridium: true,
    });
    expect(algaePaid).eq(2 + 6);

    // Segment: steel 3, iridium 6 — not double-counted
    const segPaid = player.payingAmount(Payment.of({steel: 1, iridium: 1}), {
      steel: true,
      iridium: true,
      steelRate: player.getMegastructureSteelValue(),
    });
    expect(segPaid).eq(3 + 6);
  });
});
