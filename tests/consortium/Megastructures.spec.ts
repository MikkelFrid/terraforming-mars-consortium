import {expect} from 'chai';
import {Payment} from '../../src/common/inputs/Payment';
import {TileType} from '../../src/common/TileType';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {BoardName} from '../../src/common/boards/BoardName';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../src/common/consortium/MegastructureConstants';
import {FOUNDATION_REQUIRED_KINDS, GRAND_STRUCTURE_KINDS} from '../../src/common/consortium/MegastructureKind';
import {Game} from '../../src/server/Game';
import {Megastructures} from '../../src/server/consortium/Megastructures';
import {CONSORTIUM_CARD_MANIFEST} from '../../src/server/cards/consortium/ConsortiumCardManifest';
import {SeededRandom} from '../../src/common/utils/Random';
import {testGame} from '../TestGame';
import {cast} from '../../src/common/utils/utils';
import {runAllActions} from '../TestingUtils';
import {OrOptions} from '../../src/server/inputs/OrOptions';

describe('Consortium megastructures', () => {
  it('a game always has 3 bridges plus exactly 2 grand structures', () => {
    const [game] = testGame(2, {consortiumExpansion: true});
    const data = game.megastructuresData!;
    expect(data.structures).to.have.length(5);

    const bridges = data.structures.filter((s) => s.kind === 'bridge');
    expect(bridges).to.have.length(BALANCE.BRIDGES_PER_GAME);
    expect(bridges.map((b) => b.sector).sort()).to.deep.eq([0, 1, 2]);
    expect(bridges.every((b) => b.segments.length === BALANCE.BRIDGE_SEGMENT_COUNT)).is.true;

    const grands = data.structures.filter((s) => s.kind !== 'bridge');
    expect(grands).to.have.length(BALANCE.GRAND_STRUCTURES_PER_GAME);
    expect(grands.every((g) => g.segments.length === BALANCE.GRAND_SEGMENT_COUNT)).is.true;
    for (const g of grands) {
      expect(GRAND_STRUCTURE_KINDS).to.include(g.kind);
    }
  });

  it('the two grand structures vary across seeded games', () => {
    // SeededRandom expects a float seed in [0, 1) (see ApiCreateGame / Math.random).
    const pairs = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const data = Megastructures.initialize(new SeededRandom((i + 1) / 41));
      const key = data.structures
        .filter((s) => s.kind !== 'bridge')
        .map((s) => s.kind)
        .sort()
        .join(',');
      pairs.add(key);
    }
    expect(pairs.size).to.be.greaterThan(1);
  });

  it('a segment cannot be paid without sufficient resources', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    const bridge = player.game.megastructuresData!.structures.find((s) => s.kind === 'bridge')!;
    player.megaCredits = 0;
    player.steel = 0;
    player.titanium = 0;
    player.iridium = 0;

    expect(Megastructures.canContribute(player, bridge)).is.false;
    expect(() => Megastructures.placeSegment(player, bridge, Payment.of({megacredits: 12})))
      .to.throw(/Insufficient resources|does not cover/);
  });

  it('the keystone cannot be paid without the minimum iridium', () => {
    const [/* game */, player] = testGame(1, {consortiumExpansion: true});
    const bridge = player.game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    // Fill first three segments so the next is the keystone.
    for (let i = 0; i < 3; i++) {
      player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
      Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    expect(Megastructures.nextSegmentIndex(bridge)).eq(3);
    expect(Megastructures.isKeystone(bridge, 3)).is.true;

    player.megaCredits = BALANCE.BRIDGE_KEYSTONE_COST_MC;
    player.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM - 1;
    expect(Megastructures.canContribute(player, bridge)).is.false;
    expect(() => Megastructures.placeSegment(
      player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_KEYSTONE_COST_MC})))
      .to.throw(/Keystone requires at least/);

    player.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    player.game.iridiumBank -= BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    // 2 iridium = 8 M€ — exact keystone cost.
    player.megaCredits = 0;
    Megastructures.placeSegment(player, bridge, Payment.of({iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM}));
    expect(bridge.completed).is.true;
    expect(bridge.keystonePlayer).eq(player.id);
  });

  it('foundation-gated structure rejects first contribution without highland, accepts with one', () => {
    // Two players avoids solo neutral land claims on highland.
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    let structure = game.megastructuresData!.structures.find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind));
    if (structure === undefined) {
      structure = Megastructures.initialize(new SeededRandom(0.42)).structures
        .find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind))!;
      game.megastructuresData!.structures.push(structure);
    }

    player.megaCredits = 100;
    expect(Megastructures.playerOwnsHighlandTile(player)).is.false;
    expect(Megastructures.canContribute(player, structure)).is.false;
    expect(() => Megastructures.placeSegment(player, structure!, Payment.of({megacredits: BALANCE.GRAND_SEGMENT_COST_MC})))
      .to.throw(/Foundation required/);

    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined && s.player === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    expect(Megastructures.playerOwnsHighlandTile(player)).is.true;
    expect(Megastructures.canContribute(player, structure)).is.true;
    Megastructures.placeSegment(player, structure, Payment.of({megacredits: BALANCE.GRAND_SEGMENT_COST_MC}));
    expect(structure.segments[0].owner).eq(player.id);
  });

  it('completion scores 1 VP per segment plus 2 VP to the keystone player (uneven three-player split)', () => {
    const [game, p1, p2, p3] = testGame(3, {consortiumExpansion: true});
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;

    // Uneven split: p1 pays 2 segments, p2 pays 1, p3 places keystone.
    p1.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC * 2;
    Megastructures.placeSegment(p1, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(p1, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    p2.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    Megastructures.placeSegment(p2, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    p3.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    game.iridiumBank -= BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    Megastructures.placeSegment(p3, bridge, Payment.of({iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM}));

    expect(bridge.completed).is.true;
    // p1: 2 segments → 2; p2: 1 → 1; p3: keystone segment → 1 + 2 bonus → 3
    const megaVp = (player: typeof p1) =>
      player.getVictoryPoints().detailsCards
        .filter((d) => d.cardName.includes('Bridge'))
        .reduce((sum, d) => sum + d.victoryPoint, 0);
    expect(megaVp(p1)).eq(2 * BALANCE.VP_PER_SEGMENT);
    expect(megaVp(p2)).eq(1 * BALANCE.VP_PER_SEGMENT);
    expect(megaVp(p3)).eq(1 * BALANCE.VP_PER_SEGMENT + BALANCE.VP_KEYSTONE_BONUS);
  });

  it('an incomplete structure scores zero at game end', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC * 2;
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    expect(bridge.completed).is.false;
    expect(player.getVictoryPoints().victoryPoints).eq(0);
  });

  it('contribute is rejected on a completed structure', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    for (let i = 0; i < 3; i++) {
      player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
      Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    player.iridium = BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    game.iridiumBank -= BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM;
    Megastructures.placeSegment(player, bridge, Payment.of({iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM}));
    expect(bridge.completed).is.true;

    player.megaCredits = 100;
    player.iridium = 5;
    expect(Megastructures.canContribute(player, bridge)).is.false;
    expect(() => Megastructures.placeSegment(player, bridge, Payment.of({megacredits: 12})))
      .to.throw(/completed/);
  });

  it('a game serialized mid-construction reloads with markers, ownership and completion intact', () => {
    const [game, p1, p2] = testGame(2, {consortiumExpansion: true});
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    p1.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    Megastructures.placeSegment(p1, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    p2.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    Megastructures.placeSegment(p2, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));

    const grandKindsBefore = game.megastructuresData!.structures
      .filter((s) => s.kind !== 'bridge').map((s) => s.kind).sort();

    const restored = Game.deserialize(game.serialize());
    const restoredBridge = restored.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    expect(restoredBridge.completed).is.false;
    expect(restoredBridge.segments[0].owner).eq(p1.id);
    expect(restoredBridge.segments[1].owner).eq(p2.id);
    expect(restoredBridge.segments[2].owner).is.undefined;
    expect(restored.megastructuresData!.structures).to.have.length(5);
    expect(restored.megastructuresData!.structures
      .filter((s) => s.kind !== 'bridge').map((s) => s.kind).sort())
      .to.deep.eq(grandKindsBefore);
  });

  it('a saved game predating this change still loads', () => {
    const [game] = testGame(1, {consortiumExpansion: true});
    const serialized = game.serialize();
    delete serialized.megastructuresData;
    const restored = Game.deserialize(serialized);
    expect(restored.megastructuresData).is.undefined;
    // Game remains playable; iridium bank still present.
    expect(restored.iridiumBank).to.be.a('number');
  });

  it('Consortium manifest projectCards stays empty', () => {
    expect(CONSORTIUM_CARD_MANIFEST.projectCards).to.deep.eq({});
  });

  it('contribute action defers payment with iridium enabled', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    const action = cast(Megastructures.contributeAction(player), OrOptions);
    expect(action.options.length).to.be.greaterThan(0);
    action.options[0].cb();
    runAllActions(game);
    // Auto-paid with pure MC when no alloys/iridium available for mix — or SelectPayment.
    // With only MC and canUseIridium, mustPayWithMegacredits is false if iridium>0;
    // here iridium is 0 and steel/titanium 0, so auto MC pay.
    const bridge = game.megastructuresData!.structures.find((s) => s.segments[0].owner === player.id);
    expect(bridge).to.not.be.undefined;
  });
});
