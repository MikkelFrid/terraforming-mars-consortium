import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Iridium} from '../../consortium/Iridium';
import {IRIDIUM_VALUE} from '../../../common/constants';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {digit} from '../Options';

/**
 * Raises the owner's iridium payment value by 1 (default IRIDIUM_VALUE → +1).
 * Composes with Scarp Foundry via separate rate channels (steelRate vs iridiumValue).
 */
export class IridiumReserve extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.IRIDIUM_RESERVE,
      tags: [Tag.STRUCTURE],
      cost: 20,

      metadata: {
        cardNumber: 'CN51',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit}).br;
          b.effect(`Your iridium is worth ${BALANCE.IRIDIUM_RESERVE_VALUE} M€ instead of ${IRIDIUM_VALUE} when paying.`, (eb) => {
            eb.iridium(1).startEffect.megacredits(BALANCE.IRIDIUM_RESERVE_VALUE, {digit});
          });
        }),
        description: 'Gain 2 iridium.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    Iridium.grant(player, 2);
    player.increaseIridiumValue();
    return undefined;
  }
}
