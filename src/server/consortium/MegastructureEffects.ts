import {Tag} from '../../common/cards/Tag';
import {CardName} from '../../common/cards/CardName';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../common/consortium/MegastructureConstants';
import {displayName, MegastructureKind} from '../../common/consortium/MegastructureKind';
import {Resource} from '../../common/Resource';
import {PlayerId} from '../../common/Types';
import {unlockBridgeSector} from '../boards/ConsortiumBoard';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Iridium} from './Iridium';

/** Minimal structure shape needed by onComplete (avoids circular imports). */
export type StructureRef = {
  kind: MegastructureKind;
  sector?: number;
  keystonePlayer?: PlayerId;
};

/**
 * Completion effect contract: a weak global effect plus a stronger
 * per-contributor bonus. Numbers live in MEGASTRUCTURE_BALANCE.
 */
export interface MegastructureOnComplete {
  global(game: IGame, structure: StructureRef): void;
  perContributor(player: IPlayer, structure: StructureRef, segmentsOwned: number): void;
}

/** Contributor production scaled per N segments, floored, minimum 1. */
export function contributorScaledAmount(segmentsOwned: number, perSegments: number): number {
  return Math.max(1, Math.floor(segmentsOwned / perSegments));
}

function logGlobal(game: IGame, structure: StructureRef, detail: string): void {
  game.log('${0} global effect: ${1}', (b) =>
    b.string(displayName(structure.kind, structure.sector)).string(detail));
}

function logContributor(player: IPlayer, structure: StructureRef, detail: string): void {
  player.game.log('${0} receives ${1} from ${2}', (b) =>
    b.player(player).string(detail).string(displayName(structure.kind, structure.sector)));
}

const bridgeEffect: MegastructureOnComplete = {
  global(game, structure) {
    const sector = structure.sector;
    if (sector === undefined) {
      throw new Error('Bridge completion requires a sector');
    }
    unlockBridgeSector(game.board.spaces, sector);
    logGlobal(game, structure, `opens sector ${sector} (frontier unlocked, chasms → land)`);
    // Rimward Expeditions: free-rider payout for every owner, contributor or not.
    for (const player of game.playersInGenerationOrder) {
      if (player.tableau.has(CardName.RIMWARD_EXPEDITIONS)) {
        player.stock.add(Resource.MEGACREDITS, BALANCE.RIMWARD_BRIDGE_COMPLETE_MC, {log: true});
        player.drawCard(1);
      }
    }
  },
  perContributor(player, structure, segmentsOwned) {
    const amount = segmentsOwned * BALANCE.BRIDGE_MC_PRODUCTION_PER_SEGMENT;
    player.production.add(Resource.MEGACREDITS, amount, {log: true});
    logContributor(player, structure, `+${amount} M€ production`);
  },
};

const spaceElevatorEffect: MegastructureOnComplete = {
  global(game, structure) {
    // Discount is applied in Player.getCardCost via Megastructures.hasCompleted.
    logGlobal(game, structure,
      `all players pay ${BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT} M€ less for space-tag cards`);
  },
  perContributor(player, structure, segmentsOwned) {
    const amount = contributorScaledAmount(
      segmentsOwned, BALANCE.SPACE_ELEVATOR_TITANIUM_PROD_PER_SEGMENTS);
    player.production.add(Resource.TITANIUM, amount, {log: true});
    logContributor(player, structure, `+${amount} titanium production`);
  },
};

const l1ShieldEffect: MegastructureOnComplete = {
  global(game, structure) {
    for (const player of game.players) {
      player.plantsNeededForGreenery = Math.max(
        1,
        player.plantsNeededForGreenery - BALANCE.L1_SHIELD_GREENERY_DISCOUNT,
      );
    }
    logGlobal(game, structure,
      `greenery costs ${BALANCE.L1_SHIELD_GREENERY_DISCOUNT} fewer plants (all players)`);
  },
  perContributor(player, structure, segmentsOwned) {
    const amount = contributorScaledAmount(
      segmentsOwned, BALANCE.L1_SHIELD_PLANT_PROD_PER_SEGMENTS);
    player.production.add(Resource.PLANTS, amount, {log: true});
    logContributor(player, structure, `+${amount} plant production`);
  },
};

const moholeEffect: MegastructureOnComplete = {
  global(game, structure) {
    for (const player of game.players) {
      player.production.add(Resource.HEAT, BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION, {log: true});
    }
    logGlobal(game, structure,
      `all players +${BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION} heat production`);
  },
  perContributor(player, structure, segmentsOwned) {
    const amount = segmentsOwned * BALANCE.MOHOLE_IRIDIUM_PER_SEGMENT;
    const granted = Iridium.grant(player, amount);
    logContributor(player, structure,
      `+${granted} iridium immediately (asked ${amount}); +${BALANCE.MOHOLE_GENERATION_IRIDIUM} iridium each generation`);
  },
};

const solarMirrorEffect: MegastructureOnComplete = {
  global(game, structure) {
    const actor = structure.keystonePlayer !== undefined ?
      game.getPlayerById(structure.keystonePlayer) :
      game.players[0];
    const steps = BALANCE.SOLAR_MIRROR_TEMPERATURE_STEPS as 1;
    game.increaseTemperature(actor, steps);
    logGlobal(game, structure, `temperature rises ${steps} step`);
  },
  perContributor(player, structure, segmentsOwned) {
    const amount = contributorScaledAmount(
      segmentsOwned, BALANCE.SOLAR_MIRROR_HEAT_PROD_PER_SEGMENTS);
    player.production.add(Resource.HEAT, amount, {log: true});
    logContributor(player, structure, `+${amount} heat production`);
  },
};

const arcologyEffect: MegastructureOnComplete = {
  global(game, structure) {
    for (const player of game.players) {
      player.production.add(Resource.MEGACREDITS, BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION, {log: true});
    }
    logGlobal(game, structure,
      `all players +${BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION} M€ production`);
  },
  perContributor(player, structure, segmentsOwned) {
    // Extra VP is scored at game end in Megastructures.calculateVictoryPoints.
    logContributor(player, structure,
      `+${segmentsOwned * BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT} VP at game end (stacks with base segment VP)`);
  },
};

/** OnComplete table — one entry per kind. */
export const MEGASTRUCTURE_EFFECTS: Record<MegastructureKind, MegastructureOnComplete> = {
  bridge: bridgeEffect,
  space_elevator: spaceElevatorEffect,
  l1_magnetic_shield: l1ShieldEffect,
  mohole: moholeEffect,
  solar_mirror: solarMirrorEffect,
  arcology: arcologyEffect,
};

/** Human-readable summary for the track panel after completion. */
export function completionEffectSummary(kind: MegastructureKind, sector?: number): string {
  switch (kind) {
  case 'bridge':
    return `Opens sector ${sector ?? '?'}. Contributors: +${BALANCE.BRIDGE_MC_PRODUCTION_PER_SEGMENT} M€ prod / segment.`;
  case 'space_elevator':
    return `All: −${BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT} M€ on space tags. Contributors: titanium prod.`;
  case 'l1_magnetic_shield':
    return `All: greenery −${BALANCE.L1_SHIELD_GREENERY_DISCOUNT} plants. Contributors: plant prod.`;
  case 'mohole':
    return `All: +${BALANCE.MOHOLE_GLOBAL_HEAT_PRODUCTION} heat prod. Contributors: iridium now + each generation.`;
  case 'solar_mirror':
    return `Temperature +${BALANCE.SOLAR_MIRROR_TEMPERATURE_STEPS}. Contributors: heat prod.`;
  case 'arcology':
    return `All: +${BALANCE.ARCOLOGY_GLOBAL_MC_PRODUCTION} M€ prod. Contributors: +${BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT} VP / segment.`;
  }
}

/** Space Elevator discount helper for Player.getCardCost. */
export function spaceElevatorDiscountFor(cardTags: ReadonlyArray<Tag>, game: IGame): number {
  if (!cardTags.includes(Tag.SPACE)) {
    return 0;
  }
  const data = game.megastructuresData;
  if (data === undefined) {
    return 0;
  }
  const done = data.structures.some((s) => s.kind === 'space_elevator' && s.completed);
  return done ? BALANCE.SPACE_ELEVATOR_SPACE_TAG_DISCOUNT : 0;
}
