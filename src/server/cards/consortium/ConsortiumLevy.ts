import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';
import {digit} from '../Options';

export class ConsortiumLevy extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.CONSORTIUM_LEVY,
      tags: [Tag.EARTH],
      cost: 12,

      metadata: {
        cardNumber: 'CN47',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(2, {digit}).slash().tag(Tag.STRUCTURE);
        }),
        description: 'Gain 2 M€ for each Structure tag you have.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const count = player.tags.count(Tag.STRUCTURE);
    player.stock.add(Resource.MEGACREDITS, count * 2, {log: true});
    return undefined;
  }
}
