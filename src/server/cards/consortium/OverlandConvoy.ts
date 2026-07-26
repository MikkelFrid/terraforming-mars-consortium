import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';
import {Frontier} from '../../consortium/Frontier';
import {digit} from '../Options';

export class OverlandConvoy extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.OVERLAND_CONVOY,
      tags: [Tag.SPACE],
      cost: 16,

      metadata: {
        cardNumber: 'CN29',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(2, {digit}).slash().text('FRONTIER');
        }),
        description: 'Gain 2 M€ for each tile you own in a frontier zone.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const count = Frontier.countOwnedFrontierTiles(player);
    player.stock.add(Resource.MEGACREDITS, count * 2, {log: true});
    return undefined;
  }
}
