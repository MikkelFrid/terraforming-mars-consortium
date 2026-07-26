import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {TileType} from '../../../common/TileType';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {PlaceTile} from '../../deferredActions/PlaceTile';
import {Terrain} from '../../consortium/Terrain';

export class BasaltQuarry extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.BASALT_QUARRY,
      tags: [Tag.BUILDING],
      cost: 13,

      behavior: {
        production: {steel: 1},
      },

      metadata: {
        cardNumber: 'CN37',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.BASALT_QUARRY, true).asterix().production((pb) => pb.steel(1));
        }),
        description: 'Place this tile on a highland space. Increase your steel production 1 step.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Terrain.availableHighlandSpaces(player, canAffordOptions);
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
        tile: {tileType: TileType.BASALT_QUARRY, card: this.name},
        on: () => spaces,
        title: 'Select highland for Basalt Quarry',
      }));
    return undefined;
  }
}
