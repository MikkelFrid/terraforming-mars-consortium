import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Resource} from '../../../common/Resource';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';

export class MineralRights extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.MINERAL_RIGHTS,
      tags: [Tag.PROSPECTING, Tag.EARTH],
      cost: 16,

      metadata: {
        cardNumber: 'CN49',
        renderData: CardRenderer.builder((b) => {
          b.effect('When you gain iridium from a crater field, gain 1 extra M€ per iridium.', (eb) => {
            eb.iridium(1).asterix().startEffect.megacredits(BALANCE.MINERAL_RIGHTS_MC_PER_IRIDIUM);
          });
        }),
      },
    });
  }

  public onCraterIridiumGained(player: IPlayer, amount: number): void {
    player.stock.add(
      Resource.MEGACREDITS,
      amount * BALANCE.MINERAL_RIGHTS_MC_PER_IRIDIUM,
      {log: true});
  }
}
