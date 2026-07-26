import {expect} from 'chai';
import {Payment} from '../../src/common/inputs/Payment';
import {Tag} from '../../src/common/cards/Tag';
import {TileType} from '../../src/common/TileType';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {BoardName} from '../../src/common/boards/BoardName';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../src/common/consortium/MegastructureConstants';
import {FOUNDATION_REQUIRED_KINDS, MegastructureKind} from '../../src/common/consortium/MegastructureKind';
import {Game} from '../../src/server/Game';
import {Megastructures, Megastructure} from '../../src/server/consortium/Megastructures';
import {calculateVictoryPoints} from '../../src/server/game/calculateVictoryPoints';
import {testGame} from '../TestGame';
import {fakeCard} from '../TestingUtils';
import {TestPlayer} from '../TestPlayer';
import {IGame} from '../../src/server/IGame';
import {CONSORTIUM_CARD_MANIFEST} from '../../src/server/cards/consortium/ConsortiumCardManifest';

function consortiumGame(n = 3): [IGame, ...TestPlayer[]] {
  return testGame(n, {
    consortiumExpansion: true,
    boardName: BoardName.CONSORTIUM,
  }) as [IGame, ...TestPlayer[]];
}

/** Ensure a grand of the given kind is in play (replace one existing grand if needed). */
function ensureGrand(game: IGame, kind: Exclude<MegastructureKind, 'bridge'>): Megastructure {
  let structure = game.megastructuresData!.structures.find((s) => s.kind === kind);
  if (structure === undefined) {
    structure = {
      id: kind,
      kind,
      segments: Array.from({length: BALANCE.GRAND_SEGMENT_COUNT}, () => ({owner: undefined})),
      completed: false,
    };
    const idx = game.megastructuresData!.structures.findIndex((s) => s.kind !== 'bridge');
    game.megastructuresData!.structures[idx] = structure;
  }
  return structure;
}

function fund(player: TestPlayer): void {
  player.megaCredits = 200;
  player.iridium = 20;
  player.steel = 20;
  player.titanium = 20;
}

function grantHighland(game: IGame, player: TestPlayer): void {
  const highland = game.board.spaces.find((s) =>
    s.spaceType === SpaceType.HIGHLAND && s.tile === undefined && s.player === undefined);
  if (highland !== undefined) {
    game.addTile(player, highland, {tileType: TileType.GREENERY});
  }
}

/** Place all segments; last (keystone) paid with iridium. Contributors cycle unevenly. */
function completeUneven(
  game: IGame,
  structure: Megastructure,
  contributors: TestPlayer[],
  shares: number[],
): void {
  if (FOUNDATION_REQUIRED_KINDS.has(structure.kind)) {
    for (const p of contributors) {
      grantHighland(game, p);
    }
  }
  let idx = 0;
  for (let c = 0; c < contributors.length; c++) {
    for (let n = 0; n < shares[c]; n++) {
      const player = contributors[c];
      fund(player);
      const isKeystone = idx === structure.segments.length - 1;
      if (isKeystone) {
        Megastructures.placeSegment(player, structure, Payment.of({
          iridium: Megastructures.keystoneMinIridium(structure),
        }));
      } else {
        Megastructures.placeSegment(player, structure, Payment.of({
          megacredits: Megastructures.segmentCostMc(structure, idx),
        }));
      }
      idx++;
    }
  }
  expect(structure.completed).is.true;
}

describe('Consortium megastructure effects', () => {
  it('completing bridge sector 1 opens only sector 1 frontier and converts only sector 1 chasms', () => {
    const [game, p1] = consortiumGame(1);
    fund(p1);
    const bridge1 = game.megastructuresData!.structures.find((s) => s.id === 'bridge-1')!;

    const locked1 = game.board.spaces.filter((s) => s.locked === true && s.bridge === 1);
    const locked0 = game.board.spaces.filter((s) => s.locked === true && s.bridge === 0);
    const locked2 = game.board.spaces.filter((s) => s.locked === true && s.bridge === 2);
    const chasms1 = game.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 1);
    const chasms0 = game.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 0);
    expect(locked1.length).to.be.greaterThan(0);
    expect(chasms1.length).eq(8);

    completeUneven(game, bridge1, [p1], [BALANCE.BRIDGE_SEGMENT_COUNT]);

    expect(game.board.spaces.filter((s) => s.locked === true && s.bridge === 1)).to.have.length(0);
    expect(game.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 1)).to.have.length(0);
    expect(chasms1.every((s) => s.spaceType === SpaceType.LAND)).is.true;
    expect(game.board.spaces.filter((s) => s.locked === true && s.bridge === 0)).to.have.length(locked0.length);
    expect(game.board.spaces.filter((s) => s.locked === true && s.bridge === 2)).to.have.length(locked2.length);
    expect(game.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 0)).to.have.length(chasms0.length);
    for (const space of locked1) {
      expect(game.board.canPlaceTile(space)).is.true;
    }
  });

  it('a game saved after a bridge completes reloads with that sector open and others closed', () => {
    const [game, p1] = consortiumGame(1);
    fund(p1);
    const bridge1 = game.megastructuresData!.structures.find((s) => s.id === 'bridge-1')!;
    completeUneven(game, bridge1, [p1], [BALANCE.BRIDGE_SEGMENT_COUNT]);

    const restored = Game.deserialize(game.serialize());
    expect(restored.board.spaces.filter((s) => s.locked === true && s.bridge === 1)).to.have.length(0);
    expect(restored.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 1)).to.have.length(0);
    expect(restored.board.spaces.filter((s) => s.locked === true && s.bridge === 0).length).to.be.greaterThan(0);
    expect(restored.board.spaces.filter((s) => s.locked === true && s.bridge === 2).length).to.be.greaterThan(0);
    expect(restored.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 0).length).eq(8);
    expect(restored.board.spaces.filter((s) => s.spaceType === SpaceType.CHASM && s.sector === 2).length).eq(8);
    expect(restored.megastructuresData!.structures.find((s) => s.id === 'bridge-1')!.completed).is.true;
  });

  it('Space Elevator applies global discount and contributor titanium production', () => {
    const [game, p1, p2, p3] = consortiumGame(3);
    const structure = ensureGrand(game, 'space_elevator');
    completeUneven(game, structure, [p1, p2, p3], [3, 2, 1]);

    const spaceCard = fakeCard({cost: 20, tags: [Tag.SPACE]});
    expect(p1.getCardCost(spaceCard)).eq(20 - BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT);
    expect(p2.getCardCost(spaceCard)).eq(20 - BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT);
    expect(p3.getCardCost(spaceCard)).eq(20 - BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT);
    const buildingCard = fakeCard({cost: 20, tags: [Tag.BUILDING]});
    expect(p1.getCardCost(buildingCard)).eq(20);

    expect(p1.production.titanium).eq(1);
    expect(p2.production.titanium).eq(1);
    expect(p3.production.titanium).eq(1);
  });

  it('L1 Magnetic Shield reduces greenery cost and grants plant production', () => {
    const [game, p1, p2, p3] = consortiumGame(3);
    const structure = ensureGrand(game, 'l1_magnetic_shield');
    expect(p1.plantsNeededForGreenery).eq(8);
    completeUneven(game, structure, [p1, p2, p3], [3, 2, 1]);
    expect(p1.plantsNeededForGreenery).eq(8 - BALANCE.L1_SHIELD_GREENERY_DISCOUNT);
    expect(p2.plantsNeededForGreenery).eq(8 - BALANCE.L1_SHIELD_GREENERY_DISCOUNT);
    expect(p3.plantsNeededForGreenery).eq(8 - BALANCE.L1_SHIELD_GREENERY_DISCOUNT);
    expect(p1.production.plants).eq(1);
    expect(p2.production.plants).eq(1);
    expect(p3.production.plants).eq(1);
  });

  it('Mohole grants global heat production and immediate iridium per segment', () => {
    const [game, p1, p2, p3] = consortiumGame(3);
    const structure = ensureGrand(game, 'mohole');
    // Leave headroom so keystone spend can return to the bank.
    game.iridiumBank = 20;
    completeUneven(game, structure, [p1, p2, p3], [3, 2, 1]);
    expect(p1.production.heat).eq(BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION);
    expect(p2.production.heat).eq(BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION);
    expect(p3.production.heat).eq(BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION);
    // Immediate grants 3+2+1; keystone spend returns min iridium to bank.
    expect(game.iridiumBank).eq(20 - 6 + BALANCE.GRAND_KEYSTONE_MIN_IRIDIUM);
  });

  it('Solar Mirror raises temperature and grants heat production to contributors', () => {
    const [game, p1, p2, p3] = consortiumGame(3);
    const structure = ensureGrand(game, 'solar_mirror');
    const tempBefore = game.getTemperature();
    completeUneven(game, structure, [p1, p2, p3], [3, 2, 1]);
    expect(game.getTemperature()).eq(tempBefore + BALANCE.SOLAR_MIRROR_TEMPERATURE_STEPS * 2);
    expect(p1.production.heat).eq(1);
    expect(p2.production.heat).eq(1);
    expect(p3.production.heat).eq(1);
  });

  it('Arcology grants global MC production; contributor VP stacks with base segment VP', () => {
    const [game, p1, p2, p3] = consortiumGame(3);
    const structure = ensureGrand(game, 'arcology');
    completeUneven(game, structure, [p1, p2, p3], [3, 2, 1]);
    expect(p1.production.megacredits).eq(BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION);
    expect(p2.production.megacredits).eq(BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION);
    expect(p3.production.megacredits).eq(BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION);

    // Shares [3,2,1]: p3 places the keystone.
    const vp1 = calculateVictoryPoints(p1);
    const vp2 = calculateVictoryPoints(p2);
    const vp3 = calculateVictoryPoints(p3);
    expect(vp1.victoryPoints).eq(
      3 * BALANCE.VP_PER_SEGMENT + 3 * BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT,
    );
    expect(vp2.victoryPoints).eq(
      2 * BALANCE.VP_PER_SEGMENT + 2 * BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT,
    );
    expect(vp3.victoryPoints).eq(
      1 * BALANCE.VP_PER_SEGMENT +
      1 * BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT +
      BALANCE.VP_KEYSTONE_BONUS,
    );
  });

  it('Mohole per-generation iridium is capped at one per player and no-ops when bank is empty', () => {
    const [game, p1, p2] = consortiumGame(2);
    const structure = ensureGrand(game, 'mohole');
    completeUneven(game, structure, [p1, p2], [4, 2]);

    p1.iridium = 0;
    p2.iridium = 0;
    game.iridiumBank = 5;

    Megastructures.grantMoholeGenerationIridium(game);
    expect(p1.iridium).eq(1);
    expect(p2.iridium).eq(1);
    expect(game.iridiumBank).eq(3);

    // Single invocation never grants more than MOHOLE_GENERATION_IRIDIUM.
    p1.iridium = 0;
    p2.iridium = 0;
    Megastructures.grantMoholeGenerationIridium(game);
    expect(p1.iridium).eq(BALANCE.MOHOLE_GENERATION_IRIDIUM);
    expect(p2.iridium).eq(BALANCE.MOHOLE_GENERATION_IRIDIUM);

    game.iridiumBank = 0;
    p1.iridium = 0;
    p2.iridium = 0;
    Megastructures.grantMoholeGenerationIridium(game);
    expect(p1.iridium).eq(0);
    expect(p2.iridium).eq(0);
  });

  it('Bridge contributor gets MC production per segment', () => {
    const [game, p1, p2] = consortiumGame(2);
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    completeUneven(game, bridge, [p1, p2], [3, 1]);
    expect(p1.production.megacredits).eq(3 * BALANCE.BRIDGE_MC_PRODUCTION_PER_SEGMENT);
    expect(p2.production.megacredits).eq(1 * BALANCE.BRIDGE_MC_PRODUCTION_PER_SEGMENT);
  });

  it('Consortium manifest registers the Prospecting project cards', () => {
    expect(Object.keys(CONSORTIUM_CARD_MANIFEST.projectCards)).to.have.length(34);
  });
});
