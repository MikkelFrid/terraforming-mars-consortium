import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {TileType} from '../../../common/TileType';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {PlaceTile} from '../../deferredActions/PlaceTile';
import {Frontier} from '../../consortium/Frontier';
import {digit} from '../Options';

export class ChasmDescent extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CHASM_DESCENT,
      tags: [Tag.BUILDING],
      cost: 14,

      behavior: {
        iridium: 3,
      },

      metadata: {
        cardNumber: 'CN28',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.CHASM_DESCENT, true).asterix().iridium(3, {digit});
        }),
        description:
          'Requires at least 1 bridge complete. ' +
          'Place this tile on a space that was converted from chasm to land. Gain 3 iridium.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Frontier.availableFormerChasmSpaces(player, canAffordOptions);
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
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.CHASM_DESCENT, card: this.name},
        on: () => spaces,
        title: 'Select former chasm for Chasm Descent',
      }));
    return undefined;
  }
}
