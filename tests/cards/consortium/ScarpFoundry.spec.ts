import {expect} from 'chai';
import {ScarpFoundry} from '../../../src/server/cards/consortium/ScarpFoundry';
import {IridiumReserve} from '../../../src/server/cards/consortium/IridiumReserve';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';

describe('ScarpFoundry', () => {
  it('requires owning a highland tile', () => {
    const card = new ScarpFoundry();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    expect(card.canPlay(player)).is.true;
  });

  it('raises megastructure steel value to 3 without changing card steel value', () => {
    const card = new ScarpFoundry();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    cast(card.play(player), undefined);
    player.playedCards.push(card);

    expect(player.getSteelValue()).eq(2);
    expect(player.getMegastructureSteelValue()).eq(BALANCE.SCARP_FOUNDRY_STEEL_VALUE);
  });

  it('composes with Iridium Reserve without double counting rates', () => {
    const scarp = new ScarpFoundry();
    const reserve = new IridiumReserve();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});

    player.iridium = 0;
    game.iridiumBank = 10;
    cast(scarp.play(player), undefined);
    player.playedCards.push(scarp);
    cast(reserve.play(player), undefined);
    player.playedCards.push(reserve);

    expect(player.getMegastructureSteelValue()).eq(3);
    expect(player.getIridiumValue()).eq(5);
    expect(player.getSteelValue()).eq(2);

    // 2 steel @ 3 + 1 iridium @ 5 = 11; not double-counted as 2*(3+5) or similar
    const paid = player.payingAmount(Payment.of({steel: 2, iridium: 1}), {
      steel: true,
      iridium: true,
      steelRate: player.getMegastructureSteelValue(),
    });
    expect(paid).eq(2 * 3 + 1 * 5);

    // Ordinary card payment still uses steel 2 and iridium 5
    const cardPaid = player.payingAmount(Payment.of({steel: 2, iridium: 1}), {
      steel: true,
      iridium: true,
    });
    expect(cardPaid).eq(2 * 2 + 1 * 5);

    // Segment placement accepts the composed payment against bridge cost 12
    player.steel = 2;
    player.iridium = 2;
    player.megaCredits = 1;
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    Megastructures.placeSegment(player, bridge, Payment.of({steel: 2, iridium: 1, megacredits: 1}));
    expect(bridge.segments[0].owner).eq(player.id);
  });
});
