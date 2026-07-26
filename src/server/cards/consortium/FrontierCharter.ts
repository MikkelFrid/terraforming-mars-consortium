import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Frontier} from '../../consortium/Frontier';
import {questionmark} from '../render/DynamicVictoryPoints';

export class FrontierCharter extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.FRONTIER_CHARTER,
      tags: [Tag.EARTH],
      cost: 28,
      victoryPoints: 'special',

      metadata: {
        cardNumber: 'CN34',
        renderData: CardRenderer.builder((b) => {
          b.vpText('1 VP per 2 tiles you own in frontier zones.');
        }),
        victoryPoints: questionmark(),
      },
    });
  }

  public override getVictoryPoints(player: IPlayer): number {
    return Math.floor(Frontier.countOwnedFrontierTiles(player) / 2);
  }
}
