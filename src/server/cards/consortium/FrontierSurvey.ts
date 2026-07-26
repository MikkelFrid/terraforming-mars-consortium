import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Frontier} from '../../consortium/Frontier';

export class FrontierSurvey extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.FRONTIER_SURVEY,
      tags: [Tag.SCIENCE],
      cost: 9,

      metadata: {
        cardNumber: 'CN26',
        renderData: CardRenderer.builder((b) => {
          b.cards(1).plus().cards(1).slash().text('OPEN');
        }),
        description: 'Draw 1 card. Draw 1 additional card for each open frontier sector.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const draw = 1 + Frontier.countOpenSectors(player.game);
    player.drawCard(draw);
    return undefined;
  }
}
