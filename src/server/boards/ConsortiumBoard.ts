import {SpaceBonus} from '../../common/boards/SpaceBonus';
import {SpaceName} from '../../common/boards/SpaceName';
import {SpaceType} from '../../common/boards/SpaceType';
import {SpaceId, isSpaceId, safeCast} from '../../common/Types';
import {Random} from '../../common/utils/Random';
import {GameOptions} from '../game/GameOptions';
import {CanAffordOptions, IPlayer} from '../IPlayer';
import {MarsBoard} from './MarsBoard';
import {Space} from './Space';
import consortiumSpaces from './consortiumSpaces.json';

type ConsortiumSpaceJson = {
  q: number;
  r: number;
  ring: number;
  sector: number;
  type: 'land' | 'highland' | 'crater' | 'chasm';
  zone: string;
  id: number;
  x: number;
  y: number;
  locked?: boolean;
  bridge?: number;
};

const TYPE_MAP: Record<ConsortiumSpaceJson['type'], SpaceType> = {
  land: SpaceType.LAND,
  highland: SpaceType.HIGHLAND,
  crater: SpaceType.CRATER_FIELD,
  chasm: SpaceType.CHASM,
};

/** Axial neighbor offsets (q, r), clockwise from top-left. */
const AXIAL_DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0],
];

function colonySpace(id: SpaceId): Space {
  return {id, spaceType: SpaceType.COLONY, x: -1, y: -1, bonus: []};
}

function spaceId(id: number): SpaceId {
  return safeCast(id.toString().padStart(3, '0'), isSpaceId);
}

/**
 * TODO(consortium): Space bonuses are not assigned yet. When designing the
 * bonus layout, populate `bonus` here (or in the JSON) instead of leaving [].
 */
function spaceBonuses(_entry: ConsortiumSpaceJson): Array<SpaceBonus> {
  return [];
}

/**
 * Locked frontier spaces become placeable when their bridge completes and
 * clears {@link Space.locked}. Until then they remain unplaceable.
 */
export function isFrontierUnlocked(space: Space): boolean {
  return space.locked !== true;
}

/**
 * Open one bridge sector: unlock its locked frontier spaces and convert its
 * belt chasms to LAND. Other sectors are untouched.
 */
export function unlockBridgeSector(spaces: ReadonlyArray<Space>, sector: number): void {
  for (const space of spaces) {
    if (space.locked === true && space.bridge === sector) {
      space.locked = false;
    }
    if (space.spaceType === SpaceType.CHASM && space.sector === sector) {
      space.spaceType = SpaceType.LAND;
    }
  }
}

export class ConsortiumBoard extends MarsBoard {
  public static newInstance(_gameOptions: GameOptions, _rng: Random): ConsortiumBoard {
    const spaces: Array<Space> = [
      colonySpace(SpaceName.GANYMEDE_COLONY),
      colonySpace(SpaceName.PHOBOS_SPACE_HAVEN),
    ];

    const N = 6; // map radius — matches build_board.py
    for (const entry of consortiumSpaces as ConsortiumSpaceJson[]) {
      const space: Space = {
        id: spaceId(entry.id),
        spaceType: TYPE_MAP[entry.type],
        // Grid coords derived from axial for maxX/maxY; adjacency uses q/r.
        x: entry.q + N,
        y: entry.r + N,
        q: entry.q,
        r: entry.r,
        bonus: spaceBonuses(entry),
      };
      // Sector is needed on chasms (belt) and locked frontier for bridge unlock.
      if (entry.type === 'chasm' || entry.locked === true) {
        space.sector = entry.sector;
      }
      if (entry.locked === true) {
        space.locked = true;
        space.bridge = entry.bridge;
      }
      spaces.push(space);
    }

    return new ConsortiumBoard(spaces);
  }

  protected override computeAdjacentSpaces(space: Space): ReadonlyArray<Space | undefined> {
    const {q: sq, r: sr} = space;
    if (space.spaceType === SpaceType.COLONY || sq === undefined || sr === undefined) {
      return [];
    }
    return AXIAL_DIRS.map(([dq, dr]) => {
      const q = sq + dq;
      const r = sr + dr;
      return this.spaces.find((adj) =>
        adj.q === q && adj.r === r && adj.spaceType !== SpaceType.COLONY);
    });
  }

  public override canPlaceTile(space: Space): boolean {
    if (!super.canPlaceTile(space)) {
      return false;
    }
    return isFrontierUnlocked(space);
  }

  public override getAvailableSpacesOnLand(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return super.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => isFrontierUnlocked(space));
  }
}
