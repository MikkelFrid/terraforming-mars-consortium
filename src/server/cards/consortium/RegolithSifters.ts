import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class RegolithSifters extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.REGOLITH_SIFTERS,
      tags: [Tag.PROSPECTING, Tag.BUILDING],
      cost: 16,

      behavior: {
        production: {steel: 1},
        iridium: 1,
      },

      metadata: {
        cardNumber: 'CN07',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.steel(1)).iridium(1);
        }),
        description: 'Increase your steel production 1 step. Gain 1 iridium.',
      },
    });
  }
}
