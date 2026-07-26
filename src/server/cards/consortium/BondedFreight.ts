import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Iridium} from '../../consortium/Iridium';
import {Resource} from '../../../common/Resource';

export class BondedFreight extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.BONDED_FREIGHT,
      tags: [Tag.SPACE, Tag.EARTH],
      cost: 10,

      metadata: {
        cardNumber: 'CN46',
        renderData: CardRenderer.builder((b) => {
          b.titanium(1).iridium(1);
        }),
        description: 'Gain 1 titanium and 1 iridium.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    player.stock.add(Resource.TITANIUM, 1, {log: true});
    Iridium.grant(player, 1);
    return undefined;
  }
}
