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
import {digit} from '../Options';

/**
 * Prospecting science card. Deliberately has NO building tag — Robotic Workforce
 * must not copy anything here, and there is no iridium production slot.
 * Recurring gain uses onGenerationStart (same timing as Mohole contributor iridium).
 */
export class SiderophileExtraction extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.SIDEROPHILE_EXTRACTION,
      tags: [Tag.PROSPECTING, Tag.SCIENCE],
      cost: 32,
      victoryPoints: 2,

      behavior: {
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CN01',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit}).br;
          b.iridium(1).asterix().br;
        }),
        description:
          'Requires that you own a tile on a crater field. Gain 2 iridium. ' +
          'At the start of each generation, gain 1 iridium if the bank has any.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return player.game.board.spaces.some((space) =>
      Board.ownedBy(player)(space) &&
      space.spaceType === SpaceType.CRATER_FIELD &&
      space.tile !== undefined);
  }

  public onGenerationStart(player: IPlayer): void {
    if (player.game.iridiumBank <= 0) {
      return;
    }
    Iridium.grant(player, 1);
  }
}
