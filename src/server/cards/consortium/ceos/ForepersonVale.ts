import {CardName} from '../../../../common/cards/CardName';
import {IPlayer} from '../../../IPlayer';
import {PlayerInput} from '../../../PlayerInput';
import {CardRenderer} from '../../render/CardRenderer';
import {CeoCard} from '../../ceos/CeoCard';
import {Megastructures} from '../../../consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

export class ForepersonVale extends CeoCard {
  constructor() {
    super({
      name: CardName.FOREPERSON_VALE,
      metadata: {
        cardNumber: 'CNL1',
        renderData: CardRenderer.builder((b) => {
          b.opgArrow().text('ACTIVATE THE BELOW ABILITY').br;
          b.megacredits(-BALANCE.FOREPERSON_VALE_DISCOUNT, {digit}).asterix();
        }),
        description:
          'Once per game, contribute one megastructure segment with a 5 M€ discount. ' +
          'This does not use your standard action.',
      },
    });
  }

  public override canAct(player: IPlayer): boolean {
    if (!super.canAct(player)) {
      return false;
    }
    // Probe with the discount applied temporarily.
    const prior = player.nextMegastructureSegmentDiscount;
    player.nextMegastructureSegmentDiscount = Math.max(prior, BALANCE.FOREPERSON_VALE_DISCOUNT);
    const can = Megastructures.contributeAction(player) !== undefined;
    player.nextMegastructureSegmentDiscount = prior;
    return can;
  }

  public action(player: IPlayer): PlayerInput | undefined {
    this.isDisabled = true;
    player.nextMegastructureSegmentDiscount = Math.max(
      player.nextMegastructureSegmentDiscount,
      BALANCE.FOREPERSON_VALE_DISCOUNT,
    );
    return Megastructures.contributeAction(player);
  }
}
