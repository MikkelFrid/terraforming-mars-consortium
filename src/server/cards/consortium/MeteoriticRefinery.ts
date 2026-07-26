import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';

/**
 * When the owner spends iridium (any amount in a payment), gain 2 M€ once per pay().
 */
export class MeteoriticRefinery extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.METEORITIC_REFINERY,
      tags: [Tag.PROSPECTING, Tag.BUILDING],
      cost: 20,
      victoryPoints: 1,

      requirements: {iridium: 1},

      metadata: {
        cardNumber: 'CN09',
        renderData: CardRenderer.builder((b) => {
          b.effect('When you spend iridium, gain 2 M€.', (eb) => {
            eb.minus().iridium(1).startEffect.megacredits(2);
          });
        }),
        description: 'Requires that you have 1 iridium.',
      },
    });
  }

  public onIridiumSpent(player: IPlayer, _amount: number): void {
    player.stock.add(Resource.MEGACREDITS, 2, {log: true});
  }
}
