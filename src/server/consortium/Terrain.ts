import {IPlayer, CanAffordOptions} from '../IPlayer';
import {Space} from '../boards/Space';
import {SpaceType} from '../../common/boards/SpaceType';
import {Board} from '../boards/Board';
import {MarsBoard} from '../boards/MarsBoard';
import {Frontier} from './Frontier';

/**
 * Consortium terrain helpers for crater fields, highlands, and mixed scoring.
 */
export class Terrain {
  public static ownsCraterTile(player: IPlayer): boolean {
    return player.game.board.spaces.some((space) =>
      space.spaceType === SpaceType.CRATER_FIELD &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space));
  }

  public static ownsHighlandTile(player: IPlayer): boolean {
    return player.game.board.spaces.some((space) =>
      space.spaceType === SpaceType.HIGHLAND &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space));
  }

  public static availableHighlandSpaces(
    player: IPlayer,
    canAffordOptions?: CanAffordOptions,
  ): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => space.spaceType === SpaceType.HIGHLAND);
  }

  /** Land spaces adjacent to at least one crater-field space. */
  public static availableSpacesAdjacentToCrater(
    player: IPlayer,
    canAffordOptions?: CanAffordOptions,
  ): Array<Space> {
    const board = player.game.board;
    return board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => board.getAdjacentSpaces(space)
        .some((adj) => adj.spaceType === SpaceType.CRATER_FIELD));
  }

  /** Greenery-legal former-chasm spaces (Talus Reclamation). */
  public static availableFormerChasmGreenerySpaces(
    player: IPlayer,
    canAffordOptions?: CanAffordOptions,
  ): Array<Space> {
    const board = player.game.board as MarsBoard;
    return board.getAvailableSpacesForGreenery(player, canAffordOptions)
      .filter((space) => Frontier.isFormerChasm(space));
  }

  /** All crater-field tiles on Mars (owned by anyone). */
  public static countCraterFieldTilesOnMars(player: IPlayer): number {
    return player.game.board.spaces.filter((space) =>
      space.spaceType === SpaceType.CRATER_FIELD &&
      space.tile !== undefined).length;
  }

  /**
   * Owned tiles on crater fields, highland spaces, or frontier zones.
   * Used by Ledger of Claims.
   */
  public static countOwnedTerrainClaimTiles(player: IPlayer): number {
    return player.game.board.spaces.filter((space) => {
      if (space.tile === undefined || !Board.ownedBy(player)(space)) {
        return false;
      }
      return space.spaceType === SpaceType.CRATER_FIELD ||
        space.spaceType === SpaceType.HIGHLAND ||
        Frontier.isFrontierSpace(space);
    }).length;
  }
}
