import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Terrain} from '../../consortium/Terrain';
import {questionmark} from '../render/DynamicVictoryPoints';

export class LedgerOfClaims extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.LEDGER_OF_CLAIMS,
      tags: [Tag.EARTH, Tag.STRUCTURE],
      cost: 30,
      victoryPoints: 'special',

      metadata: {
        cardNumber: 'CN55',
        renderData: CardRenderer.builder((b) => {
          b.vpText(
            '1 VP per 3 tiles you own on crater fields, highland spaces or in frontier zones.');
        }),
        victoryPoints: questionmark(),
      },
    });
  }

  public override getVictoryPoints(player: IPlayer): number {
    return Math.floor(Terrain.countOwnedTerrainClaimTiles(player) / 3);
  }
}
