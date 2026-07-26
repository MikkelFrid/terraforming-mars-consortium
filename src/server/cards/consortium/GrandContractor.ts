import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Megastructures} from '../../consortium/Megastructures';

export class GrandContractor extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.GRAND_CONTRACTOR,
      tags: [Tag.STRUCTURE, Tag.EARTH],
      cost: 30,
      victoryPoints: 'special',

      requirements: {tag: Tag.STRUCTURE, count: 3},

      metadata: {
        cardNumber: 'CN23',
        renderData: CardRenderer.builder((b) => {
          b.vpText('1 VP per megastructure you have contributed at least 2 segments to.');
        }),
        description: 'Requires 3 Structure tags.',
      },
    });
  }

  public override getVictoryPoints(player: IPlayer): number {
    return Megastructures.countStructuresWithMinSegments(player, 2);
  }
}
