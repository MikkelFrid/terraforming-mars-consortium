import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class StandardGauge extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.STANDARD_GAUGE,
      tags: [Tag.BUILDING],
      cost: 8,

      behavior: {
        production: {steel: 1},
      },

      metadata: {
        cardNumber: 'CN45',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.steel(1));
        }),
        description: 'Increase your steel production 1 step.',
      },
    });
  }
}
