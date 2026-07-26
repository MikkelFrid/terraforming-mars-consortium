import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Frontier} from '../../consortium/Frontier';

export class WayfarerCompact extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.WAYFARER_COMPACT,
      tags: [Tag.EARTH],
      cost: 25,
      victoryPoints: 1,

      behavior: {
        production: {megacredits: 3},
      },

      metadata: {
        cardNumber: 'CN33',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(3));
        }),
        description: 'Requires 2 open frontier sectors. Increase your M€ production 3 steps.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Frontier.countOpenSectors(player.game) >= 2;
  }
}
