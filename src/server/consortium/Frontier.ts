import {IGame} from '../IGame';
import {IPlayer, CanAffordOptions} from '../IPlayer';
import {Space} from '../boards/Space';
import {SpaceType} from '../../common/boards/SpaceType';
import {Board} from '../boards/Board';

/**
 * Consortium frontier helpers.
 *
 * An "open frontier sector" is a bridge megastructure that has completed —
 * that unlocks its locked frontier spaces and converts its chasms to land.
 */
export class Frontier {
  /** Number of bridge megastructures that have completed (0–3). */
  public static countOpenSectors(game: IGame): number {
    return game.megastructuresData?.structures
      .filter((s) => s.kind === 'bridge' && s.completed).length ?? 0;
  }

  /** Frontier identity: spaces tagged with a bridge sector in the board JSON. */
  public static isFrontierSpace(space: Space): boolean {
    return space.bridge !== undefined;
  }

  /**
   * Former chasm: had `sector` and no `bridge` in the JSON, converted from
   * CHASM → LAND on bridge completion. Ordinary frontier land has `bridge` set.
   */
  public static isFormerChasm(space: Space): boolean {
    return space.sector !== undefined &&
      space.bridge === undefined &&
      space.spaceType === SpaceType.LAND;
  }

  /** Unlocked frontier spaces the player may legally place a land tile on. */
  public static availableFrontierSpaces(
    player: IPlayer,
    canAffordOptions?: CanAffordOptions,
  ): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => this.isFrontierSpace(space) && space.locked !== true);
  }

  /** Former-chasm land the player may legally place on. */
  public static availableFormerChasmSpaces(
    player: IPlayer,
    canAffordOptions?: CanAffordOptions,
  ): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => this.isFormerChasm(space));
  }

  /** Owned tiles in frontier zones (same definition as Pathfinder / Cartographer). */
  public static countOwnedFrontierTiles(player: IPlayer): number {
    return player.game.board.spaces.filter((space) =>
      this.isFrontierSpace(space) &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space)).length;
  }
}
