import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';
import {Iridium} from '../../../consortium/Iridium';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

/**
 * Permanent megastructure segment discount (stacks with Site Foreman / Scaffold Yard,
 * floored at 0 in Megastructures.effectiveSegmentCostMc). Keystone placement → +1 M€ prod.
 */
export class KeystoneConsortium extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.KEYSTONE_CONSORTIUM,
      tags: [Tag.STRUCTURE, Tag.EARTH],
      startingMegaCredits: 44,

      metadata: {
        cardNumber: 'CNC2',
        description: 'You start with 44 M€ and 2 iridium.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(44).nbsp.iridium(2, {digit});
          b.corpBox('effect', (ce) => {
            ce.effect('Your megastructure segments cost 3 M€ less.', (eb) => {
              eb.megastructureSegment().startEffect.megacredits(-BALANCE.KEYSTONE_CONSORTIUM_DISCOUNT, {digit});
            });
            ce.effect('When you place a keystone segment, increase your M€ production 1 step.', (eb) => {
              eb.keystoneSegment().startEffect.production((pb) => pb.megacredits(1));
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
