import {expect} from 'chai';
import {IRIDIUM_BANK_CAPACITY, IRIDIUM_VALUE, CORE_SAMPLING_COST} from '../../src/common/constants';
import {Payment} from '../../src/common/inputs/Payment';
import {Tag} from '../../src/common/cards/Tag';
import {TileType} from '../../src/common/TileType';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {CardName} from '../../src/common/cards/CardName';
import {Game} from '../../src/server/Game';
import {Iridium} from '../../src/server/consortium/Iridium';
import {CoreSamplingStandardProject} from '../../src/server/cards/consortium/standardProjects/CoreSamplingStandardProject';
import {CONSORTIUM_CARD_MANIFEST} from '../../src/server/cards/consortium/ConsortiumCardManifest';
import {CardRequirements} from '../../src/server/cards/requirements/CardRequirements';
import {testGame} from '../TestGame';
import {fakeCard} from '../TestingUtils';
import {cast} from '../../src/common/utils/utils';
import {SelectStandardProjectToPlay} from '../../src/server/inputs/SelectStandardProjectToPlay';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {runAllActions} from '../TestingUtils';

function totalIridium(game: Game): number {
  return game.iridiumBank + game.players.reduce((sum, p) => sum + p.iridium, 0);
}

describe('Consortium iridium', () => {
  it('bank starts full at capacity when consortium is enabled', () => {
    const [game] = testGame(1, {consortiumExpansion: true});
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY);
    expect(totalIridium(game)).eq(IRIDIUM_BANK_CAPACITY);
  });

  it('bank stays empty when consortium is off', () => {
    const [game] = testGame(1, {consortiumExpansion: false});
    expect(game.iridiumBank).eq(0);
  });

  it('bank cannot go negative or exceed the cap', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});

    expect(Iridium.grant(player, IRIDIUM_BANK_CAPACITY + 5)).eq(IRIDIUM_BANK_CAPACITY);
    expect(game.iridiumBank).eq(0);
    expect(player.iridium).eq(IRIDIUM_BANK_CAPACITY);
    expect(Iridium.grant(player, 1)).eq(0);
    expect(game.iridiumBank).eq(0);

    Iridium.spend(player, 5);
    expect(game.iridiumBank).eq(5);
    expect(player.iridium).eq(IRIDIUM_BANK_CAPACITY - 5);

    // Force a corrupted over-return and confirm the cap clamp.
    player.iridium = 0;
    game.iridiumBank = IRIDIUM_BANK_CAPACITY;
    player.iridium = 3;
    Iridium.spend(player, 3);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY);
  });

  it('paying with iridium debits the player and returns units to the bank', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.iridium = 2;
    game.iridiumBank = IRIDIUM_BANK_CAPACITY - 2;
    player.megaCredits = 0;

    const card = fakeCard({
      cost: IRIDIUM_VALUE * 2,
      tags: [Tag.STRUCTURE],
    });

    player.checkPaymentAndPlayCard(card, Payment.of({iridium: 2}));
    expect(player.iridium).eq(0);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY);
    expect(totalIridium(game)).eq(IRIDIUM_BANK_CAPACITY);
  });

  it('iridium CANNOT pay for a card with no Structure or Prospecting tag', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    player.iridium = 3;
    player.megaCredits = 0;

    const card = fakeCard({
      cost: IRIDIUM_VALUE,
      tags: [Tag.BUILDING],
    });

    expect(() => player.checkPaymentAndPlayCard(card, Payment.of({iridium: 1})))
      .to.throw(/Did not spend enough/);

    // Prospecting tag is allowed.
    const prospecting = fakeCard({
      cost: IRIDIUM_VALUE,
      tags: [Tag.PROSPECTING],
    });
    player.checkPaymentAndPlayCard(prospecting, Payment.of({iridium: 1}));
    expect(player.iridium).eq(2);
  });

  it('a card requiring iridium cannot be played without it', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    player.iridium = 0;
    player.megaCredits = 50;

    const card = fakeCard({
      cost: 0,
      requirements: [{iridium: 1}],
    });
    expect(CardRequirements.compile([{iridium: 1}]).satisfies(player, card)).is.false;
    expect(player.canPlay(card)).is.false;

    player.iridium = 1;
    expect(CardRequirements.compile([{iridium: 1}]).satisfies(player, card)).is.true;
    expect(player.canPlay(card)).is.true;
  });

  it('crater grant fires once, and is a no-op when the bank is empty', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const space = game.board.getAvailableSpacesOnLand(player)[0];
    space.spaceType = SpaceType.CRATER_FIELD;

    game.addTile(player, space, {tileType: TileType.CITY});
    expect(space.craterBonusClaimed).is.true;
    expect(player.iridium).eq(1);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY - 1);

    // Second placement after clearing the tile must not re-grant.
    game.removeTile(space.id);
    game.addTile(player, space, {tileType: TileType.GREENERY});
    expect(player.iridium).eq(1);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY - 1);

    // Empty bank: claim still marks the space, grant is a no-op.
    const space2 = game.board.getAvailableSpacesOnLand(player)[0];
    space2.spaceType = SpaceType.CRATER_FIELD;
    game.iridiumBank = 0;
    const before = player.iridium;
    game.addTile(player, space2, {tileType: TileType.CITY});
    expect(space2.craterBonusClaimed).is.true;
    expect(player.iridium).eq(before);
    expect(game.iridiumBank).eq(0);
  });

  it('a saved game without iridium fields still loads', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.iridium = 4;
    const serialized = game.serialize();
    delete serialized.iridiumBank;
    delete serialized.players[0].iridium;

    const restored = Game.deserialize(serialized);
    expect(restored.iridiumBank).eq(0);
    expect(restored.players[0].iridium).eq(0);
  });

  it('iridium held at game end is worth 0 VP', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    const before = player.getVictoryPoints().total;
    player.iridium = 28;
    expect(player.getVictoryPoints().total).eq(before);
  });

  it('gains and spends appear in the game log', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    Iridium.grant(player, 2);
    Iridium.spend(player, 1);
    const messages = game.gameLog.map((m) => m.message);
    expect(messages.some((m) => m.includes('gained') && m.includes('iridium'))).is.true;
    expect(messages.some((m) => m.includes('spent') && m.includes('iridium'))).is.true;
  });

  it('Core Sampling pays MC for 1 iridium when the bank has any', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const sp = new CoreSamplingStandardProject();
    player.megaCredits = CORE_SAMPLING_COST;
    expect(sp.canAct(player)).is.true;

    sp.payAndExecute(player, Payment.of({megacredits: CORE_SAMPLING_COST}));
    runAllActions(game);
    expect(player.megaCredits).eq(0);
    expect(player.iridium).eq(1);
    expect(game.iridiumBank).eq(IRIDIUM_BANK_CAPACITY - 1);

    game.iridiumBank = 0;
    player.megaCredits = CORE_SAMPLING_COST;
    expect(sp.canAct(player)).is.false;
  });

  it('consortium Core Sampling remains a standard project alongside Prospecting cards', () => {
    expect(Object.keys(CONSORTIUM_CARD_MANIFEST.projectCards)).to.have.length(34);
    expect(CONSORTIUM_CARD_MANIFEST.standardProjects[CardName.CORE_SAMPLING_STANDARD_PROJECT])
      .to.not.be.undefined;
  });

  it('iridium payment value is 4', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    expect(player.payingAmount(Payment.of({iridium: 3}), {iridium: true})).eq(12);
  });

  it('Core Sampling is offered among standard projects when consortium is on', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    player.megaCredits = 100;
    const action = cast(player.getActions(), OrOptions);
    const select = cast(
      action.options.find((o) => o.title === 'Standard projects'),
      SelectStandardProjectToPlay,
    );
    expect(select.cards.some((c) => c.name === CardName.CORE_SAMPLING_STANDARD_PROJECT)).is.true;
  });
});
