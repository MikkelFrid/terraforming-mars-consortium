import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Terrain} from '../../consortium/Terrain';

export class HighlandTerrace extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.HIGHLAND_TERRACE,
      tags: [Tag.BUILDING, Tag.PLANT],
      cost: 11,

      behavior: {
        production: {plants: 1},
        stock: {plants: 1},
      },

      metadata: {
        cardNumber: 'CN36',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.plants(1)).plants(1);
        }),
        description:
          'Requires that you own a tile on a highland space. ' +
          'Increase your plant production 1 step. Gain 1 plant.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Terrain.ownsHighlandTile(player);
  }
}
