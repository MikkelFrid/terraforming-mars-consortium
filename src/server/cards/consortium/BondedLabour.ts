import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';
import {Megastructures} from '../../consortium/Megastructures';
import {digit} from '../Options';

export class BondedLabour extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.BONDED_LABOUR,
      tags: [Tag.STRUCTURE, Tag.EARTH],
      cost: 15,

      metadata: {
        cardNumber: 'CN15',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(4, {digit}).slash().text('MS');
        }),
        description: 'Gain 4 M€ for each megastructure you have contributed to.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const count = Megastructures.countStructuresContributed(player);
    player.stock.add(Resource.MEGACREDITS, count * 4, {log: true});
    return undefined;
  }
}
