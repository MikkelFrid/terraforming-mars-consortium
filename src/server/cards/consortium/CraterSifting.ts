import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Terrain} from '../../consortium/Terrain';
import {Iridium} from '../../consortium/Iridium';
import {digit} from '../Options';

export class CraterSifting extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CRATER_SIFTING,
      tags: [Tag.PROSPECTING, Tag.BUILDING],
      cost: 7,

      metadata: {
        cardNumber: 'CN35',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit});
        }),
        description: 'Requires that you own a tile on a crater field. Gain 2 iridium.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Terrain.ownsCraterTile(player);
  }

  public override bespokePlay(player: IPlayer) {
    Iridium.grant(player, 2);
    return undefined;
  }
}
