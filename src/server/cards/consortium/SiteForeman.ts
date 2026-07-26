import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {digit} from '../Options';

/** Permanent segment discount while in play. Applied in Megastructures.segmentDiscountMc. */
export class SiteForeman extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SITE_FOREMAN,
      tags: [Tag.STRUCTURE],
      cost: 13,

      metadata: {
        cardNumber: 'CN14',
        renderData: CardRenderer.builder((b) => {
          b.effect('Your megastructure segments cost 2 M€ less.', (eb) => {
            eb.empty().startEffect.megacredits(-BALANCE.SITE_FOREMAN_DISCOUNT, {digit});
          });
        }),
      },
    });
  }
}
