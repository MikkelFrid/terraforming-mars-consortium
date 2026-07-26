import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {CanAffordOptions, IPlayer} from '../../IPlayer';
import {PlaceCityTile} from '../../deferredActions/PlaceCityTile';
import {Frontier} from '../../consortium/Frontier';

export class FarSideBoomtown extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.FAR_SIDE_BOOMTOWN,
      tags: [Tag.BUILDING, Tag.CITY],
      cost: 23,
      victoryPoints: 1,

      behavior: {
        production: {megacredits: 2},
      },

      metadata: {
        cardNumber: 'CN32',
        renderData: CardRenderer.builder((b) => {
          b.city().asterix().production((pb) => pb.megacredits(2));
        }),
        description:
          'Requires at least 1 open frontier sector. ' +
          'Place a city tile on a frontier space. Increase your M€ production 2 steps.',
      },
    });
  }

  private availableSpaces(player: IPlayer, canAffordOptions?: CanAffordOptions) {
    return player.game.board.getAvailableSpacesForCity(player, canAffordOptions)
      .filter((space) => Frontier.isFrontierSpace(space) && space.locked !== true);
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
    player.game.defer(new PlaceCityTile(player, {
      title: 'Select frontier space for Far Side Boomtown',
      spaces,
    }));
    return undefined;
  }
}
