import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {SelectPaymentDeferred} from '../../../deferredActions/SelectPaymentDeferred';
import {digit} from '../../Options';

export class AssayBond extends PreludeCard {
  constructor() {
    super({
      name: CardName.ASSAY_BOND,
      tags: [Tag.PROSPECTING],

      startingMegacredits: -5,

      behavior: {
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CNP6',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit}).br;
          b.megacredits(-5);
        }),
        description: 'Gain 2 iridium. Pay 5 M€.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer) {
    return player.canAfford(5);
  }

  public override bespokePlay(player: IPlayer) {
    player.game.defer(new SelectPaymentDeferred(player, -this.startingMegaCredits));
    return undefined;
  }
}
