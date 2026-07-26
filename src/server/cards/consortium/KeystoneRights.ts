import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
/**
 * When the owner places a keystone, card.data becomes true (once).
 * Claim is driven from Megastructures.placeSegment.
 */
export class KeystoneRights extends Card implements IProjectCard {
  public data: boolean = false;

  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.KEYSTONE_RIGHTS,
      tags: [Tag.STRUCTURE],
      cost: 23,
      victoryPoints: 'special',

      requirements: {iridium: 1},

      metadata: {
        cardNumber: 'CN19',
        renderData: CardRenderer.builder((b) => {
          b.effect('When you place a keystone segment, gain 3 extra VP at game end. Only one keystone counts.', (eb) => {
            eb.empty().startEffect.text(`+${BALANCE.KEYSTONE_RIGHTS_EXTRA_VP} VP`);
          });
        }),
        description: 'Requires that you have 1 iridium.',
      },
    });
  }

  public override getVictoryPoints(_player: IPlayer): number {
    return this.data === true ? BALANCE.KEYSTONE_RIGHTS_EXTRA_VP : 0;
  }
}
