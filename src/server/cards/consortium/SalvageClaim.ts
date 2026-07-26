import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class SalvageClaim extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.SALVAGE_CLAIM,
      tags: [Tag.PROSPECTING],
      cost: 7,

      behavior: {
        iridium: 1,
        drawCard: 1,
      },

      metadata: {
        cardNumber: 'CN02',
        renderData: CardRenderer.builder((b) => {
          b.iridium(1).cards(1);
        }),
        description: 'Gain 1 iridium. Draw a card.',
      },
    });
  }
}
