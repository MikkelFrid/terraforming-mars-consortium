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
import {digit} from '../Options';

export class ImpactBasinClaim extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.IMPACT_BASIN_CLAIM,
      tags: [Tag.PROSPECTING, Tag.BUILDING],
      cost: 14,

      behavior: {
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CN06',
        renderData: CardRenderer.builder((b) => {
          b.tile(TileType.IMPACT_BASIN_CLAIM, true).asterix().iridium(2, {digit});
        }),
        description: 'Place this tile on a crater field. Gain 2 iridium.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions): Array<Space> {
    return player.game.board.getAvailableSpacesOnLand(player, canAffordOptions)
      .filter((space) => space.spaceType === SpaceType.CRATER_FIELD);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    return this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    // No-op when the board has no crater fields (e.g. Tharsis RW sweep).
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.IMPACT_BASIN_CLAIM, card: this.name},
        on: () => spaces,
        title: 'Select crater field for Impact Basin Claim',
      }));
    return undefined;
  }
}
