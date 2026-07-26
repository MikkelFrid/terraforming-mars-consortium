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
import {Iridium} from '../../consortium/Iridium';
import {Resource} from '../../../common/Resource';
import {digit} from '../Options';

export class EjectaBlanket extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.EJECTA_BLANKET,
      tags: [Tag.BUILDING],
      cost: 15,

      metadata: {
        cardNumber: 'CN38',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.EJECTA_BLANKET, true).asterix().steel(2, {digit}).iridium(1);
        }),
        description:
          'Place this tile adjacent to a crater field. Gain 2 steel and 1 iridium.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Terrain.availableSpacesAdjacentToCrater(player, canAffordOptions);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    return this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    player.stock.add(Resource.STEEL, 2, {log: true});
    Iridium.grant(player, 1);
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.EJECTA_BLANKET, card: this.name},
        on: () => spaces,
        title: 'Select space adjacent to a crater field for Ejecta Blanket',
      }));
    return undefined;
  }
}
