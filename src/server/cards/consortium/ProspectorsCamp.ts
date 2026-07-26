import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Board} from '../../boards/Board';
import {SpaceType} from '../../../common/boards/SpaceType';
import {Iridium} from '../../consortium/Iridium';

export class ProspectorsCamp extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.PROSPECTORS_CAMP,
      tags: [Tag.PROSPECTING, Tag.BUILDING],
      cost: 18,

      metadata: {
        cardNumber: 'CN08',
        renderData: CardRenderer.builder((b) => {
          b.iridium(1).slash().emptyTile().asterix();
        }),
        description: 'Gain 1 iridium for each crater field tile you own.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const count = player.game.board.spaces.filter((space) =>
      Board.ownedBy(player)(space) &&
      space.spaceType === SpaceType.CRATER_FIELD &&
      space.tile !== undefined).length;
    Iridium.grant(player, count);
    return undefined;
  }
}
