/**
 * Consortium full-game validation harness.
 *
 * This is a crash / invariant harness, not a balance study. The default actor
 * picks uniformly among legal options so games reach states a preference-driven
 * bot never would. A weighted mode is kept only for comparison.
 *
 * Usage:
 *   npx tsx tools/consortium/validate.ts
 *   npx tsx tools/consortium/validate.ts --games=200 --modes=random,weighted
 *   npx tsx tools/consortium/validate.ts --mode=weighted --quick
 */
import * as fs from 'fs';
import * as path from 'path';

import {Database} from '../../src/server/database/Database';
import {IDatabase} from '../../src/server/database/IDatabase';
import {GameLoader} from '../../src/server/database/GameLoader';
import {IGameLoader} from '../../src/server/database/IGameLoader';
import {SerializedGame} from '../../src/server/SerializedGame';
import {globalInitialize} from '../../src/server/globalInitialize';
import {Game} from '../../src/server/Game';
import {Player} from '../../src/server/Player';
import {IPlayer} from '../../src/server/IPlayer';
import {Phase} from '../../src/common/Phase';
import {BoardName} from '../../src/common/boards/BoardName';
import {SpaceType} from '../../src/common/boards/SpaceType';
import {Color} from '../../src/common/Color';
import {CardName} from '../../src/common/cards/CardName';
import {Payment} from '../../src/common/inputs/Payment';
import {InputResponse} from '../../src/common/inputs/InputResponse';
import {Units} from '../../src/common/Units';
import {SeededRandom} from '../../src/common/utils/Random';
import {PlayerInput} from '../../src/server/PlayerInput';
import {OrOptions} from '../../src/server/inputs/OrOptions';
import {AndOptions} from '../../src/server/inputs/AndOptions';
import {SelectInitialCards} from '../../src/server/inputs/SelectInitialCards';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {SelectProjectCardToPlay} from '../../src/server/inputs/SelectProjectCardToPlay';
import {SelectStandardProjectToPlay} from '../../src/server/inputs/SelectStandardProjectToPlay';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {SelectPayment} from '../../src/server/inputs/SelectPayment';
import {SelectAmount} from '../../src/server/inputs/SelectAmount';
import {SelectColony} from '../../src/server/inputs/SelectColony';
import {SelectParty} from '../../src/server/inputs/SelectParty';
import {SelectPlayer} from '../../src/server/inputs/SelectPlayer';
import {SelectDelegate} from '../../src/server/inputs/SelectDelegate';
import {SelectProductionToLose} from '../../src/server/inputs/SelectProductionToLose';
import {SelectResource} from '../../src/server/inputs/SelectResource';
import {SelectResources} from '../../src/server/inputs/SelectResources';
import {SelectGlobalEvent} from '../../src/server/inputs/SelectGlobalEvent';
import {ShiftAresGlobalParameters} from '../../src/server/inputs/ShiftAresGlobalParameters';
import {CONSORTIUM_CARD_MANIFEST} from '../../src/server/cards/consortium/ConsortiumCardManifest';
import {Megastructures} from '../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE} from '../../src/common/consortium/MegastructureConstants';
import {MegastructureKind} from '../../src/common/consortium/MegastructureKind';
import {Message} from '../../src/common/logs/Message';
import {IRIDIUM_BANK_CAPACITY} from '../../src/common/constants';
import {IStandardProjectCard} from '../../src/server/cards/IStandardProjectCard';
import {IProjectCard} from '../../src/server/cards/IProjectCard';

// ---------------------------------------------------------------------------
// Fake persistence (same idea as tests/testing/setup.ts)
// ---------------------------------------------------------------------------

const FAKE_DATABASE: IDatabase = {
  markFinished: () => Promise.resolve(),
  deleteGameNbrSaves: () => Promise.resolve(),
  getPlayerCount: () => Promise.resolve(0),
  getGame: () => Promise.resolve({} as SerializedGame),
  getGameId: () => Promise.resolve('g'),
  getGameVersion: () => Promise.resolve({} as SerializedGame),
  getGameIds: () => Promise.resolve([]),
  getSaveIds: () => Promise.resolve([]),
  initialize: () => Promise.resolve(),
  saveGameResults: () => {},
  saveGame: () => Promise.resolve(),
  purgeUnfinishedGames: () => Promise.resolve([]),
  compressCompletedGames: () => Promise.resolve(),
  stats: () => Promise.resolve({}),
  storeParticipants: () => Promise.resolve(),
  createSession: () => Promise.resolve(),
  deleteSession: () => Promise.resolve(),
  getSessions: () => Promise.resolve([]),
};

Database.getInstance = () => FAKE_DATABASE;
GameLoader.getInstance = () => ({
  add: async () => {},
  getGame: async () => undefined,
  getIds: async () => [],
  restoreGameAt: async () => {
    throw new Error('restoreGameAt not supported in validation harness');
  },
  mark: () => {},
  saveGame: async () => {},
  completeGame: async () => {},
  maintenance: async () => {},
} as unknown as IGameLoader);
globalInitialize();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActorMode = 'random' | 'weighted';

const CONSORTIUM_PROJECT_CARDS: ReadonlyArray<CardName> = Object.keys(
  CONSORTIUM_CARD_MANIFEST.projectCards,
) as Array<CardName>;

type CrashRecord = {
  config: string;
  mode: ActorMode;
  seed: number;
  generation: number;
  phase: string;
  action: string;
  error: string;
};

type InvariantFailure = {
  config: string;
  mode: ActorMode;
  seed: number;
  generation: number;
  phase: string;
  invariant: string;
  detail: string;
};

type GameResult = {
  config: string;
  mode: ActorMode;
  seed: number;
  generations: number;
  crashed: boolean;
  crash?: CrashRecord;
  invariantFailures: Array<InvariantFailure>;
};

type ConfigSpec = {
  name: string;
  options: {
    consortiumExpansion: boolean;
    corporateEra: boolean;
    preludeExtension: boolean;
    coloniesExtension: boolean;
    turmoilExtension: boolean;
    boardName: BoardName;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleOf(input: PlayerInput): string {
  const t = input.title;
  if (typeof t === 'string') return t;
  return (t as Message).message ?? input.type;
}

function pick<T>(rng: SeededRandom, items: ReadonlyArray<T>): T {
  return items[rng.nextInt(items.length)];
}

function shuffleIndices(rng: SeededRandom, n: number): Array<number> {
  const idxs = Array.from({length: n}, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs;
}

function sampleIndices(rng: SeededRandom, n: number, min: number, max: number): Array<number> {
  const count = Math.min(n, Math.max(min, min + (max > min ? rng.nextInt(max - min + 1) : 0)));
  return shuffleIndices(rng, n).slice(0, count).sort((a, b) => a - b);
}

function paymentForCost(
  player: IPlayer,
  cost: number,
  opts: {
    steel?: boolean;
    titanium?: boolean;
    heat?: boolean;
    iridium?: boolean;
    minIridium?: number;
    steelRate?: number;
  } = {},
): Payment | undefined {
  const steelRate = opts.steelRate ?? 2;
  const titaniumRate = player.getTitaniumValue();
  const iridiumRate = player.iridiumValue;
  let remaining = Math.max(0, cost);
  let iridium = 0;
  let steel = 0;
  let titanium = 0;
  let heat = 0;

  const minIr = opts.minIridium ?? 0;
  if (minIr > 0) {
    if (player.iridium < minIr) return undefined;
    iridium = minIr;
    remaining = Math.max(0, remaining - iridium * iridiumRate);
  }

  if (player.megaCredits >= remaining) {
    return Payment.of({megacredits: remaining, iridium});
  }

  if (opts.iridium && player.iridium > iridium && remaining > 0) {
    const extra = Math.min(player.iridium - iridium, Math.ceil(remaining / iridiumRate));
    iridium += extra;
    remaining = Math.max(0, remaining - extra * iridiumRate);
  }
  if (opts.steel && player.steel > 0 && remaining > 0) {
    steel = Math.min(player.steel, Math.ceil(remaining / steelRate));
    remaining = Math.max(0, remaining - steel * steelRate);
  }
  if (opts.titanium && player.titanium > 0 && remaining > 0) {
    titanium = Math.min(player.titanium, Math.ceil(remaining / titaniumRate));
    remaining = Math.max(0, remaining - titanium * titaniumRate);
  }
  if (opts.heat && player.heat > 0 && remaining > 0 && player.canUseHeatAsMegaCredits) {
    heat = Math.min(player.heat, remaining);
    remaining = Math.max(0, remaining - heat);
  }
  if (player.megaCredits < remaining) return undefined;
  return Payment.of({megacredits: remaining, steel, titanium, heat, iridium});
}

function expectedSegmentCount(kind: MegastructureKind): number {
  return kind === 'bridge' ?
    MEGASTRUCTURE_BALANCE.BRIDGE_SEGMENT_COUNT :
    MEGASTRUCTURE_BALANCE.GRAND_SEGMENT_COUNT;
}

function keystoneMinIridium(kind: MegastructureKind): number {
  return kind === 'bridge' ?
    MEGASTRUCTURE_BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM :
    MEGASTRUCTURE_BALANCE.GRAND_KEYSTONE_MIN_IRIDIUM;
}

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

class InvariantError extends Error {
  constructor(readonly invariant: string, detail: string) {
    super(`${invariant}: ${detail}`);
    this.name = 'InvariantError';
  }
}

function assertInvariants(game: Game): void {
  const bank = game.iridiumBank;
  if (bank < 0 || bank > IRIDIUM_BANK_CAPACITY) {
    throw new InvariantError(
      'iridium-bank-bounds',
      `iridiumBank=${bank} outside [0, ${IRIDIUM_BANK_CAPACITY}]`,
    );
  }

  for (const structure of game.megastructuresData?.structures ?? []) {
    const expected = expectedSegmentCount(structure.kind);
    if (structure.segments.length !== expected) {
      throw new InvariantError(
        'megastructure-segment-count',
        `${structure.id} has ${structure.segments.length} slots, expected ${expected}`,
      );
    }
    const filled = structure.segments.filter((s) => s.owner !== undefined).length;
    if (filled > expected) {
      throw new InvariantError(
        'megastructure-segment-count',
        `${structure.id} has ${filled} filled segments > ${expected}`,
      );
    }
    // No gaps: once a later segment is owned, earlier ones must be owned.
    let sawEmpty = false;
    for (let i = 0; i < structure.segments.length; i++) {
      const owned = structure.segments[i].owner !== undefined;
      if (!owned) sawEmpty = true;
      else if (sawEmpty) {
        throw new InvariantError(
          'megastructure-segment-count',
          `${structure.id} has owned segment ${i} after an empty earlier slot`,
        );
      }
    }
    if (structure.completed && filled !== expected) {
      throw new InvariantError(
        'megastructure-segment-count',
        `${structure.id} completed with ${filled}/${expected} segments`,
      );
    }
  }

  for (const space of game.board.spaces) {
    if (space.spaceType === SpaceType.CHASM && space.tile !== undefined) {
      throw new InvariantError(
        'no-tile-on-unconverted-chasm',
        `tile on chasm space ${space.id}`,
      );
    }
    if (space.locked === true && space.tile !== undefined) {
      throw new InvariantError(
        'no-tile-on-locked-frontier',
        `tile on locked frontier space ${space.id}`,
      );
    }
  }
}

/** Strip volatile fields so serialize → deserialize → serialize is comparable. */
function normalizeSerialized(raw: SerializedGame): unknown {
  const copy = JSON.parse(JSON.stringify(raw)) as SerializedGame & {
    players: Array<SerializedGame['players'][number] & {timer?: {startedAt?: number}}>;
  };
  for (const p of copy.players) {
    if (p.timer !== undefined) {
      p.timer.startedAt = 0;
    }
  }
  return copy;
}

function assertSerializeRoundTrip(game: Game): void {
  const first = game.serialize();
  const restored = Game.deserialize(first);
  const second = restored.serialize();
  const a = JSON.stringify(normalizeSerialized(first));
  const b = JSON.stringify(normalizeSerialized(second));
  if (a !== b) {
    throw new InvariantError(
      'serialization-round-trip',
      'deserialize(serialize(game)).serialize() lost or altered state',
    );
  }
  // Re-check board/consortium invariants on the restored game too.
  assertInvariants(restored);
}

function installKeystoneGuard(): () => void {
  const orig = Megastructures.placeSegment.bind(Megastructures);
  Megastructures.placeSegment = ((player, structure, payment, alreadyPaid = false) => {
    const index = Megastructures.nextSegmentIndex(structure);
    if (index >= 0 && Megastructures.isKeystone(structure, index)) {
      const min = keystoneMinIridium(structure.kind);
      if (payment.iridium < min) {
        throw new InvariantError(
          'keystone-min-iridium',
          `${structure.id} keystone with payment.iridium=${payment.iridium} < min ${min}`,
        );
      }
    }
    return orig(player, structure, payment, alreadyPaid);
  }) as typeof Megastructures.placeSegment;
  return () => {
    Megastructures.placeSegment = orig;
  };
}

// ---------------------------------------------------------------------------
// Response builder
// ---------------------------------------------------------------------------

function buildResponse(
  input: PlayerInput,
  player: IPlayer,
  rng: SeededRandom,
  mode: ActorMode,
): InputResponse {
  if (input instanceof SelectInitialCards) {
    return {
      type: 'initialCards',
      responses: input.options.map((o) => buildResponse(o, player, rng, mode)),
    };
  }
  if (input instanceof AndOptions) {
    return {
      type: 'and',
      responses: input.options.map((o) => buildResponse(o, player, rng, mode)),
    };
  }
  if (input instanceof OrOptions) {
    // Single-shot path; tryProcess uses orCandidates for retries.
    const idx = mode === 'random' ?
      rng.nextInt(input.options.length) :
      weightedOrIndex(input, player, rng);
    return {
      type: 'or',
      index: idx,
      response: buildResponse(input.options[idx], player, rng, mode),
    };
  }

  if (input instanceof SelectProjectCardToPlay) {
    const cards = input.cards.filter((c, i) => input.enabled?.[i] !== false) as Array<IProjectCard>;
    if (cards.length === 0) throw new Error('No project cards');
    const affordable = cards.filter((c) => {
      const cost = player.getCardCost(c);
      const opts = player.paymentOptionsForCard(c);
      return paymentForCost(player, cost, {
        steel: opts.steel, titanium: opts.titanium, heat: opts.heat, iridium: opts.iridium,
      }) !== undefined;
    });
    const pool = affordable.length > 0 ? affordable : cards;
    let card: IProjectCard;
    if (mode === 'weighted') {
      const consortium = pool.filter((c) => CONSORTIUM_PROJECT_CARDS.includes(c.name));
      card = pick(rng, consortium.length > 0 && rng.next() < 0.75 ? consortium : pool);
    } else {
      card = pick(rng, pool);
    }
    const cost = player.getCardCost(card);
    const opts = player.paymentOptionsForCard(card);
    const payment = paymentForCost(player, cost, {
      steel: opts.steel, titanium: opts.titanium, heat: opts.heat, iridium: opts.iridium,
    }) ?? Payment.of({megacredits: Math.min(cost, player.megaCredits)});
    return {type: 'projectCard', card: card.name, payment};
  }

  if (input instanceof SelectStandardProjectToPlay) {
    const cards = input.cards.filter((c, i) => {
      if (input.enabled?.[i] === false) return false;
      return (c as IStandardProjectCard).canAct?.(player) !== false;
    }) as Array<IStandardProjectCard>;
    if (cards.length === 0) throw new Error('No standard projects');
    let card: IStandardProjectCard;
    if (mode === 'weighted') {
      const scored = cards.map((c) => {
        let s = rng.next();
        if (c.name === CardName.CORE_SAMPLING_STANDARD_PROJECT) s += 5;
        if (c.name === CardName.AQUIFER_STANDARD_PROJECT) s += 4;
        if (c.name === CardName.POWER_PLANT_STANDARD_PROJECT) s += 2;
        if (c.name === CardName.SELL_PATENTS_STANDARD_PROJECT) s -= 1;
        if (c.name === CardName.CITY_STANDARD_PROJECT || c.name === CardName.GREENERY_STANDARD_PROJECT) {
          s -= player.game.generation > 10 ? 3 : 0;
        }
        return {c, s};
      }).sort((a, b) => b.s - a.s);
      card = scored[0].c;
    } else {
      card = pick(rng, cards);
    }
    const cost = card.getAdjustedCost(player);
    const canPay = card.canPayWith(player);
    const payment = paymentForCost(player, cost, {
      steel: canPay.steel === true,
      titanium: canPay.titanium === true,
      heat: player.canUseHeatAsMegaCredits,
    });
    if (payment === undefined) throw new Error(`Cannot afford standard project ${card.name}`);
    return {type: 'projectCard', card: card.name, payment};
  }

  if (input instanceof SelectCard) {
    const enabled = input.cards.filter((_, i) => input.config.enabled?.[i] !== false);
    const list = enabled.length >= input.config.min ? enabled : input.cards;
    const idxs = sampleIndices(rng, list.length, input.config.min, Math.min(input.config.max, list.length));
    return {type: 'card', cards: idxs.map((i) => list[i].name)};
  }
  if (input instanceof SelectSpace) {
    if (input.spaces.length === 0) throw new Error('SelectSpace has no spaces');
    return {type: 'space', spaceId: pick(rng, input.spaces).id};
  }
  if (input instanceof SelectOption) return {type: 'option'};
  if (input instanceof SelectPayment) {
    const payment = paymentForCost(player, input.amount, {
      steel: input.paymentOptions.steel === true,
      titanium: input.paymentOptions.titanium === true ||
        input.paymentOptions.lunaTradeFederationTitanium === true,
      heat: input.paymentOptions.heat === true || player.canUseHeatAsMegaCredits,
      iridium: input.paymentOptions.iridium === true,
      minIridium: input.minIridium,
      steelRate: input.steelRate,
    });
    if (payment === undefined) throw new Error(`Cannot afford payment of ${input.amount}`);
    return {type: 'payment', payment};
  }
  if (input instanceof SelectAmount) {
    const amount = input.maxByDefault ? input.max :
      input.min + (input.max > input.min ? rng.nextInt(input.max - input.min + 1) : 0);
    return {type: 'amount', amount};
  }
  if (input instanceof SelectColony) {
    return {type: 'colony', colonyName: pick(rng, input.colonies).name};
  }
  if (input instanceof SelectParty) {
    return {type: 'party', partyName: pick(rng, input.parties)};
  }
  if (input instanceof SelectPlayer) {
    return {type: 'player', player: pick(rng, input.players).color};
  }
  if (input instanceof SelectDelegate) {
    const p = pick(rng, input.players);
    return {type: 'delegate', player: p === 'NEUTRAL' ? 'NEUTRAL' : p.color};
  }
  if (input instanceof SelectProductionToLose) {
    const units = Units.of({});
    let left = input.unitsToLose;
    for (const key of ['megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat'] as Array<keyof Units>) {
      if (left <= 0) break;
      const available = player.production[key];
      if (available > 0) {
        const take = Math.min(available, left);
        units[key] = take;
        left -= take;
      }
    }
    if (left > 0) throw new Error('Cannot lose enough production');
    return {type: 'productionToLose', units};
  }
  if (input instanceof SelectResource) {
    return {type: 'resource', resource: pick(rng, input.include)};
  }
  if (input instanceof SelectResources) {
    const units = Units.of({});
    const keys: Array<keyof Units> = ['megacredits', 'steel', 'titanium', 'plants', 'energy', 'heat'];
    for (let i = 0; i < input.count; i++) units[pick(rng, keys)] += 1;
    return {type: 'resources', units};
  }
  if (input instanceof SelectGlobalEvent) {
    return {type: 'globalEvent', globalEventName: pick(rng, input.globalEvents).name};
  }
  if (input instanceof ShiftAresGlobalParameters) {
    return {
      type: 'aresGlobalParameters',
      response: {lowOceanDelta: 0, highOceanDelta: 0, temperatureDelta: 0, oxygenDelta: 0},
    };
  }
  if (input.type === 'option') return {type: 'option'};
  throw new Error(`Unsupported PlayerInput type=${input.type} title=${titleOf(input)}`);
}

/** Preference scores for the weighted comparison actor (not the default). */
function weightedOrIndex(input: OrOptions, player: IPlayer, rng: SeededRandom): number {
  const ranked = input.options.map((opt, index) => {
    let score = rng.next();
    const title = titleOf(opt).toLowerCase();
    if (opt instanceof SelectProjectCardToPlay) {
      score += 6;
      if (opt.cards.some((c) => CONSORTIUM_PROJECT_CARDS.includes(c.name))) score += 4;
    } else if (opt instanceof SelectStandardProjectToPlay) {
      if (opt.cards.some((c) => c.name === CardName.CORE_SAMPLING_STANDARD_PROJECT)) score += 3;
      else score += 0.5;
    } else if (title.includes('megastructure') || title.includes('contribute')) {
      score += 5;
    } else if (title.includes('pass')) {
      score -= 4;
    } else if (title.includes('sell patents')) {
      score -= 2;
    } else if (title.includes('research') || title.includes('buy')) {
      score += player.game.generation <= 6 ? 4 : 1.5;
    }
    return {index, score};
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0].index;
}

function orCandidates(
  input: OrOptions,
  player: IPlayer,
  rng: SeededRandom,
  mode: ActorMode,
): Array<InputResponse> {
  const out: Array<InputResponse> = [];
  let order: Array<number>;
  if (mode === 'random') {
    order = shuffleIndices(rng, input.options.length);
  } else {
    order = input.options.map((opt, index) => {
      let score = rng.next();
      const title = titleOf(opt).toLowerCase();
      if (opt instanceof SelectProjectCardToPlay) score += 6;
      else if (title.includes('megastructure') || title.includes('contribute')) score += 5;
      else if (title.includes('research') || title.includes('buy')) {
        score += player.game.generation <= 6 ? 4 : 1;
      } else if (opt instanceof SelectStandardProjectToPlay) score += 1;
      else if (title.includes('pass')) score -= 10;
      return {index, score};
    }).sort((a, b) => b.score - a.score).map((x) => x.index);
  }

  for (const index of order) {
    try {
      out.push({
        type: 'or',
        index,
        response: buildResponse(input.options[index], player, rng, mode),
      });
    } catch {
      // skip unbuildable option
    }
  }
  return out;
}

function tryProcess(
  player: IPlayer,
  waiting: PlayerInput,
  rng: SeededRandom,
  mode: ActorMode,
): string {
  const attempts: Array<InputResponse> = [];
  if (waiting instanceof OrOptions) {
    attempts.push(...orCandidates(waiting, player, rng, mode));
  } else {
    attempts.push(buildResponse(waiting, player, rng, mode));
    if (waiting.type === 'option') attempts.push({type: 'option'});
  }

  let lastErr: Error | undefined;
  for (const response of attempts) {
    try {
      player.process(response);
      return `${waiting.type}:${titleOf(waiting)}`;
    } catch (e) {
      if (e instanceof InvariantError) throw e;
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('No viable response');
}

// ---------------------------------------------------------------------------
// One game
// ---------------------------------------------------------------------------

function runOneGame(config: ConfigSpec, seed: number, mode: ActorMode): GameResult {
  const player = new Player('Validator', 'blue' as Color, false, 0, `p-val-${mode}-${seed}`);
  let uninstallKeystone = () => {};
  let game: Game | undefined;
  let lastAction = 'start';
  const invariantFailures: Array<InvariantFailure> = [];

  const recordInvariant = (e: InvariantError) => {
    invariantFailures.push({
      config: config.name,
      mode,
      seed,
      generation: game?.generation ?? 0,
      phase: game ? String(game.phase) : '?',
      invariant: e.invariant,
      detail: e.message,
    });
  };

  try {
    game = Game.newInstance(
      `g-val-${mode}-${seed}` as any,
      [player],
      player,
      `s-val-${mode}-${seed}` as any,
      {
        ...config.options,
        draftVariant: false,
        initialDraftVariant: false,
        undoOption: false,
        showTimers: false,
        startingCorporations: 2,
      },
      seed,
    );
    uninstallKeystone = installKeystoneGuard();
    assertInvariants(game);

    const actorRng = new SeededRandom(seed ^ (mode === 'random' ? 0xA11CE : 0xC0FFEE));
    let steps = 0;
    const MAX_STEPS = 25_000;

    while (game.phase !== Phase.END) {
      if (++steps > MAX_STEPS) {
        throw new Error(`Exceeded ${MAX_STEPS} steps (gen ${game.generation}, phase ${game.phase})`);
      }

      if (player.getWaitingFor() === undefined && game.deferredActions.length > 0) {
        game.deferredActions.runAll(() => {});
        assertInvariants(game);
        continue;
      }

      const waiting = player.getWaitingFor();
      if (waiting === undefined) {
        if (game.phase === Phase.ACTION && game.activePlayer === player) {
          player.takeAction();
          assertInvariants(game);
          continue;
        }
        throw new Error(`Stalled (gen ${game.generation}, phase ${game.phase})`);
      }

      lastAction = tryProcess(player, waiting, actorRng, mode);
      assertInvariants(game);
    }

    assertSerializeRoundTrip(game);
    assertInvariants(game);
    uninstallKeystone();
    return {
      config: config.name,
      mode,
      seed,
      generations: game.generation,
      crashed: false,
      invariantFailures,
    };
  } catch (e) {
    uninstallKeystone();
    if (e instanceof InvariantError) {
      recordInvariant(e);
      return {
        config: config.name,
        mode,
        seed,
        generations: game?.generation ?? 0,
        crashed: true,
        crash: {
          config: config.name,
          mode,
          seed,
          generation: game?.generation ?? 0,
          phase: game ? String(game.phase) : '?',
          action: lastAction,
          error: e.message,
        },
        invariantFailures,
      };
    }
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      config: config.name,
      mode,
      seed,
      generations: game?.generation ?? 0,
      crashed: true,
      crash: {
        config: config.name,
        mode,
        seed,
        generation: game?.generation ?? 0,
        phase: game ? String(game.phase) : '?',
        action: lastAction,
        error: err.message,
      },
      invariantFailures,
    };
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function writeReport(
  outPath: string,
  configs: Array<ConfigSpec>,
  modes: Array<ActorMode>,
  resultsByKey: Map<string, Array<GameResult>>,
  gamesPerConfig: number,
  seedBase: number,
): {totalCrashes: number; totalInvariantFailures: number; failingKeys: Array<string>} {
  const lines: Array<string> = [];
  const now = new Date().toISOString().slice(0, 10);
  lines.push('# Consortium — Phase 16: Full-game validation');
  lines.push('');
  lines.push('Branch: `feat/consortium-harness-honesty`');
  lines.push(`Date: ${now}`);
  lines.push('Harness: `tools/consortium/validate.ts` (TypeScript via `npx tsx`)');
  lines.push('');

  lines.push('## What this harness can and cannot tell us');
  lines.push('');
  lines.push('**This harness measures crashes and state invariants.** It drives solo');
  lines.push('games to `Phase.END` through real `player.process` calls and fails the');
  lines.push('run if an exception escapes or an invariant breaks.');
  lines.push('');
  lines.push('It **cannot** tell us whether Consortium is balanced. Ocean counts,');
  lines.push('bridge completion rates, game length, card play rates, and similar');
  lines.push('numbers reflect the actor\'s choice distribution, not the game\'s design.');
  lines.push('A preference-weighted actor that scores megastructure contribute at 5.5');
  lines.push('and standard projects at 1.5 will starve oceans and over-complete bridges;');
  lines.push('that is harness bias, not evidence about the map or the economy.');
  lines.push('Do not cite this document for balance decisions.');
  lines.push('');
  lines.push('Default actor mode is **`random`**: uniform choice over legal options at');
  lines.push('every decision point. Mode **`weighted`** keeps the old heuristic for');
  lines.push('comparison only.');
  lines.push('');

  lines.push('## Method');
  lines.push('');
  lines.push(`- Solo games to \`Phase.END\`, seed base **${seedBase}**`);
  lines.push(`- **${gamesPerConfig}** games per configuration × mode`);
  lines.push(`- Modes run: ${modes.map((m) => `\`${m}\``).join(', ')}`);
  lines.push('- Retries alternate `OrOptions` on actor payment failures before counting a crash');
  lines.push('- After every step: iridium bank bounds, megastructure segment counts,');
  lines.push('  chasm/locked tile bans');
  lines.push('- Keystone placements assert minimum iridium on the payment');
  lines.push('- End of every game: serialize → deserialize → serialize without loss');
  lines.push('');

  lines.push('## Crashes');
  lines.push('');
  lines.push('Zero crashes is the primary pass criterion.');
  lines.push('');
  lines.push('| Mode | Config | Games | Crashes | Notes |');
  lines.push('|------|--------|------:|--------:|-------|');
  let totalCrashes = 0;
  const failingKeys: Array<string> = [];
  const allCrashes: Array<CrashRecord> = [];
  for (const mode of modes) {
    for (const cfg of configs) {
      const key = `${mode}::${cfg.name}`;
      const results = resultsByKey.get(key) ?? [];
      const crashes = results.filter((r) => r.crashed);
      totalCrashes += crashes.length;
      if (crashes.length > 0) failingKeys.push(key);
      for (const c of crashes) if (c.crash) allCrashes.push(c.crash);
      lines.push(
        `| ${mode} | ${cfg.name} | ${results.length} | ${crashes.length} | ` +
        `${crashes.length === 0 ? 'ok' : crashes.slice(0, 3).map((c) => `seed ${c.seed}`).join(', ')} |`,
      );
    }
  }
  lines.push('');
  if (allCrashes.length === 0) {
    lines.push('**Zero crashes across all configurations and modes.**');
  } else {
    lines.push('### Crash details');
    lines.push('');
    lines.push('| Mode | Config | Seed | Gen | Phase | Action | Error |');
    lines.push('|------|--------|-----:|----:|-------|--------|-------|');
    for (const c of allCrashes.slice(0, 80)) {
      const err = c.error.replace(/\|/g, '\\|').slice(0, 100);
      const act = c.action.replace(/\|/g, '\\|').slice(0, 40);
      lines.push(
        `| ${c.mode} | ${c.config} | ${c.seed} | ${c.generation} | ${c.phase} | ${act} | ${err} |`,
      );
    }
    if (allCrashes.length > 80) lines.push(`\n…and ${allCrashes.length - 80} more.`);
  }
  lines.push('');

  lines.push('## Invariants');
  lines.push('');
  lines.push('These must hold regardless of how well the actor plays:');
  lines.push('');
  lines.push('1. No exceptions in any configuration or mode');
  lines.push(`2. Iridium bank stays in \`[0, ${IRIDIUM_BANK_CAPACITY}]\``);
  lines.push('3. No megastructure exceeds its segment count (or fills with gaps)');
  lines.push('4. No keystone is placed without the minimum iridium payment');
  lines.push('5. No tile is placed on a chasm that has not been converted');
  lines.push('6. No locked frontier space receives a tile before its bridge completes');
  lines.push('7. Serialization round-trips at end of game without loss');
  lines.push('');

  const allInvariantFailures: Array<InvariantFailure> = [];
  for (const results of resultsByKey.values()) {
    for (const r of results) allInvariantFailures.push(...r.invariantFailures);
  }
  const totalInvariantFailures = allInvariantFailures.length;

  lines.push('| Mode | Config | Games | Invariant failures |');
  lines.push('|------|--------|------:|-------------------:|');
  for (const mode of modes) {
    for (const cfg of configs) {
      const key = `${mode}::${cfg.name}`;
      const results = resultsByKey.get(key) ?? [];
      const fails = results.reduce((n, r) => n + r.invariantFailures.length, 0);
      if (fails > 0 && !failingKeys.includes(key)) failingKeys.push(key);
      lines.push(`| ${mode} | ${cfg.name} | ${results.length} | ${fails} |`);
    }
  }
  lines.push('');
  if (totalInvariantFailures === 0) {
    lines.push('**All invariants held in every game.**');
  } else {
    lines.push('### Invariant failure details');
    lines.push('');
    lines.push('| Mode | Config | Seed | Gen | Invariant | Detail |');
    lines.push('|------|--------|-----:|----:|-----------|--------|');
    for (const f of allInvariantFailures.slice(0, 80)) {
      const detail = f.detail.replace(/\|/g, '\\|').slice(0, 100);
      lines.push(
        `| ${f.mode} | ${f.config} | ${f.seed} | ${f.generation} | ${f.invariant} | ${detail} |`,
      );
    }
    if (allInvariantFailures.length > 80) {
      lines.push(`\n…and ${allInvariantFailures.length - 80} more.`);
    }
  }
  lines.push('');

  lines.push('## Why balance-shaped metrics are omitted');
  lines.push('');
  lines.push('Earlier drafts of this document reported ocean counts, bridge completion');
  lines.push('rates, mean generations, and card playability. Those numbers looked like');
  lines.push('balance findings; they were actor artifacts. They are intentionally not');
  lines.push('reported here. Use human playtests or a purpose-built evaluation suite');
  lines.push('if you need design signals.');
  lines.push('');

  lines.push('## Rerun');
  lines.push('');
  lines.push('```bash');
  lines.push(
    `npx tsx tools/consortium/validate.ts --games=${gamesPerConfig} ` +
    `--modes=${modes.join(',')} --seed-base=${seedBase} --out=docs/consortium/16-validation.md`,
  );
  lines.push('```');
  lines.push('');
  lines.push('Default mode when `--mode` / `--modes` is omitted: `random`.');
  lines.push('');

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, lines.join('\n'));
  return {totalCrashes, totalInvariantFailures, failingKeys};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv: Array<string>) {
  let games = 200;
  let seedBase = 42_000;
  let out = 'docs/consortium/16-validation.md';
  let modes: Array<ActorMode> = ['random'];
  for (const a of argv) {
    if (a.startsWith('--games=')) games = Number(a.slice(8));
    else if (a.startsWith('--seed-base=')) seedBase = Number(a.slice(12));
    else if (a.startsWith('--out=')) out = a.slice(6);
    else if (a.startsWith('--mode=')) {
      const m = a.slice(7);
      if (m !== 'random' && m !== 'weighted') {
        throw new Error(`Unknown mode ${m}; expected random|weighted`);
      }
      modes = [m];
    } else if (a.startsWith('--modes=')) {
      modes = a.slice(8).split(',').map((s) => s.trim()).filter(Boolean).map((m) => {
        if (m !== 'random' && m !== 'weighted') {
          throw new Error(`Unknown mode ${m}; expected random|weighted`);
        }
        return m;
      });
    } else if (a === '--quick') games = 5;
  }
  return {games, seedBase, out, modes};
}

function configs(): Array<ConfigSpec> {
  return [
    {
      name: 'baseline-no-consortium',
      options: {
        consortiumExpansion: false, corporateEra: false, preludeExtension: false,
        coloniesExtension: false, turmoilExtension: false, boardName: BoardName.THARSIS,
      },
    },
    {
      name: 'consortium',
      options: {
        consortiumExpansion: true, corporateEra: false, preludeExtension: false,
        coloniesExtension: false, turmoilExtension: false, boardName: BoardName.CONSORTIUM,
      },
    },
    {
      name: 'consortium+corporate-era',
      options: {
        consortiumExpansion: true, corporateEra: true, preludeExtension: false,
        coloniesExtension: false, turmoilExtension: false, boardName: BoardName.CONSORTIUM,
      },
    },
    {
      name: 'consortium+prelude',
      options: {
        consortiumExpansion: true, corporateEra: false, preludeExtension: true,
        coloniesExtension: false, turmoilExtension: false, boardName: BoardName.CONSORTIUM,
      },
    },
    {
      name: 'consortium+colonies',
      options: {
        consortiumExpansion: true, corporateEra: false, preludeExtension: false,
        coloniesExtension: true, turmoilExtension: false, boardName: BoardName.CONSORTIUM,
      },
    },
    {
      name: 'consortium+turmoil',
      options: {
        consortiumExpansion: true, corporateEra: false, preludeExtension: false,
        coloniesExtension: false, turmoilExtension: true, boardName: BoardName.CONSORTIUM,
      },
    },
  ];
}

async function main() {
  const {games, seedBase, out, modes} = parseArgs(process.argv.slice(2));
  const cfgs = configs();
  const resultsByKey = new Map<string, Array<GameResult>>();
  let seed = seedBase;

  for (const mode of modes) {
    for (const cfg of cfgs) {
      const key = `${mode}::${cfg.name}`;
      console.log(`\n=== [${mode}] ${cfg.name} (${games} games) ===`);
      const results: Array<GameResult> = [];
      for (let i = 0; i < games; i++) {
        const s = seed++;
        const result = runOneGame(cfg, s, mode);
        results.push(result);
        if (result.crashed) {
          console.log(
            `  FAIL seed=${s} gen=${result.crash?.generation}: ` +
            `${result.crash?.error.slice(0, 120)}`,
          );
        } else if ((i + 1) % 25 === 0 || i === 0) {
          console.log(`  ${i + 1}/${games} ok gen=${result.generations}`);
        }
      }
      resultsByKey.set(key, results);
      const crashes = results.filter((r) => r.crashed).length;
      const inv = results.reduce((n, r) => n + r.invariantFailures.length, 0);
      console.log(`  done: ${games - crashes}/${games} completed, ${crashes} crashes, ${inv} invariant failures`);
    }
  }

  const {totalCrashes, totalInvariantFailures, failingKeys} =
    writeReport(out, cfgs, modes, resultsByKey, games, seedBase);
  console.log(`\nWrote ${out}`);
  console.log(`Total crashes: ${totalCrashes}`);
  console.log(`Total invariant failures: ${totalInvariantFailures}`);
  if (failingKeys.length || totalCrashes > 0 || totalInvariantFailures > 0) {
    console.log(`Failing: ${failingKeys.join(', ') || '(see totals)'}`);
    process.exitCode = 1;
  } else {
    console.log('All configurations and modes: zero crashes, all invariants held.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
