import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {SelectCard} from '../../inputs/SelectCard';
import {Size} from '../../../common/cards/render/Size';
import {oneWayDifference} from '../../../common/utils/utils';
import {LogType, keep} from '../../deferredActions/ChooseCards';

export class AssayRights extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.ASSAY_RIGHTS,
      tags: [Tag.PROSPECTING],
      cost: 9,

      metadata: {
        cardNumber: 'CN03',
        renderData: CardRenderer.builder((b) => {
          b.text('LOOK AT TOP 3', {size: Size.SMALL, uppercase: true}).br;
          b.cards(1, {secondaryTag: Tag.STRUCTURE}).slash()
            .cards(1, {secondaryTag: Tag.PROSPECTING});
        }),
        description:
          'Look at the top 3 cards of the deck. Take 1 card with a Structure or ' +
          'Prospecting tag into hand. Discard the rest.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const revealed = player.game.projectDeck.drawN(player.game, 3);
    if (revealed.length === 0) {
      return undefined;
    }

    player.game.log('${0} looked at the top ${1} card(s)', (b) =>
      b.player(player).number(revealed.length));

    const matching = revealed.filter((card) =>
      player.tags.cardHasTag(card, Tag.STRUCTURE) ||
      player.tags.cardHasTag(card, Tag.PROSPECTING));

    if (matching.length === 0) {
      for (const card of revealed) {
        player.game.projectDeck.discard(card);
      }
      player.game.log('${0} found no Structure or Prospecting cards', (b) => b.player(player));
      return undefined;
    }

    if (matching.length === 1) {
      const taken = matching[0];
      keep(player, [taken], oneWayDifference(revealed, [taken]), LogType.DREW_VERBOSE);
      return undefined;
    }

    return new SelectCard(
      'Select a Structure or Prospecting card to take into hand',
      'Take',
      matching,
      {min: 1, max: 1})
      .andThen(([selected]) => {
        keep(player, [selected], oneWayDifference(revealed, [selected]), LogType.DREW_VERBOSE);
        return undefined;
      });
  }
}
