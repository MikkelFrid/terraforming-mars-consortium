import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';

/**
 * Structure and Prospecting tags count double for card requirements only
 * (TagCardRequirement). Scoring / awards / milestones use raw counts.
 */
export class CharterSyndicate extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.CHARTER_SYNDICATE,
      tags: [Tag.EARTH, Tag.STRUCTURE],
      startingMegaCredits: 36,

      metadata: {
        cardNumber: 'CNC6',
        description: 'You start with 36 M€.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(36);
          b.corpBox('effect', (ce) => {
            ce.effect(
              'Each Structure and Prospecting tag you have counts as 2 when meeting card requirements, but not for scoring.',
              (eb) => {
                eb.tag(Tag.STRUCTURE).slash().tag(Tag.PROSPECTING).startEffect.text('x2');
              });
          });
        }),
      },
    });
  }
}
