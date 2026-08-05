import {CardName} from '../../../../common/cards/CardName';
import {IPlayer} from '../../../IPlayer';
import {PlayerInput} from '../../../PlayerInput';
import {CardRenderer} from '../../render/CardRenderer';
import {CeoCard} from '../../ceos/CeoCard';
import {Iridium} from '../../../consortium/Iridium';
import {SpaceType} from '../../../../common/boards/SpaceType';
import {Board} from '../../../boards/Board';
import {digit} from '../../Options';

const MAX_IRIDIUM = 3;

export class SurveyorKade extends CeoCard {
  constructor() {
    super({
      name: CardName.SURVEYOR_KADE,
      metadata: {
        cardNumber: 'CNL2',
        renderData: CardRenderer.builder((b) => {
          b.opgArrow().iridium(1).slash().text('crater').asterix();
          b.br;
          b.text('max').iridium(MAX_IRIDIUM, {digit});
        }),
        description:
          'Once per game, gain 1 iridium for each crater-field tile you own (max 3).',
      },
    });
  }

  public static ownedCraterCount(player: IPlayer): number {
    return player.game.board.spaces.filter((space) =>
      space.spaceType === SpaceType.CRATER_FIELD &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space)).length;
  }

  public override canAct(player: IPlayer): boolean {
    return super.canAct(player) && SurveyorKade.ownedCraterCount(player) > 0;
  }

  public action(player: IPlayer): PlayerInput | undefined {
    this.isDisabled = true;
    const amount = Math.min(MAX_IRIDIUM, SurveyorKade.ownedCraterCount(player));
    Iridium.grant(player, amount);
    return undefined;
  }
}
