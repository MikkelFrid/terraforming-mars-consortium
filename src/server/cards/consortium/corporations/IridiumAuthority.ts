import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';
import {Iridium} from '../../../consortium/Iridium';
import {all, digit} from '../../Options';

/**
 * 1 M€ whenever any player takes iridium from the bank (Iridium.grant hook).
 */
export class IridiumAuthority extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.IRIDIUM_AUTHORITY,
      tags: [Tag.EARTH],
      startingMegaCredits: 42,

      metadata: {
        cardNumber: 'CNC5',
        description: 'You start with 42 M€ and 2 iridium.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(42).nbsp.iridium(2, {digit});
          b.corpBox('effect', (ce) => {
            ce.effect('Whenever any player takes iridium from the bank, gain 1 M€.', (eb) => {
              eb.iridium(1, {all}).startEffect.megacredits(1);
            });
          });
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    Iridium.grant(player, 2);
    return undefined;
  }
}
