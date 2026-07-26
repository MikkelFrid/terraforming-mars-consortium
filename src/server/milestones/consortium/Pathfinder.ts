import {BaseMilestone} from '../IMilestone';
import {IPlayer} from '../../IPlayer';
import {CONSORTIUM_MA_BALANCE} from '../../../common/consortium/MegastructureConstants';
import {Megastructures} from '../../consortium/Megastructures';

export class Pathfinder extends BaseMilestone {
  constructor() {
    super(
      'Pathfinder',
      `Own at least ${CONSORTIUM_MA_BALANCE.PATHFINDER_FRONTIER_TILES} tiles in frontier zones`,
      CONSORTIUM_MA_BALANCE.PATHFINDER_FRONTIER_TILES);
  }

  public getScore(player: IPlayer): number {
    return Megastructures.countFrontierTiles(player);
  }
}
