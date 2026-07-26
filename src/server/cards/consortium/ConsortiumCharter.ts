import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class ConsortiumCharter extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CONSORTIUM_CHARTER,
      tags: [Tag.STRUCTURE, Tag.EARTH],
      cost: 21,
      victoryPoints: 1,

      requirements: {tag: Tag.STRUCTURE, count: 2},

      behavior: {
        production: {megacredits: 1},
      },

      metadata: {
        cardNumber: 'CN18',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(1));
        }),
        description: 'Requires 2 Structure tags. Increase your M€ production 1 step.',
      },
    });
  }
}
