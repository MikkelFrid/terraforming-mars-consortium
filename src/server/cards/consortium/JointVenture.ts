import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Megastructures} from '../../consortium/Megastructures';
import {digit} from '../Options';

export class JointVenture extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.JOINT_VENTURE,
      tags: [Tag.EARTH, Tag.STRUCTURE],
      cost: 22,

      behavior: {
        production: {megacredits: 4},
      },

      metadata: {
        cardNumber: 'CN52',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(4, {digit}));
        }),
        description:
          'Requires that you have contributed to at least 1 megastructure. ' +
          'Gain 4 M€ production.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Megastructures.countStructuresContributed(player) >= 1;
  }
}
