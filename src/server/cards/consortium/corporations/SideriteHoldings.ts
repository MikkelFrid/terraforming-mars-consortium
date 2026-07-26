import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';
import {Iridium} from '../../../consortium/Iridium';
import {digit} from '../../Options';

/**
 * Lifts the Structure/Prospecting iridium payment gate for this player only
 * (see Player.paymentOptionsForCard).
 */
export class SideriteHoldings extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.SIDERITE_HOLDINGS,
      tags: [Tag.PROSPECTING, Tag.EARTH],
      startingMegaCredits: 38,

      metadata: {
        cardNumber: 'CNC1',
        description: 'You start with 38 M€ and 4 iridium.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(38).nbsp.iridium(4, {digit});
          b.corpBox('effect', (ce) => {
            ce.effect('You may spend iridium on any card, not only cards with a Structure or Prospecting tag.', (eb) => {
              eb.empty().startEffect.iridium(1).asterix();
            });
          });
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    Iridium.grant(player, 4);
    return undefined;
  }
}
