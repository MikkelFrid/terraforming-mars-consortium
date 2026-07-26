import {BaseMilestone} from '../IMilestone';
import {IPlayer} from '../../IPlayer';
import {Tag} from '../../../common/cards/Tag';
import {CONSORTIUM_MA_BALANCE} from '../../../common/consortium/MegastructureConstants';

export class Assayer extends BaseMilestone {
  constructor() {
    super(
      'Assayer',
      `Have ${CONSORTIUM_MA_BALANCE.ASSAYER_TAG_TOTAL} or more Prospecting and Structure tags combined`,
      CONSORTIUM_MA_BALANCE.ASSAYER_TAG_TOTAL);
  }

  public getScore(player: IPlayer): number {
    return player.tags.multipleCount([Tag.PROSPECTING, Tag.STRUCTURE]);
  }
}
