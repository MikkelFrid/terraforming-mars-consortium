import {IProjectCard} from '../IProjectCard';
import {Tag} from '../../../common/cards/Tag';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {digit} from '../Options';

export class CoreSampleSurvey extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.AUTOMATED,
      name: CardName.CORE_SAMPLE_SURVEY,
      tags: [Tag.PROSPECTING],
      cost: 11,

      behavior: {
        iridium: 2,
      },

      metadata: {
        cardNumber: 'CN04',
        renderData: CardRenderer.builder((b) => {
          b.iridium(2, {digit});
        }),
        description: 'Gain 2 iridium.',
      },
    });
  }
}
