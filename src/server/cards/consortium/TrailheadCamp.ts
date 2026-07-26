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

export class TrailheadCamp extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.TRAILHEAD_CAMP,
      tags: [Tag.BUILDING],
      cost: 6,

      metadata: {
        cardNumber: 'CN25',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.TRAILHEAD_CAMP, true).asterix();
        }),
        description: 'Place this tile on any frontier space you may legally place on.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Frontier.availableFrontierSpaces(player, canAffordOptions);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    return this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.TRAILHEAD_CAMP, card: this.name},
        on: () => spaces,
        title: 'Select frontier space for Trailhead Camp',
      }));
    return undefined;
  }
}
