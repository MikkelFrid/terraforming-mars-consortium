import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {PlaceCityTile} from '../../../deferredActions/PlaceCityTile';
import {SpaceType} from '../../../../common/boards/SpaceType';
import {Space} from '../../../boards/Space';

export class MassifDeed extends PreludeCard {
  constructor() {
    super({
      name: CardName.MASSIF_DEED,
      tags: [Tag.BUILDING, Tag.CITY],

      behavior: {
        production: {megacredits: 1},
      },

      metadata: {
        cardNumber: 'CNP7',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.megacredits(1)).city().asterix();
        }),
        description: 'Increase your M€ production 1 step. Place a city adjacent to a highland space.',
      },
    });
  }

  private availableSpaces(player: IPlayer): Array<Space> {
    const board = player.game.board;
    return board.getAvailableSpacesForCity(player)
      .filter((space) => board.getAdjacentSpaces(space)
        .some((adj) => adj.spaceType === SpaceType.HIGHLAND));
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return this.availableSpaces(player).length > 0;
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(new PlaceCityTile(player, {
      spaces,
      title: 'Select space adjacent to highland for Massif Deed',
    }));
    return undefined;
  }
}
