import {Colony} from './Colony';
import {ColonyName} from '../../common/colonies/ColonyName';
import {ColonyBenefit} from '../../common/colonies/ColonyBenefit';

/** Survey outpost — card draws. */
export class Vesta extends Colony {
  constructor() {
    super({
      name: ColonyName.VESTA,
      expansion: 'consortium',
      build: {
        description: 'Draw 1 card',
        type: ColonyBenefit.DRAW_CARDS,
        quantity: [1, 1, 1],
      },
      trade: {
        description: 'Draw n cards',
        type: ColonyBenefit.DRAW_CARDS,
        quantity: [0, 1, 1, 1, 2, 2, 3],
      },
      colony: {
        description: 'Draw 1 card',
        type: ColonyBenefit.DRAW_CARDS,
        quantity: 1,
      },
    });
  }
}
