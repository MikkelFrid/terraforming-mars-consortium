import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Terrain} from '../../consortium/Terrain';
import {Iridium} from '../../consortium/Iridium';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {Size} from '../../../common/cards/render/Size';

export class ImpactGlassWorks extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.IMPACT_GLASS_WORKS,
      tags: [Tag.BUILDING, Tag.SCIENCE],
      cost: 23,
      victoryPoints: 1,

      metadata: {
        cardNumber: 'CN42',
        renderData: CardRenderer.builder((b) => {
          b.iridium(1).slash().emptyTile().asterix().text('(max 4)', {size: Size.SMALL});
        }),
        description:
          'Gain 1 iridium for each crater field tile on Mars, to a maximum of 4. 1 VP.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const count = Math.min(
      Terrain.countCraterFieldTilesOnMars(player),
      BALANCE.IMPACT_GLASS_WORKS_IRIDIUM_CAP);
    Iridium.grant(player, count);
    return undefined;
  }
}
