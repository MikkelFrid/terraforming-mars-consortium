import {IRIDIUM_BANK_CAPACITY} from '../../common/constants';
import {CardName} from '../../common/cards/CardName';
import {Resource} from '../../common/Resource';
import {IPlayer} from '../IPlayer';

/**
 * Consortium iridium helpers.
 *
 * Iridium is a standalone player field (not a Units / ALL_RESOURCES member).
 * Total iridium in the system is conserved: the shared bank starts full at
 * IRIDIUM_BANK_CAPACITY, moves to players via crater grants and Core Sampling,
 * and returns to the bank only through {@link Iridium.spend}.
 */
export class Iridium {
  public static initializeBank(): number {
    return IRIDIUM_BANK_CAPACITY;
  }

  /**
   * Move up to `count` iridium from the shared bank to the player.
   * No-op (returns 0) when the bank is empty. Never drives the bank negative.
   */
  public static grant(player: IPlayer, count: number, options?: {log?: boolean}): number {
    if (count <= 0) {
      return 0;
    }
    const granted = Math.min(count, player.game.iridiumBank);
    if (granted === 0) {
      return 0;
    }
    player.game.iridiumBank -= granted;
    player.iridium += granted;
    if (options?.log !== false) {
      player.game.log('${0} gained ${1} iridium', (b) => b.player(player).number(granted));
    }
    // Iridium Authority: 1 M€ whenever any player takes iridium from the bank.
    for (const p of player.game.playersInGenerationOrder) {
      if (p.tableau.has(CardName.IRIDIUM_AUTHORITY)) {
        p.stock.add(Resource.MEGACREDITS, 1, {log: true});
      }
    }
    return granted;
  }

  /**
   * The ONE place spent iridium returns to the bank.
   * Callers that want to invert this rule later only need to change this method.
   */
  public static spend(player: IPlayer, count: number, options?: {log?: boolean}): void {
    if (count <= 0) {
      return;
    }
    if (player.iridium < count) {
      throw new Error(`Player does not have ${count} iridium`);
    }
    player.iridium -= count;
    player.iridiumSpent += count;
    // Conservation + capacity clamp: with correct grants this never hits the cap
    // except as a safety net against corrupted state.
    player.game.iridiumBank = Math.min(IRIDIUM_BANK_CAPACITY, player.game.iridiumBank + count);
    if (options?.log !== false) {
      player.game.log('${0} spent ${1} iridium', (b) => b.player(player).number(count));
    }
  }
}
