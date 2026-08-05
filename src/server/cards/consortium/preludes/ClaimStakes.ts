import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {digit} from '../../Options';

export class ClaimStakes extends PreludeCard {
  constructor() {
    super({
      name: CardName.CLAIM_STAKES,
      tags: [Tag.PROSPECTING],

      behavior: {
        iridium: 2,
        drawCard: {count: 2, tag: Tag.PROSPECTING},
      },

      metadata: {
        cardNumber: 'CNP1',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit}).br;
          b.cards(2, {secondaryTag: Tag.PROSPECTING});
        }),
        description:
          'Gain 2 iridium. Reveal cards until you reveal 2 with a Prospecting tag. ' +
          'Take them into hand and discard the rest.',
      },
    });
  }
}
