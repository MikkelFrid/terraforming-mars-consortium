import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {SelectCard} from '../../inputs/SelectCard';
import {oneWayDifference} from '../../../common/utils/utils';
import {LogType, keep} from '../../deferredActions/ChooseCards';

export class SurveyStake extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.SURVEY_STAKE,
      tags: [Tag.STRUCTURE],
      cost: 10,

      metadata: {
        cardNumber: 'CN12',
        renderData: CardRenderer.builder((b) => {
          b.cards(2).asterix();
        }),
        description: 'Draw 2 cards. Keep 1 card with a Structure tag, discard the other.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const drawn = player.game.projectDeck.drawN(player.game, 2);
    if (drawn.length === 0) {
      return undefined;
    }
    const matching = drawn.filter((card) => player.tags.cardHasTag(card, Tag.STRUCTURE));
    if (matching.length === 0) {
      for (const card of drawn) {
        player.game.projectDeck.discard(card);
      }
      return undefined;
    }
    if (matching.length === 1) {
      keep(player, [matching[0]], oneWayDifference(drawn, [matching[0]]), LogType.DREW_VERBOSE);
      return undefined;
    }
    return new SelectCard(
      'Select a Structure card to keep',
      'Keep',
      matching,
      {min: 1, max: 1})
      .andThen(([selected]) => {
        keep(player, [selected], oneWayDifference(drawn, [selected]), LogType.DREW_VERBOSE);
        return undefined;
      });
  }
}
