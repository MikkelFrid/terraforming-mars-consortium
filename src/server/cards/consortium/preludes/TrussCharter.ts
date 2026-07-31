import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

/** Permanent segment discount while in play — see Megastructures.segmentDiscountMc. */
export class TrussCharter extends PreludeCard {
  constructor() {
    super({
      name: CardName.TRUSS_CHARTER,
      tags: [Tag.STRUCTURE],

      metadata: {
        cardNumber: 'CNP2',
        renderData: CardRenderer.builder((b) => {
          b.effect('Your megastructure segments cost 2 M€ less.', (eb) => {
            eb.empty().startEffect.megacredits(-BALANCE.TRUSS_CHARTER_DISCOUNT, {digit});
          });
        }),
        description: 'Effect: Your megastructure segments cost 2 M€ less.',
      },
    });
  }
}
