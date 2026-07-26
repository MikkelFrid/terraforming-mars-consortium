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
import {digit} from '../Options';

export class PlateauReservoir extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.PLATEAU_RESERVOIR,
      tags: [Tag.BUILDING],
      cost: 19,

      requirements: {oceans: 3},

      behavior: {
        production: {plants: 2},
      },

      metadata: {
        cardNumber: 'CN40',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.PLATEAU_RESERVOIR, true).asterix().production((pb) => pb.plants(2, {digit}));
        }),
        description:
          'Requires 3 oceans on Mars. Place this tile on a highland space. ' +
          'Increase your plant production 2 steps.',
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
        tile: {tileType: TileType.PLATEAU_RESERVOIR, card: this.name},
        on: () => spaces,
        title: 'Select highland for Plateau Reservoir',
      }));
    return undefined;
  }
}
