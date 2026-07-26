import {expect} from 'chai';
import {testGame} from '../TestGame';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../src/common/consortium/MegastructureConstants';
import {FOUNDATION_REQUIRED_KINDS} from '../../src/common/consortium/MegastructureKind';
import {Megastructures} from '../../src/server/consortium/Megastructures';
import {createMegastructuresModel} from '../../src/server/models/MegastructuresModel';
import {Payment} from '../../src/common/inputs/Payment';
import {Server} from '../../src/server/models/ServerModel';
import {CONSORTIUM_CARD_MANIFEST} from '../../src/server/cards/consortium/ConsortiumCardManifest';
import {SeededRandom} from '../../src/common/utils/Random';

describe('Consortium megastructures model', () => {
  it('exposes five structures with eligibility for the viewing player', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.megaCredits = 0;
    const model = createMegastructuresModel(game, player)!;
    expect(model.structures).to.have.length(5);
    expect(model.structures.filter((s) => s.kind === 'bridge')).to.have.length(3);
    // Broke player cannot afford ordinary segments.
    const bridge = model.structures.find((s) => s.id === 'bridge-0')!;
    expect(bridge.canContribute).is.false;
    expect(bridge.ineligibility).eq('cannot_afford');
    expect(bridge.nextSegmentCost).eq(BALANCE.BRIDGE_SEGMENT_COST_MC);
    expect(bridge.segments[bridge.segments.length - 1].isKeystone).is.true;
  });

  it('reports missing_foundation for gated structures', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.megaCredits = 100;
    let structure = game.megastructuresData!.structures.find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind));
    if (structure === undefined) {
      structure = Megastructures.initialize(new SeededRandom(0.42)).structures
        .find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind))!;
      game.megastructuresData!.structures.push(structure);
    }
    const model = createMegastructuresModel(game, player)!;
    const gated = model.structures.find((s) => s.id === structure!.id)!;
    expect(gated.ineligibility).eq('missing_foundation');
    expect(gated.canContribute).is.false;
  });

  it('includes completed contributor breakdown and grant text', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    player.megaCredits = 100;
    player.iridium = 5;
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    for (let i = 0; i < 3; i++) {
      Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    }
    Megastructures.placeSegment(player, bridge, Payment.of({iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM}));
    const model = createMegastructuresModel(game, player)!;
    const done = model.structures.find((s) => s.id === 'bridge-0')!;
    expect(done.completed).is.true;
    expect(done.contributors[0].count).eq(4);
    expect(done.contributors[0].keystone).is.true;
    expect(done.completionGranted).to.include('stub');
  });

  it('ServerModel embeds megastructures for the viewing player', () => {
    const [game, player] = testGame(1, {consortiumExpansion: true});
    const view = Server.getPlayerModel(player);
    expect(view.game.megastructures).to.not.be.undefined;
    expect(view.game.megastructures!.structures).to.have.length(5);
  });

  it('Tharsis games have no megastructures model', () => {
    const [game, player] = testGame(1, {});
    expect(createMegastructuresModel(game, player)).is.undefined;
    expect(Server.getPlayerModel(player).game.megastructures).is.undefined;
  });

  it('Consortium manifest projectCards stays empty', () => {
    expect(CONSORTIUM_CARD_MANIFEST.projectCards).to.deep.eq({});
  });
});
