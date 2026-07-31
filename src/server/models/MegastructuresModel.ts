import {Color} from '../../common/Color';
import {
  MegastructureIneligibility,
  MegastructureModel,
  MegastructuresModel,
} from '../../common/models/MegastructuresModel';
import {displayName} from '../../common/consortium/MegastructureKind';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Megastructure, Megastructures} from '../consortium/Megastructures';
import {completionEffectSummary} from '../consortium/MegastructureEffects';

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
  return completionEffectSummary(structure.kind, structure.sector);
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

  const keystoneMinIridium = Megastructures.keystoneMinIridium(structure);
  return {
    id: structure.id,
    kind: structure.kind,
    name: displayName(structure.kind, structure.sector),
    sector: structure.sector,
    segments: structure.segments.map((seg, idx) => {
      const isKeystone = Megastructures.isKeystone(structure, idx);
      return {
        ownerColor: seg.owner !== undefined ? game.getPlayerById(seg.owner).color : undefined,
        isKeystone,
        keystoneMinIridium: isKeystone ? keystoneMinIridium : undefined,
      };
    }),
    completed: structure.completed,
    nextSegmentCost: next >= 0 && viewer !== undefined ?
      Megastructures.effectiveSegmentCostMc(viewer, structure, next) :
      (next >= 0 ? Megastructures.segmentCostMc(structure, next) : undefined),
    nextIsKeystone,
    nextMinIridium: nextIsKeystone ? keystoneMinIridium : 0,
    keystoneMinIridium,
    canContribute,
    ineligibility: ineligibilityFor(viewer, structure),
    contributors: Array.from(byPlayer.values()),
    completionGranted: completionGrantedText(structure),
    outcome: completionEffectSummary(structure.kind, structure.sector),
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
