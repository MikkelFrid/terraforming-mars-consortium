import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {PlaceCityTile} from '../../deferredActions/PlaceCityTile';
import {Terrain} from '../../consortium/Terrain';
import {SpaceType} from '../../../common/boards/SpaceType';

export class RimwallHabitat extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.RIMWALL_HABITAT,
      tags: [Tag.BUILDING, Tag.CITY],
      cost: 26,
      victoryPoints: 1,

      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'CN43',
        renderData: CardRenderer.builder((b) => {
          b.city().asterix().production((pb) => pb.megacredits(2));
        }),
        description:
          'Requires that you own a tile on a highland space. ' +
          'Place a city tile on a highland space. Increase your M€ production 2 steps. 1 VP.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return player.game.board.getAvailableSpacesForCity(player, canAffordOptions)
      .filter((space) => space.spaceType === SpaceType.HIGHLAND);
  }

  public override bespokeCanPlay(player: IPlayer, canAffordOptions: CanAffordOptions): boolean {
    return Terrain.ownsHighlandTile(player) &&
      this.availableSpaces(player, canAffordOptions).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(new PlaceCityTile(player, {
      title: 'Select highland for Rimwall Habitat',
      spaces,
    }));
    return undefined;
  }
}
