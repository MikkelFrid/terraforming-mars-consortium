import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';
import {uppercase} from '../Options';

export class TenderProcess extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.TENDER_PROCESS,
      tags: [Tag.EARTH],
      cost: 14,

      behavior: {
        drawCard: {count: 4, keep: 2},
      },

      metadata: {
        cardNumber: 'CN48',
        renderData: CardRenderer.builder((b) =>
          b.text('Look at the top 4 cards. Take 2 into hand, discard the rest.', {
            size: Size.SMALL, uppercase,
          })),
      },
    });
  }
}
