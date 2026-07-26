import {BaseMilestone} from '../IMilestone';
import {IPlayer} from '../../IPlayer';
import {CONSORTIUM_MA_BALANCE} from '../../../common/consortium/MegastructureConstants';
import {Megastructures} from '../../consortium/Megastructures';

export class Mason extends BaseMilestone {
  constructor() {
    super(
      'Mason',
      `Have contributed at least ${CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS} megastructure segments in total`,
      CONSORTIUM_MA_BALANCE.ARCHITECT_SEGMENTS);
  }

  public getScore(player: IPlayer): number {
    return Megastructures.countSegmentsFor(player);
  }
}
