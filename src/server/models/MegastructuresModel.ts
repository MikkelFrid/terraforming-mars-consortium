import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../common/consortium/MegastructureConstants';
import {displayName} from '../../common/consortium/MegastructureKind';
import {Color} from '../../common/Color';
import {
  MegastructureIneligibility,
  MegastructureModel,
  MegastructuresModel,
} from '../../common/models/MegastructuresModel';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Megastructure, Megastructures} from '../consortium/Megastructures';
import {MEGASTRUCTURE_EFFECTS} from '../consortium/MegastructureEffects';

function ineligibilityFor(
  player: IPlayer | undefined,
  structure: Megastructure,
): MegastructureIneligibility | undefined {
  if (structure.completed) {
    return 'completed';
  }
  if (player === undefined) {
    return undefined;
  }
  if (!Megastructures.meetsFoundation(player, structure)) {
    return 'missing_foundation';
  }
  if (Megastructures.canContribute(player, structure)) {
    return undefined;
  }
  return 'cannot_afford';
}

function completionGrantedText(structure: Megastructure): string | undefined {
  if (!structure.completed) {
    return undefined;
  }
  const effect = MEGASTRUCTURE_EFFECTS[structure.kind];
  // Stub labels until phase 6c fills real effects — mirror MegastructureEffects.
  void effect;
  const labels: Record<string, string> = {
    bridge: 'Unlocks frontier (stub)',
    space_elevator: 'Space Elevator effect (stub)',
    l1_magnetic_shield: 'L1 Magnetic Shield effect (stub)',
    mohole: 'Mohole effect (stub)',
    solar_mirror: 'Solar Mirror effect (stub)',
    arcology: 'Arcology effect (stub)',
  };
  const global = labels[structure.kind] ?? 'Global effect (stub)';
  return `${global}. Contributors: ${BALANCE.VP_PER_SEGMENT} VP/segment` +
    ` + ${BALANCE.VP_KEYSTONE_BONUS} VP keystone bonus.`;
}

function toModel(
  game: IGame,
  structure: Megastructure,
  viewer: IPlayer | undefined,
): MegastructureModel {
  const next = Megastructures.nextSegmentIndex(structure);
  const nextIsKeystone = next >= 0 && Megastructures.isKeystone(structure, next);
  const canContribute = viewer !== undefined && Megastructures.canContribute(viewer, structure);

  const byPlayer = new Map<string, {color: Color; name: string; count: number; keystone: boolean}>();
  for (const seg of structure.segments) {
    if (seg.owner === undefined) {
      continue;
    }
    const p = game.getPlayerById(seg.owner);
    const existing = byPlayer.get(seg.owner);
    if (existing === undefined) {
      byPlayer.set(seg.owner, {
        color: p.color,
        name: p.name,
        count: 1,
        keystone: structure.keystonePlayer === seg.owner,
      });
    } else {
      existing.count += 1;
    }
  }

  return {
    id: structure.id,
    kind: structure.kind,
    name: displayName(structure.kind, structure.sector),
    sector: structure.sector,
    segments: structure.segments.map((seg, idx) => ({
      ownerColor: seg.owner !== undefined ? game.getPlayerById(seg.owner).color : undefined,
      isKeystone: Megastructures.isKeystone(structure, idx),
    })),
    completed: structure.completed,
    nextSegmentCost: next >= 0 ? Megastructures.segmentCostMc(structure, next) : undefined,
    nextIsKeystone,
    keystoneMinIridium: Megastructures.keystoneMinIridium(structure),
    canContribute,
    ineligibility: ineligibilityFor(viewer, structure),
    contributors: Array.from(byPlayer.values()),
    completionGranted: completionGrantedText(structure),
  };
}

/**
 * Build the megastructures client model. Viewer is the acting player when known;
 * spectators get eligibility fields unset / false.
 */
export function createMegastructuresModel(
  game: IGame,
  viewer?: IPlayer,
): MegastructuresModel | undefined {
  const data = game.megastructuresData;
  if (data === undefined) {
    return undefined;
  }
  return {
    structures: data.structures.map((s) => toModel(game, s, viewer)),
  };
}
