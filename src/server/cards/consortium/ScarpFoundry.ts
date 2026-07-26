import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Terrain} from '../../consortium/Terrain';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {digit} from '../Options';

/**
 * Effect: megastructure segments may be paid with steel at SCARP_FOUNDRY_STEEL_VALUE
 * instead of the default 2. Applied via Player.getMegastructureSteelValue().
 */
export class ScarpFoundry extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SCARP_FOUNDRY,
      tags: [Tag.BUILDING, Tag.STRUCTURE],
      cost: 17,

      metadata: {
        cardNumber: 'CN39',
        renderData: CardRenderer.builder((b) => {
          b.effect('Your megastructure segments may be paid with steel at 3 M€ per steel instead of 2.', (eb) => {
            eb.steel(1).startEffect.megacredits(BALANCE.SCARP_FOUNDRY_STEEL_VALUE, {digit});
          });
        }),
        description: 'Requires that you own a tile on a highland space.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Terrain.ownsHighlandTile(player);
  }
}
