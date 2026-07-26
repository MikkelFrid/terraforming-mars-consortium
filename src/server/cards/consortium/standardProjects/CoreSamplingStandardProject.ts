import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {StandardProjectCard} from '../../StandardProjectCard';
import {CORE_SAMPLING_COST} from '../../../../common/constants';
import {Iridium} from '../../../consortium/Iridium';

/**
 * Pay M€ to receive 1 iridium from the shared bank, if any remains.
 * Not a project card — registered only under standardProjects.
 */
export class CoreSamplingStandardProject extends StandardProjectCard {
  constructor(properties = {
    name: CardName.CORE_SAMPLING_STANDARD_PROJECT,
    cost: CORE_SAMPLING_COST,

    metadata: {
      cardNumber: '',
      renderData: CardRenderer.builder((b) =>
        b.standardProject(
          `Spend ${CORE_SAMPLING_COST} M€ to gain 1 iridium from the bank (if any remains).`,
          (eb) => {
            eb.megacredits(CORE_SAMPLING_COST).startAction.iridium(1);
          }),
      ),
    },
  }) {
    super(properties);
  }

  public override canAct(player: IPlayer): boolean {
    if (player.game.iridiumBank <= 0) {
      return false;
    }
    return super.canAct(player);
  }

  actionEssence(player: IPlayer): void {
    Iridium.grant(player, 1);
  }
}
