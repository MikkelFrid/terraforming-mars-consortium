import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {PlaceCityTile} from '../../../deferredActions/PlaceCityTile';
import {SpaceType} from '../../../../common/boards/SpaceType';
import {Space} from '../../../boards/Space';
import {Iridium} from '../../../consortium/Iridium';
import {Resource} from '../../../../common/Resource';
import {digit} from '../../Options';

/**
 * Prefer placing a city on a crater field (terrain grants 1 iridium on claim).
 * If no crater is available, fall back to 1 iridium + 3 M€.
 */
export class CraterLease extends PreludeCard {
  constructor() {
    super({
      name: CardName.CRATER_LEASE,
      tags: [Tag.PROSPECTING, Tag.CITY],

      metadata: {
        cardNumber: 'CNP4',
        renderData: CardRenderer.builder((b) => {
          b.city().asterix().or().iridium(1).megacredits(3, {digit});
        }),
        description:
          'Place a city on a crater field. ' +
          'If you cannot, gain 1 iridium and 3 M€ instead.',
      },
    });
  }

  private availableSpaces(player: IPlayer): Array<Space> {
    return player.game.board.getAvailableSpacesForCity(player)
      .filter((space) => space.spaceType === SpaceType.CRATER_FIELD);
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = this.availableSpaces(player);
    if (spaces.length === 0) {
      Iridium.grant(player, 1);
      player.stock.add(Resource.MEGACREDITS, 3, {log: true});
      return undefined;
    }
    player.game.defer(new PlaceCityTile(player, {
      spaces,
      title: 'Select crater field for Crater Lease city',
    }));
    return undefined;
  }
}
