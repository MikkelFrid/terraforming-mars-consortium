import {IAward} from '../IAward';
import {IPlayer} from '../../IPlayer';

export class Refiner implements IAward {
  public readonly name = 'Refiner';
  public readonly description = 'Have spent the most iridium over the game';
  public getScore(player: IPlayer): number {
    return player.iridiumSpent;
  }
}
