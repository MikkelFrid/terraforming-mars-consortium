import {IAward} from '../IAward';
import {IPlayer} from '../../IPlayer';
import {Megastructures} from '../../consortium/Megastructures';

/** Design name "Founder" — display "C. Founder" (Founder taken by modular/TC Nova). */
export class ConsortiumFounder implements IAward {
  public readonly name = 'C. Founder';
  public readonly description = 'Have the most megastructure segments contributed';
  public getScore(player: IPlayer): number {
    return Megastructures.countSegmentsFor(player);
  }
}
