import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';

export class MonumentFinancing extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.MONUMENT_FINANCING,
      tags: [Tag.STRUCTURE, Tag.EARTH],
      cost: 33,
      victoryPoints: {tag: Tag.STRUCTURE, per: 3},

      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'CN24',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(2)).br;
          b.vpText('1 VP per 3 Structure tags you have, including this.');
        }),
        description: 'Increase your M€ production 2 steps.',
      },
    });
  }
}
