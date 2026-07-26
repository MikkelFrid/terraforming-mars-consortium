import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class IridiumCartel extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.IRIDIUM_CARTEL,
      tags: [Tag.PROSPECTING, Tag.EARTH],
      cost: 24,
      victoryPoints: {tag: Tag.PROSPECTING, per: 2},

      requirements: {tag: Tag.PROSPECTING, count: 2},

      behavior: {
        iridium: 3,
      },

      metadata: {
        cardNumber: 'CN10',
        renderData: CardRenderer.builder((b) => {
          b.iridium(3, {digit}).br;
          b.vpText('1 VP per 2 Prospecting tags you have, including this.');
        }),
        description: 'Requires 2 Prospecting tags. Gain 3 iridium.',
      },
    });
  }
}
