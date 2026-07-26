import {IAward} from '../IAward';
import {IPlayer} from '../../IPlayer';
import {Megastructures} from '../../consortium/Megastructures';

export class Underwriter implements IAward {
  public readonly name = 'Underwriter';
  public readonly description = 'Have the most megastructure segments contributed';
  public getScore(player: IPlayer): number {
    return Megastructures.countSegmentsFor(player);
  }
}
