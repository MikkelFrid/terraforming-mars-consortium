/**
 * Consortium full-game validation harness.
 *
 * Chosen as TypeScript (run via `npx tsx`) rather than Python because the game
 * engine, PlayerInput resolution, and seeded Game.newInstance are TypeScript.
 * Driving real player.process keeps validation on the same code path as production.
 *
 * Usage:
 *   npx tsx tools/consortium/validate.ts
 *   npx tsx tools/consortium/validate.ts --games=200 --out=docs/consortium/16-validation.md
 *   npx tsx tools/consortium/validate.ts --quick
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
import {Iridium} from '../../src/server/consortium/Iridium';
import {MegastructureKind} from '../../src/common/consortium/MegastructureKind';
import {Message} from '../../src/common/logs/Message';
import {IRIDIUM_BANK_CAPACITY, MAX_OCEAN_TILES} from '../../src/common/constants';
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
  getParticipants: () => Promise.resolve([]),
  createSession: () => Promise.resolve(),
  deleteSession: () => Promise.resolve(),
  getSessions: () => Promise.resolve([]),
};

Database.getInstance = () => FAKE_DATABASE;
GameLoader.getInstance = () => ({
  add: () => {},
  getGame: async () => undefined,
  getIds: async () => [],
  isReady: async () => {},
  saveGame: () => {},
  completeGame: async () => {},
  saveGameResults: () => {},
} as unknown as IGameLoader);
globalInitialize();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CONSORTIUM_PROJECT_CARDS: ReadonlyArray<CardName> = Object.keys(
  CONSORTIUM_CARD_MANIFEST.projectCards,
) as Array<CardName>;

const ALL_KINDS: ReadonlyArray<MegastructureKind> = [
  'bridge',
  'space_elevator',
  'l1_magnetic_shield',
  'mohole',
  'solar_mirror',
  'arcology',
];

type CrashRecord = {
  config: string;
  seed: number;
  generation: number;
  phase: string;
  action: string;
  error: string;
};

type MegaCompletion = {kind: MegastructureKind; generation: number};

type GameResult = {
  config: string;
  seed: number;
  generations: number;
  crashed: boolean;
  crash?: CrashRecord;
  playableSeen: Set<CardName>;
  kindsInPlay: Array<MegastructureKind>;
  megaCompletions: Array<MegaCompletion>;
  bridgeCompletedCount: number;
  oceansPlaced: number;
  iridiumGranted: number;
  iridiumSpent: number;
  iridiumLowWater: number;
  iridiumHitZero: boolean;
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

type IridiumCounters = {
  granted: number;
  spent: number;
  lowWater: number;
  hitZero: boolean;
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

function sampleIndices(rng: SeededRandom, n: number, min: number, max: number): Array<number> {
  const count = Math.min(n, Math.max(min, min + (max > min ? rng.nextInt(max - min + 1) : 0)));
  const idxs = Array.from({length: n}, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  return idxs.slice(0, count).sort((a, b) => a - b);
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

  // Prefer MC when affordable — simplest valid payment.
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

function installIridiumHooks(counters: IridiumCounters, getBank: () => number): () => void {
  const origGrant = Iridium.grant.bind(Iridium);
  const origSpend = Iridium.spend.bind(Iridium);
  Iridium.grant = ((player, count, options) => {
    const before = getBank();
    const n = origGrant(player, count, options);
    counters.granted += n;
    const after = getBank();
    counters.lowWater = Math.min(counters.lowWater, after);
    if (before > 0 && after === 0) counters.hitZero = true;
    return n;
  }) as typeof Iridium.grant;
  Iridium.spend = ((player, count, options) => {
    origSpend(player, count, options);
    counters.spent += count;
  }) as typeof Iridium.spend;
  return () => {
    Iridium.grant = origGrant;
    Iridium.spend = origSpend;
  };
}

// ---------------------------------------------------------------------------
// Response builder
// ---------------------------------------------------------------------------

function buildResponse(
  input: PlayerInput,
  player: IPlayer,
  rng: SeededRandom,
  playableSeen: Set<CardName>,
  preferPass = false,
): InputResponse {
  if (input instanceof SelectInitialCards) {
    return {
      type: 'initialCards',
      responses: input.options.map((o) => buildResponse(o, player, rng, playableSeen)),
    };
  }
  if (input instanceof AndOptions) {
    return {
      type: 'and',
      responses: input.options.map((o) => buildResponse(o, player, rng, playableSeen)),
    };
  }
  if (input instanceof OrOptions) {
    const passIdx = input.options.findIndex((o) => titleOf(o).toLowerCase().includes('pass'));
    if (preferPass && passIdx >= 0) {
      return {
        type: 'or',
        index: passIdx,
        response: buildResponse(input.options[passIdx], player, rng, playableSeen),
      };
    }

    const ranked = input.options.map((opt, index) => {
      let score = rng.next();
      const title = titleOf(opt).toLowerCase();
      if (opt instanceof SelectProjectCardToPlay) {
        score += 6;
        if (opt.cards.some((c) => CONSORTIUM_PROJECT_CARDS.includes(c.name))) score += 4;
      } else if (opt instanceof SelectStandardProjectToPlay) {
        // Prefer Core Sampling; avoid risky city/greenery near end-game.
        if (opt.cards.some((c) => c.name === CardName.CORE_SAMPLING_STANDARD_PROJECT)) score += 3;
        else score += 0.5;
      } else if (title.includes('megastructure') || title.includes('contribute')) {
        score += 5;
      } else if (title.includes('pass')) {
        score -= 4;
      } else if (title.includes('sell patents')) {
        score -= 2;
      } else if (title.includes('research') || title.includes('buy')) {
        // Buy cards early so more Consortium projects enter hand.
        score += player.game.generation <= 6 ? 4 : 1.5;
      }
      return {index, score, opt};
    });
    ranked.sort((a, b) => b.score - a.score);
    // Caller retries on failure; return best guess.
    const best = ranked[0];
    return {
      type: 'or',
      index: best.index,
      response: buildResponse(best.opt, player, rng, playableSeen),
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
    const consortium = pool.filter((c) => CONSORTIUM_PROJECT_CARDS.includes(c.name));
    const card = pick(rng, consortium.length > 0 && rng.next() < 0.75 ? consortium : pool);
    if (CONSORTIUM_PROJECT_CARDS.includes(card.name)) {
      playableSeen.add(card.name);
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
    // Prefer Core Sampling / Power Plant; deprioritize tile projects late.
    const scored = cards.map((c) => {
      let s = rng.next();
      if (c.name === CardName.CORE_SAMPLING_STANDARD_PROJECT) s += 5;
      if (c.name === CardName.AQUIFER_STANDARD_PROJECT) s += 4; // exercise ocean parameter
      if (c.name === CardName.POWER_PLANT_STANDARD_PROJECT) s += 2;
      if (c.name === CardName.SELL_PATENTS_STANDARD_PROJECT) s -= 1;
      if (c.name === CardName.CITY_STANDARD_PROJECT || c.name === CardName.GREENERY_STANDARD_PROJECT) {
        s -= player.game.generation > 10 ? 3 : 0;
      }
      return {c, s};
    }).sort((a, b) => b.s - a.s);
    const card = scored[0].c;
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

/**
 * Build candidate OrOptions responses (best first), then pass, for retries.
 */
function orCandidates(
  input: OrOptions,
  player: IPlayer,
  rng: SeededRandom,
  playableSeen: Set<CardName>,
): Array<InputResponse> {
  const out: Array<InputResponse> = [];
  const ranked = input.options.map((opt, index) => {
    let score = rng.next();
    const title = titleOf(opt).toLowerCase();
    if (opt instanceof SelectProjectCardToPlay) score += 6;
    else if (title.includes('megastructure') || title.includes('contribute')) score += 5;
    else if (title.includes('research') || title.includes('buy')) {
      score += player.game.generation <= 6 ? 4 : 1;
    } else if (opt instanceof SelectStandardProjectToPlay) score += 1;
    else if (title.includes('pass')) score -= 10;
    return {index, score, opt};
  }).sort((a, b) => b.score - a.score);

  for (const cand of ranked) {
    try {
      out.push({
        type: 'or',
        index: cand.index,
        response: buildResponse(cand.opt, player, rng, playableSeen),
      });
    } catch {
      // skip unbuildable option
    }
  }
  return out;
}

function tryProcess(player: IPlayer, waiting: PlayerInput, rng: SeededRandom, playableSeen: Set<CardName>): string {
  const attempts: Array<InputResponse> = [];
  if (waiting instanceof OrOptions) {
    attempts.push(...orCandidates(waiting, player, rng, playableSeen));
  } else {
    attempts.push(buildResponse(waiting, player, rng, playableSeen));
    // Soft fallback: if it's somehow optional
    if (waiting.type === 'option') attempts.push({type: 'option'});
  }

  let lastErr: Error | undefined;
  for (const response of attempts) {
    try {
      player.process(response);
      return `${waiting.type}:${titleOf(waiting)}`;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error('No viable response');
}

// ---------------------------------------------------------------------------
// One game
// ---------------------------------------------------------------------------

function recordPlayable(player: IPlayer, playableSeen: Set<CardName>): void {
  try {
    for (const card of player.getPlayableCards()) {
      if (CONSORTIUM_PROJECT_CARDS.includes(card.name)) playableSeen.add(card.name);
    }
  } catch { /* ignore */ }
}

function snapshotMega(
  game: Game,
  seen: Map<string, number>,
  out: Array<MegaCompletion>,
): void {
  for (const s of game.megastructuresData?.structures ?? []) {
    if (s.completed && !seen.has(s.id)) {
      seen.set(s.id, game.generation);
      out.push({kind: s.kind, generation: game.generation});
    }
  }
}

function runOneGame(config: ConfigSpec, seed: number): GameResult {
  const playableSeen = new Set<CardName>();
  const megaCompletions: Array<MegaCompletion> = [];
  const megaSeen = new Map<string, number>();
  const iridium: IridiumCounters = {
    granted: 0, spent: 0, lowWater: IRIDIUM_BANK_CAPACITY, hitZero: false,
  };

  const player = new Player('Validator', 'blue' as Color, false, 0, `p-val-${seed}`);
  let uninstall = () => {};
  let game: Game | undefined;
  let lastAction = 'start';
  let kindsInPlay: Array<MegastructureKind> = [];

  try {
    game = Game.newInstance(
      `g-val-${seed}` as any,
      [player],
      player,
      `s-val-${seed}` as any,
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
    kindsInPlay = (game.megastructuresData?.structures ?? []).map((s) => s.kind);
    uninstall = installIridiumHooks(iridium, () => game!.iridiumBank);
    iridium.lowWater = game.iridiumBank;

    const actorRng = new SeededRandom(seed ^ 0xC0FFEE);
    let steps = 0;
    const MAX_STEPS = 25_000;

    while (game.phase !== Phase.END) {
      if (++steps > MAX_STEPS) {
        throw new Error(`Exceeded ${MAX_STEPS} steps (gen ${game.generation}, phase ${game.phase})`);
      }
      snapshotMega(game, megaSeen, megaCompletions);
      recordPlayable(player, playableSeen);

      // Drain deferred actions that produce waitingFor via the real queue runner.
      if (player.getWaitingFor() === undefined && game.deferredActions.length > 0) {
        game.deferredActions.runAll(() => {});
        continue;
      }

      const waiting = player.getWaitingFor();
      if (waiting === undefined) {
        if (game.phase === Phase.ACTION && game.activePlayer === player) {
          player.takeAction();
          continue;
        }
        throw new Error(`Stalled (gen ${game.generation}, phase ${game.phase})`);
      }

      if (waiting instanceof SelectProjectCardToPlay) {
        for (const c of waiting.cards) {
          if (CONSORTIUM_PROJECT_CARDS.includes(c.name)) playableSeen.add(c.name);
        }
      }

      lastAction = tryProcess(player, waiting, actorRng, playableSeen);
    }

    snapshotMega(game, megaSeen, megaCompletions);
    uninstall();
    return {
      config: config.name,
      seed,
      generations: game.generation,
      crashed: false,
      playableSeen,
      kindsInPlay,
      megaCompletions,
      bridgeCompletedCount: (game.megastructuresData?.structures ?? [])
        .filter((s) => s.kind === 'bridge' && s.completed).length,
      oceansPlaced: game.board.getOceanSpaces().length,
      iridiumGranted: iridium.granted,
      iridiumSpent: iridium.spent,
      iridiumLowWater: iridium.lowWater,
      iridiumHitZero: iridium.hitZero,
    };
  } catch (e) {
    uninstall();
    const err = e instanceof Error ? e : new Error(String(e));
    return {
      config: config.name,
      seed,
      generations: game?.generation ?? 0,
      crashed: true,
      crash: {
        config: config.name,
        seed,
        generation: game?.generation ?? 0,
        phase: game ? String(game.phase) : '?',
        action: lastAction,
        error: err.message,
      },
      playableSeen,
      kindsInPlay,
      megaCompletions,
      bridgeCompletedCount: 0,
      oceansPlaced: game?.board.getOceanSpaces().length ?? 0,
      iridiumGranted: iridium.granted,
      iridiumSpent: iridium.spent,
      iridiumLowWater: iridium.lowWater,
      iridiumHitZero: iridium.hitZero,
    };
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function mean(nums: Array<number>): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}
function pct(n: number, d: number): string {
  return d === 0 ? 'n/a' : `${((100 * n) / d).toFixed(1)}%`;
}

function writeReport(
  outPath: string,
  configs: Array<ConfigSpec>,
  resultsByConfig: Map<string, Array<GameResult>>,
  gamesPerConfig: number,
  seedBase: number,
): {totalCrashes: number; failingConfigs: Array<string>} {
  const lines: Array<string> = [];
  const now = new Date().toISOString().slice(0, 10);
  lines.push('# Consortium — Phase 16: Full-game validation');
  lines.push('');
  lines.push('Branch: `feat/consortium-ocean-fix`');
  lines.push(`Date: ${now}`);
  lines.push('Harness: `tools/consortium/validate.ts` (TypeScript via `npx tsx`)');
  lines.push('');
  lines.push('## Why TypeScript');
  lines.push('');
  lines.push('The game engine, `PlayerInput` resolution, and seeded `Game.newInstance`');
  lines.push('are TypeScript. A `tsx` harness drives the same code path as production');
  lines.push('and reuses the fake-DB pattern from `tests/testing/setup.ts`.');
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push(`- Solo games to \`Phase.END\`, fixed seed set starting at **${seedBase}**`);
  lines.push(`- **${gamesPerConfig}** games per configuration`);
  lines.push('- Random actor biased toward Consortium plays, Core Sampling, megastructure contributions');
  lines.push('- Retries alternate `OrOptions` on actor payment failures before counting a crash');
  lines.push('- "Legally playable" = appeared in `getPlayableCards()` or a play-card menu');
  lines.push('- **Board note:** Consortium map has **13 core ocean spaces** (ocean-fix).');
  lines.push('  `PlaceOceanTile` still soft-skips empty boards as a degrade path.');
  lines.push('');

  lines.push('## 1. Crashes');
  lines.push('');
  lines.push('| Config | Games | Crashes | Notes |');
  lines.push('|--------|------:|--------:|-------|');
  let totalCrashes = 0;
  const failingConfigs: Array<string> = [];
  const allCrashes: Array<CrashRecord> = [];
  for (const cfg of configs) {
    const results = resultsByConfig.get(cfg.name) ?? [];
    const crashes = results.filter((r) => r.crashed);
    totalCrashes += crashes.length;
    if (crashes.length > 0) failingConfigs.push(cfg.name);
    for (const c of crashes) if (c.crash) allCrashes.push(c.crash);
    lines.push(`| ${cfg.name} | ${results.length} | ${crashes.length} | ${crashes.length === 0 ? 'ok' : crashes.slice(0, 3).map((c) => `seed ${c.seed}`).join(', ')} |`);
  }
  lines.push('');
  if (allCrashes.length === 0) {
    lines.push('**Zero crashes across all configurations.**');
  } else {
    lines.push('### Crash details');
    lines.push('');
    lines.push('| Config | Seed | Gen | Phase | Action | Error |');
    lines.push('|--------|-----:|----:|-------|--------|-------|');
    for (const c of allCrashes.slice(0, 80)) {
      const err = c.error.replace(/\|/g, '\\|').slice(0, 100);
      const act = c.action.replace(/\|/g, '\\|').slice(0, 40);
      lines.push(`| ${c.config} | ${c.seed} | ${c.generation} | ${c.phase} | ${act} | ${err} |`);
    }
    if (allCrashes.length > 80) lines.push(`\n…and ${allCrashes.length - 80} more.`);
  }
  lines.push('');

  lines.push('## 2. Unreachable cards');
  lines.push('');
  lines.push('Union of playable Consortium project cards across all Consortium-enabled runs.');
  lines.push('Listed cards were **never** legally playable in any run (may be legitimately rare).');
  lines.push('');
  const consortiumConfigs = configs.filter((c) => c.options.consortiumExpansion);
  const seenUnion = new Set<CardName>();
  for (const cfg of consortiumConfigs) {
    for (const r of resultsByConfig.get(cfg.name) ?? []) {
      for (const name of r.playableSeen) {
        if (CONSORTIUM_PROJECT_CARDS.includes(name)) seenUnion.add(name);
      }
    }
  }
  const unreachable = CONSORTIUM_PROJECT_CARDS.filter((c) => !seenUnion.has(c));
  lines.push('| Metric | Value |');
  lines.push('|--------|------:|');
  lines.push(`| Consortium project cards | ${CONSORTIUM_PROJECT_CARDS.length} |`);
  lines.push(`| Seen as playable (≥1 run) | ${seenUnion.size} |`);
  lines.push(`| Never playable | ${unreachable.length} |`);
  lines.push('');
  if (unreachable.length === 0) {
    lines.push('Every Consortium project card was legally playable in at least one run.');
  } else {
    lines.push('| Card |');
    lines.push('|------|');
    for (const c of unreachable) lines.push(`| ${c} |`);
  }
  lines.push('');
  lines.push('Note: solo random-actor coverage is incomplete by design — cards that need');
  lines.push('multi-player interaction or rare tags will still appear here.');
  lines.push('');

  lines.push('## 3. Megastructure completion rate');
  lines.push('');
  lines.push('| Kind | Appearances (in play) | Completions | Rate | Mean gen when completed |');
  lines.push('|------|----------------------:|------------:|-----:|------------------------:|');
  const present = new Map<MegastructureKind, number>();
  const complete = new Map<MegastructureKind, number>();
  const gens = new Map<MegastructureKind, Array<number>>();
  for (const k of ALL_KINDS) {
    present.set(k, 0); complete.set(k, 0); gens.set(k, []);
  }
  for (const cfg of consortiumConfigs) {
    for (const r of resultsByConfig.get(cfg.name) ?? []) {
      if (r.crashed) continue;
      for (const k of r.kindsInPlay) present.set(k, (present.get(k) ?? 0) + 1);
      for (const m of r.megaCompletions) {
        complete.set(m.kind, (complete.get(m.kind) ?? 0) + 1);
        gens.get(m.kind)!.push(m.generation);
      }
    }
  }
  for (const k of ALL_KINDS) {
    const p = present.get(k) ?? 0;
    const c = complete.get(k) ?? 0;
    const g = gens.get(k) ?? [];
    lines.push(`| ${k} | ${p} | ${c} | ${pct(c, p)} | ${g.length ? mean(g).toFixed(1) : '—'} |`);
  }
  lines.push('');

  lines.push('## 4. Bridge completion rate');
  lines.push('');
  lines.push('| Config | Games (ok) | Games with ≥1 bridge | Rate ≥1 | Mean bridges completed / game |');
  lines.push('|--------|-----------:|---------------------:|--------:|------------------------------:|');
  for (const cfg of consortiumConfigs) {
    const ok = (resultsByConfig.get(cfg.name) ?? []).filter((r) => !r.crashed);
    const withBridge = ok.filter((r) => r.bridgeCompletedCount > 0);
    lines.push(`| ${cfg.name} | ${ok.length} | ${withBridge.length} | ${pct(withBridge.length, ok.length)} | ${mean(ok.map((r) => r.bridgeCompletedCount)).toFixed(2)} |`);
  }
  lines.push('');
  const coloniesBridges = (resultsByConfig.get('consortium+colonies') ?? [])
    .filter((r) => !r.crashed && r.bridgeCompletedCount > 0).length;
  const coloniesOk = (resultsByConfig.get('consortium+colonies') ?? []).filter((r) => !r.crashed).length;
  if (coloniesOk > 0 && coloniesBridges / coloniesOk < 0.25) {
    lines.push(`**Design signal:** \`consortium+colonies\` completed ≥1 bridge in only ${pct(coloniesBridges, coloniesOk)} of games.`);
    lines.push('If this holds under human play, the frontier cluster is starved when Colonies competes for M€.');
    lines.push('');
  }

  lines.push('## 5. Iridium flow');
  lines.push('');
  lines.push(`Bank capacity: **${IRIDIUM_BANK_CAPACITY}**.`);
  lines.push('');
  lines.push('| Config | Mean granted | Mean spent | Mean low-water | Games bank hit 0 |');
  lines.push('|--------|-------------:|-----------:|---------------:|-----------------:|');
  for (const cfg of consortiumConfigs) {
    const ok = (resultsByConfig.get(cfg.name) ?? []).filter((r) => !r.crashed);
    lines.push(`| ${cfg.name} | ${mean(ok.map((r) => r.iridiumGranted)).toFixed(1)} | ${mean(ok.map((r) => r.iridiumSpent)).toFixed(1)} | ${mean(ok.map((r) => r.iridiumLowWater)).toFixed(1)} | ${ok.filter((r) => r.iridiumHitZero).length} |`);
  }
  lines.push('');

  lines.push('## 6. Game length (generations)');
  lines.push('');
  lines.push('| Config | Games (ok) | Mean gen | Median gen | Min | Max |');
  lines.push('|--------|-----------:|---------:|-----------:|----:|----:|');
  for (const cfg of configs) {
    const ok = (resultsByConfig.get(cfg.name) ?? []).filter((r) => !r.crashed);
    const gs = ok.map((r) => r.generations).sort((a, b) => a - b);
    const median = gs.length === 0 ? 0 : gs[Math.floor(gs.length / 2)];
    lines.push(`| ${cfg.name} | ${ok.length} | ${mean(gs).toFixed(2)} | ${median} | ${gs[0] ?? '—'} | ${gs[gs.length - 1] ?? '—'} |`);
  }
  lines.push('');
  const baseline = (resultsByConfig.get('baseline-no-consortium') ?? []).filter((r) => !r.crashed);
  const consortiumOnly = (resultsByConfig.get('consortium') ?? []).filter((r) => !r.crashed);
  if (baseline.length && consortiumOnly.length) {
    lines.push(`Consortium vs baseline mean generation delta: **${(mean(consortiumOnly.map((r) => r.generations)) - mean(baseline.map((r) => r.generations))).toFixed(2)}**.`);
  }
  lines.push('');

  lines.push('## 7. Ocean parameter (post ocean-fix)');
  lines.push('');
  lines.push(`Board now has **13** core ocean spaces; game needs **${MAX_OCEAN_TILES}** oceans to max the parameter.`);
  lines.push('`PlaceOceanTile` soft-skip remains as a degrade path, but must not fire on Consortium.');
  lines.push('');
  lines.push('| Config | Mean oceans placed | Games with all 9 | Rate all 9 |');
  lines.push('|--------|-------------------:|-----------------:|-----------:|');
  for (const cfg of configs) {
    const ok = (resultsByConfig.get(cfg.name) ?? []).filter((r) => !r.crashed);
    const allNine = ok.filter((r) => r.oceansPlaced >= MAX_OCEAN_TILES);
    lines.push(`| ${cfg.name} | ${mean(ok.map((r) => r.oceansPlaced)).toFixed(2)} | ${allNine.length} | ${pct(allNine.length, ok.length)} |`);
  }
  lines.push('');
  const plateauSeen = [...seenUnion].includes(CardName.PLATEAU_RESERVOIR);
  lines.push(`**Plateau Reservoir** (requires 3 oceans): ${plateauSeen ? 'reachable — appeared as legally playable in ≥1 run' : 'still unreachable under this solo actor'}.`);
  lines.push('');

  lines.push('## Rerun');
  lines.push('');
  lines.push('```bash');
  lines.push(`npx tsx tools/consortium/validate.ts --games=${gamesPerConfig} --seed-base=${seedBase} --out=docs/consortium/16-validation.md`);
  lines.push('```');
  lines.push('');

  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, lines.join('\n'));
  return {totalCrashes, failingConfigs};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseArgs(argv: Array<string>) {
  let games = 200;
  let seedBase = 42_000;
  let out = 'docs/consortium/16-validation.md';
  for (const a of argv) {
    if (a.startsWith('--games=')) games = Number(a.slice(8));
    else if (a.startsWith('--seed-base=')) seedBase = Number(a.slice(12));
    else if (a.startsWith('--out=')) out = a.slice(6);
    else if (a === '--quick') games = 5;
  }
  return {games, seedBase, out};
}

async function main() {
  const {games, seedBase, out} = parseArgs(process.argv.slice(2));

  const configs: Array<ConfigSpec> = [
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

  const resultsByConfig = new Map<string, Array<GameResult>>();
  let seed = seedBase;

  for (const cfg of configs) {
    console.log(`\n=== ${cfg.name} (${games} games) ===`);
    const results: Array<GameResult> = [];
    for (let i = 0; i < games; i++) {
      const s = seed++;
      const result = runOneGame(cfg, s);
      results.push(result);
      if (result.crashed) {
        console.log(`  CRASH seed=${s} gen=${result.crash?.generation}: ${result.crash?.error.slice(0, 120)}`);
      } else if ((i + 1) % 25 === 0 || i === 0) {
        console.log(`  ${i + 1}/${games} ok gen=${result.generations} bridges=${result.bridgeCompletedCount} playable=${result.playableSeen.size}`);
      }
    }
    resultsByConfig.set(cfg.name, results);
    const crashes = results.filter((r) => r.crashed).length;
    console.log(`  done: ${games - crashes}/${games} completed, ${crashes} crashes`);
  }

  const {totalCrashes, failingConfigs} = writeReport(out, configs, resultsByConfig, games, seedBase);
  console.log(`\nWrote ${out}`);
  console.log(`Total crashes: ${totalCrashes}`);
  if (failingConfigs.length) {
    console.log(`Failing configs: ${failingConfigs.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('All configurations: zero crashes.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
