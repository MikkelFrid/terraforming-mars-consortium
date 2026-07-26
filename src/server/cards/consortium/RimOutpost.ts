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

export class RimOutpost extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.RIM_OUTPOST,
      tags: [Tag.BUILDING],
      cost: 12,

      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'CN27',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.RIM_OUTPOST, true).asterix().production((pb) => pb.megacredits(2));
        }),
        description:
          'Requires at least 1 open frontier sector. ' +
          'Place this tile on a frontier space. Increase your M€ production 2 steps.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return Frontier.availableFrontierSpaces(player, canAffordOptions);
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
        tile: {tileType: TileType.RIM_OUTPOST, card: this.name},
        on: () => spaces,
        title: 'Select frontier space for Rim Outpost',
      }));
    return undefined;
  }
}
