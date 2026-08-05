import {MarsBoard} from '../boards/MarsBoard';
import {Space} from '../boards/Space';
import {SpaceType} from '../../common/boards/SpaceType';
import {Random} from '../../common/utils/Random';
import {inplaceShuffle} from '../utils/shuffle';

/**
 * Targets for Consortium terrain on a standard 61-hex board.
 * Scaled down from Massif (127 hexes) — dense enough that bridges,
 * highland cards and crater iridium still matter.
 */
const OVERLAY_COUNTS = {
  highlands: 4,
  craterFields: 6,
  chasmsPerSector: 3,
  lockedFrontierPerSector: 4,
} as const;

/**
 * When Consortium is enabled on a non-Consortium map, stamp highland /
 * crater / chasm / locked-frontier metadata onto existing land spaces.
 *
 * Native Massif / Rift / Archipelago boards already carry this in JSON —
 * do not call this for those.
 */
export function applyConsortiumOverlay(board: MarsBoard, rng: Random): void {
  const land = board.spaces.filter((space) =>
    space.spaceType === SpaceType.LAND &&
    space.id !== board.noctisCitySpaceId);

  if (land.length < 20) {
    return;
  }

  const rim: Array<Space> = [];
  const interior: Array<Space> = [];
  for (const space of land) {
    const adj = board.getAdjacentSpaces(space)
      .filter((a) => a.spaceType !== SpaceType.COLONY);
    if (adj.length < 6) {
      rim.push(space);
    } else {
      interior.push(space);
    }
  }

  // Stable sector buckets by angle around the disc centre (x≈4, y≈4).
  const bySector = (spaces: Array<Space>): Array<Array<Space>> => {
    const buckets: Array<Array<Space>> = [[], [], []];
    for (const space of spaces) {
      const angle = Math.atan2(space.y - 4, space.x - 4);
      // Map (-π, π] → sector 0 / 1 / 2 (three 120° wedges).
      const sector = ((Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 3)) % 3 + 3) % 3;
      buckets[sector].push(space);
    }
    for (const bucket of buckets) {
      inplaceShuffle(bucket, rng);
    }
    return buckets;
  };

  const claimed = new Set<Space>();
  const take = (pool: Array<Space>, n: number): Array<Space> => {
    const out: Array<Space> = [];
    for (const space of pool) {
      if (out.length >= n) {
        break;
      }
      if (claimed.has(space)) {
        continue;
      }
      claimed.add(space);
      out.push(space);
    }
    return out;
  };

  const rimSectors = bySector([...rim]);
  const interiorSectors = bySector([...interior]);

  // Locked frontier on the rim (bridge-gated).
  for (let sector = 0; sector < 3; sector++) {
    for (const space of take(rimSectors[sector], OVERLAY_COUNTS.lockedFrontierPerSector)) {
      space.locked = true;
      space.bridge = sector;
      space.sector = sector;
    }
  }

  // Chasm belts — prefer remaining rim, then sector interior.
  for (let sector = 0; sector < 3; sector++) {
    const pool = [
      ...rimSectors[sector].filter((s) => !claimed.has(s)),
      ...interiorSectors[sector].filter((s) => !claimed.has(s)),
    ];
    for (const space of take(pool, OVERLAY_COUNTS.chasmsPerSector)) {
      space.spaceType = SpaceType.CHASM;
      space.bonus = [];
      space.sector = sector;
      delete space.locked;
      delete space.bridge;
    }
  }

  // Highlands and crater fields in the open interior.
  const openInterior = interior.filter((s) => !claimed.has(s));
  inplaceShuffle(openInterior, rng);
  for (const space of take(openInterior, OVERLAY_COUNTS.highlands)) {
    space.spaceType = SpaceType.HIGHLAND;
  }
  for (const space of take(openInterior, OVERLAY_COUNTS.craterFields)) {
    space.spaceType = SpaceType.CRATER_FIELD;
  }
}
