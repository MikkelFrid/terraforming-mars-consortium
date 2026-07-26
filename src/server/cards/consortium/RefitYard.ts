import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {ActionCard} from '../ActionCard';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class RefitYard extends ActionCard implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.REFIT_YARD,
      tags: [Tag.BUILDING, Tag.STRUCTURE],
      cost: 18,

      action: {
        spend: {megacredits: 3},
        stock: {steel: 1, titanium: 1},
      },

      metadata: {
        cardNumber: 'CN50',
        renderData: CardRenderer.builder((b) => {
          b.action('Spend 3 M€ to gain 1 steel and 1 titanium.', (eb) => {
            eb.megacredits(3, {digit}).startAction.steel(1).titanium(1);
          });
        }),
      },
    });
  }
}
