import {Colony} from './Colony';
import {ColonyName} from '../../common/colonies/ColonyName';
import {ColonyBenefit} from '../../common/colonies/ColonyBenefit';
import {Resource} from '../../common/Resource';

/** Metal-rich asteroid — titanium economy. No recurring iridium (bank cap). */
export class Psyche extends Colony {
  constructor() {
    super({
      name: ColonyName.PSYCHE,
      expansion: 'consortium',
      build: {
        description: 'Gain 1 titanium production',
        type: ColonyBenefit.GAIN_PRODUCTION,
        resource: Resource.TITANIUM,
      },
      trade: {
        description: 'Gain n titanium',
        type: ColonyBenefit.GAIN_RESOURCES,
        quantity: [0, 1, 1, 2, 3, 4, 5],
        resource: Resource.TITANIUM,
      },
      colony: {
        description: 'Gain 1 titanium',
        type: ColonyBenefit.GAIN_RESOURCES,
        quantity: 1,
        resource: Resource.TITANIUM,
      },
    });
  }
}
