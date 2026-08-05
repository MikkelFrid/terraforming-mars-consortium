import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {PlaceCityTile} from '../../../deferredActions/PlaceCityTile';
import {SpaceType} from '../../../../common/boards/SpaceType';
import {Space} from '../../../boards/Space';

export class HighlandGrant extends PreludeCard {
  constructor() {
    super({
      name: CardName.HIGHLAND_GRANT,
      tags: [Tag.STRUCTURE, Tag.BUILDING, Tag.CITY],

      behavior: {
        production: {steel: 1},
      },

      metadata: {
        cardNumber: 'CNP3',
        renderData: CardRenderer.builder((b) => {
          b.production((pb) => pb.steel(1)).city().asterix();
        }),
        description: 'Increase your steel production 1 step. Place a city on a highland space.',
      },
    });
  }

  private availableSpaces(player: IPlayer): Array<Space> {
    return player.game.board.getAvailableSpacesForCity(player)
      .filter((space) => space.spaceType === SpaceType.HIGHLAND);
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
      title: 'Select highland for Highland Grant city',
    }));
    return undefined;
  }
}
