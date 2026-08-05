import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';

export class RimSurvey extends PreludeCard {
  constructor() {
    super({
      name: CardName.RIM_SURVEY,
      tags: [Tag.PROSPECTING],

      metadata: {
        cardNumber: 'CNP5',
        renderData: CardRenderer.builder((b) => {
          b.cards(1, {secondaryTag: Tag.STRUCTURE}).cards(1, {secondaryTag: Tag.PROSPECTING});
        }),
        description:
          'Reveal cards until you reveal 1 with a Structure tag and 1 with a Prospecting tag. ' +
          'Take them into hand and discard the rest.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    player.drawCard(1, {tag: Tag.STRUCTURE});
    player.drawCard(1, {tag: Tag.PROSPECTING});
    return undefined;
  }
}
