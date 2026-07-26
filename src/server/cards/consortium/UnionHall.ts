import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';
import {Megastructures} from '../../consortium/Megastructures';

export class UnionHall extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.UNION_HALL,
      tags: [Tag.STRUCTURE, Tag.BUILDING, Tag.CITY],
      cost: 24,

      behavior: {
        city: {},
      },

      metadata: {
        cardNumber: 'CN20',
        renderData: CardRenderer.builder((b) => {
          b.city().production((pb) => pb.megacredits(1)).slash().text('MS*');
        }),
        description:
          'Place a city tile. Increase your M€ production 1 step for each ' +
          'megastructure in play that is already complete.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const completed = Megastructures.countCompleted(player.game);
    if (completed > 0) {
      player.production.add(Resource.MEGACREDITS, completed, {log: true});
    }
    return undefined;
  }
}
