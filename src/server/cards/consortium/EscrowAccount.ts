import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class EscrowAccount extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.ESCROW_ACCOUNT,
      tags: [Tag.EARTH],
      cost: 5,

      behavior: {
        stock: {megacredits: 3},
        drawCard: 1,
      },

      metadata: {
        cardNumber: 'CN44',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(3, {digit}).cards(1);
        }),
        description: 'Gain 3 M€. Draw a card.',
      },
    });
  }
}
