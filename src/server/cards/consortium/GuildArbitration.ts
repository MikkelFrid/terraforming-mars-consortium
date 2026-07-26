import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class GuildArbitration extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.GUILD_ARBITRATION,
      tags: [Tag.EARTH],
      cost: 27,
      victoryPoints: 2,

      requirements: {tag: Tag.EARTH, count: 3},

      behavior: {
        stock: {megacredits: 8},
      },

      metadata: {
        cardNumber: 'CN54',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(8, {digit});
        }),
        description: 'Requires 3 Earth tags. Gain 8 M€. 2 VP.',
      },
    });
  }
}
