import {CardName} from '../../../../common/cards/CardName';
import {IPlayer} from '../../../IPlayer';
import {PlayerInput} from '../../../PlayerInput';
import {CardRenderer} from '../../render/CardRenderer';
import {CeoCard} from '../../ceos/CeoCard';

/**
 * One-generation Siderite lite: while opgActionIsActive, Player.paymentOptionsForCard
 * allows iridium on any card. Cleared automatically in Player.finishProductionPhase.
 */
export class Rackham extends CeoCard {
  constructor() {
    super({
      name: CardName.RACKHAM,
      metadata: {
        cardNumber: 'CNL3',
        renderData: CardRenderer.builder((b) => {
          b.opgArrow().text('THIS GENERATION').br;
          b.iridium(1).asterix();
        }),
        description:
          'Once per game, for the rest of this generation you may spend iridium on any card, ' +
          'not only cards with a Structure or Prospecting tag.',
      },
    });
  }

  public action(_player: IPlayer): PlayerInput | undefined {
    this.isDisabled = true;
    this.opgActionIsActive = true;
    return undefined;
  }
}
