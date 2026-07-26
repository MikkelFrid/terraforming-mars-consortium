import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {Size} from '../../../common/cards/render/Size';

/**
 * Owner-only highland foundation bypass. Applied in Megastructures.meetsFoundation
 * when this card is in the player's tableau.
 */
export class StructuralEngineers extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.STRUCTURAL_ENGINEERS,
      tags: [Tag.STRUCTURE, Tag.SCIENCE],
      cost: 26,
      victoryPoints: 1,

      metadata: {
        cardNumber: 'CN21',
        renderData: CardRenderer.builder((b) => {
          b.effect(
            'You may contribute to megastructures that require a highland foundation without owning a highland tile.',
            (eb) => {
              eb.empty().startEffect.text('NO HIGHLAND', {size: Size.SMALL});
            });
        }),
      },
    });
  }
}
