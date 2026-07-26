import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {digit} from '../Options';

export class ScaffoldYard extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.SCAFFOLD_YARD,
      tags: [Tag.STRUCTURE, Tag.BUILDING],
      cost: 8,

      metadata: {
        cardNumber: 'CN11',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(-BALANCE.SCAFFOLD_YARD_DISCOUNT, {digit}).asterix();
        }),
        description:
          `Your next megastructure segment this generation costs ${BALANCE.SCAFFOLD_YARD_DISCOUNT} M€ less.`,
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    player.nextMegastructureSegmentDiscount = BALANCE.SCAFFOLD_YARD_DISCOUNT;
    return undefined;
  }
}
