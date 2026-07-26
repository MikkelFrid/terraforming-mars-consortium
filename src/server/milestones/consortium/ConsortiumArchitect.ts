import {BaseMilestone} from '../IMilestone';
import {IPlayer} from '../../IPlayer';
import {CONSORTIUM_MA_BALANCE} from '../../../common/consortium/MegastructureConstants';
import {Megastructures} from '../../consortium/Megastructures';

/** Design name "Architect" — display "C. Architect" (Architect taken by TC Nova). */
export class ConsortiumArchitect extends BaseMilestone {
  constructor() {
    super(
      'C. Architect',
      `Have contributed at least ${CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS} megastructure segments in total`,
      CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS);
  }

  public getScore(player: IPlayer): number {
    return Megastructures.countSegmentsFor(player);
  }
}
