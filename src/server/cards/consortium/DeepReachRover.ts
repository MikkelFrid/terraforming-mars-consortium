import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {ActionCard} from '../ActionCard';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Frontier} from '../../consortium/Frontier';

export class DeepReachRover extends ActionCard implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.DEEP_REACH_ROVER,
      tags: [Tag.SCIENCE, Tag.BUILDING],
      cost: 20,

      action: {
        iridium: 1,
      },

      metadata: {
        cardNumber: 'CN31',
        renderData: CardRenderer.builder((b) => {
          b.action('Gain 1 iridium if you own a tile in a frontier zone.', (eb) => {
            eb.empty().startAction.iridium(1).asterix();
          });
        }),
      },
    });
  }

  public override bespokeCanAct(player: IPlayer): boolean {
    return Frontier.countOwnedFrontierTiles(player) > 0 &&
      player.game.iridiumBank > 0;
  }
}
