import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {ActionCard} from '../ActionCard';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class SegmentPrefabrication extends ActionCard implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SEGMENT_PREFABRICATION,
      tags: [Tag.STRUCTURE, Tag.BUILDING],
      cost: 19,

      action: {
        spend: {steel: 2},
        iridium: 1,
      },

      metadata: {
        cardNumber: 'CN17',
        renderData: CardRenderer.builder((b) => {
          b.action('Spend 2 steel to gain 1 iridium.', (eb) => {
            eb.steel(2).startAction.iridium(1);
          });
        }),
      },
    });
  }
}
