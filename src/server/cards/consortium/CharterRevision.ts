import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class CharterRevision extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CHARTER_REVISION,
      tags: [Tag.EARTH, Tag.SCIENCE],
      cost: 24,
      victoryPoints: 1,

      behavior: {
        drawCard: 3,
        production: {megacredits: 1},
      },

      metadata: {
        cardNumber: 'CN53',
        renderData: CardRenderer.builder((b) => {
          b.cards(3, {digit}).production((pb) => pb.megacredits(1));
        }),
        description: 'Draw 3 cards. Gain 1 M€ production. 1 VP.',
      },
    });
  }
}
