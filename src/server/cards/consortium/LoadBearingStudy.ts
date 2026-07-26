import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class LoadBearingStudy extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.LOAD_BEARING_STUDY,
      tags: [Tag.STRUCTURE, Tag.SCIENCE],
      cost: 27,
      victoryPoints: 1,

      behavior: {
        drawCard: 3,
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CN22',
        renderData: CardRenderer.builder((b) => {
          b.cards(3).iridium(2, {digit});
        }),
        description: 'Draw 3 cards. Gain 2 iridium.',
      },
    });
  }
}
