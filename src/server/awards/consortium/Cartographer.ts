import {IAward} from '../IAward';
import {IPlayer} from '../../IPlayer';
import {Megastructures} from '../../consortium/Megastructures';

export class Cartographer implements IAward {
  public readonly name = 'Cartographer';
  public readonly description = 'Have the most tiles owned in frontier zones';
  public getScore(player: IPlayer): number {
    return Megastructures.countFrontierTiles(player);
  }
}
