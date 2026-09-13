import {expansionSpaceColonies} from '../../common/boards/expansionSpaceColonies';
import {SpaceType} from '../../common/boards/SpaceType';
import {CardName} from '../../common/cards/CardName';
import {SpaceId} from '../../common/Types';
import {GameOptions} from '../game/GameOptions';
import {Space} from './Space';

function colonySpace(id: SpaceId): Space {
  return {id, spaceType: SpaceType.COLONY, x: -1, y: -1, bonus: []};
}

/**
 * Append Venus / Pathfinders / Promo reserved colony spaces when those
 * expansions (or specifically included cards) are in play.
 *
 * Idempotent: skips ids already present. Used by BoardBuilder, ConsortiumBoard
 * (which bypasses BoardBuilder), and deserialize migration for older saves.
 */
export function addExpansionColonySpaces(spaces: Array<Space>, gameOptions: GameOptions): void {
  const existing = new Set(spaces.map((s) => s.id));
  for (const entry of expansionSpaceColonies) {
    let include = false;
    // Special case for Venera Base when Pathfinders is included, but Turmoil or Venus is not
    if (entry.card === CardName.VENERA_BASE) {
      const pathfindersTurmoilVenusInPlay = gameOptions.pathfindersExpansion &&
        gameOptions.turmoilExtension &&
        gameOptions.venusNextExtension;
      include = gameOptions.includedCards.includes(entry.card) || pathfindersTurmoilVenusInPlay;
    } else {
      include = gameOptions.expansions[entry.expansion] === true ||
        gameOptions.includedCards.includes(entry.card);
    }
    if (include && !existing.has(entry.name)) {
      spaces.push(colonySpace(entry.name));
      existing.add(entry.name);
    }
  }
}
