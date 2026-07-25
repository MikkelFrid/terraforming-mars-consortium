import {IPlayer} from '../../IPlayer';
import {RequirementType} from '../../../common/cards/RequirementType';
import {InequalityRequirement} from './InequalityRequirement';

/**
 * Evaluates whether this player holds at least N iridium.
 */
export class IridiumRequirement extends InequalityRequirement {
  public readonly type = RequirementType.IRIDIUM;

  public getScore(player: IPlayer): number {
    return player.iridium;
  }
}
