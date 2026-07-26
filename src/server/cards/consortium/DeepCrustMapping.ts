import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class DeepCrustMapping extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.DEEP_CRUST_MAPPING,
      tags: [Tag.PROSPECTING, Tag.SCIENCE],
      cost: 12,

      behavior: {
        drawCard: 2,
        iridium: 1,
      },

      metadata: {
        cardNumber: 'CN05',
        renderData: CardRenderer.builder((b) => {
          b.cards(2).iridium(1);
        }),
        description: 'Draw 2 cards. Gain 1 iridium.',
      },
    });
  }
}
