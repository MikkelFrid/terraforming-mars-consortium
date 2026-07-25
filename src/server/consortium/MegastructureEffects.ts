import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {displayName, MegastructureKind} from '../../common/consortium/MegastructureKind';

/** Minimal structure shape needed by onComplete stubs (avoids circular imports). */
type StructureRef = {
  kind: MegastructureKind;
  sector?: number;
};

/**
 * Completion effect contract: a weak global effect plus a stronger
 * per-contributor bonus. Phase 6c will fill these in; for now every
 * structure only logs intent.
 *
 * TODO(consortium): phase 6c — implement real onComplete effects.
 */
export interface MegastructureOnComplete {
  global(game: IGame, structure: StructureRef): void;
  perContributor(player: IPlayer, structure: StructureRef, segmentsOwned: number): void;
}

function stubEffect(label: string): MegastructureOnComplete {
  return {
    global(game, structure) {
      // TODO(consortium): phase 6c
      game.log('${0} global effect would fire (${1})', (b) =>
        b.string(displayName(structure.kind, structure.sector)).string(label));
    },
    perContributor(player, structure, segmentsOwned) {
      // TODO(consortium): phase 6c
      player.game.log('${0} would receive ${1} per-contributor effect from ${2} (${3} segments)', (b) =>
        b.player(player)
          .string(label)
          .string(displayName(structure.kind, structure.sector))
          .number(segmentsOwned));
    },
  };
}

/** Stub onComplete table — one entry per kind. */
export const MEGASTRUCTURE_EFFECTS: Record<MegastructureKind, MegastructureOnComplete> = {
  bridge: stubEffect('bridge unlock'),
  space_elevator: stubEffect('space elevator'),
  l1_magnetic_shield: stubEffect('l1 magnetic shield'),
  mohole: stubEffect('mohole'),
  solar_mirror: stubEffect('solar mirror'),
  arcology: stubEffect('arcology'),
};
