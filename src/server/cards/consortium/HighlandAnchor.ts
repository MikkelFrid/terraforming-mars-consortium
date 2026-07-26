import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {TileType} from '../../../common/TileType';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {PlaceTile} from '../../deferredActions/PlaceTile';
import {Space} from '../../boards/Space';
import {SpaceType} from '../../../common/boards/SpaceType';
import {Board} from '../../boards/Board';
import {digit} from '../Options';

export class HighlandAnchor extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.HIGHLAND_ANCHOR,
      tags: [Tag.STRUCTURE, Tag.BUILDING],
      cost: 17,

      behavior: {
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CN16',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.HIGHLAND_ANCHOR, true).asterix().iridium(2, {digit});
        }),
        description:
          'Requires that you own a tile on a highland space. ' +
          'Place this tile on a highland space. Gain 2 iridium.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => space.spaceType === SpaceType.HIGHLAND);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    const ownsHighland = player.game.board.spaces.some((space) =>
      space.spaceType === SpaceType.HIGHLAND &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space));
    return ownsHighland && this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.HIGHLAND_ANCHOR, card: this.name},
        on: () => spaces,
        title: 'Select highland for Highland Anchor',
      }));
    return undefined;
  }
}
