import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {SelectSpace} from '../../inputs/SelectSpace';
import {Terrain} from '../../consortium/Terrain';
import {Frontier} from '../../consortium/Frontier';

export class TalusReclamation extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.TALUS_RECLAMATION,
      tags: [Tag.BUILDING],
      cost: 21,

      metadata: {
        cardNumber: 'CN41',
        renderData: CardRenderer.builder((b) => {
          b.greenery().asterix();
        }),
        description:
          'Requires at least 1 bridge complete. ' +
          'Place a greenery tile on a space converted from chasm to land. Raise oxygen 1 step.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Terrain.availableFormerChasmGreenerySpaces(player, canAffordOptions);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    return Frontier.countOpenSectors(player.game) >= 1 &&
      this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    return new SelectSpace('Select former chasm for Talus Reclamation greenery', spaces)
      .andThen((space) => {
        player.game.addGreenery(player, space);
        return undefined;
      });
  }
}
