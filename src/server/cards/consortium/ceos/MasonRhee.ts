import {CardName} from '../../../../common/cards/CardName';
import {IPlayer} from '../../../IPlayer';
import {PlayerInput} from '../../../PlayerInput';
import {CardRenderer} from '../../render/CardRenderer';
import {CeoCard} from '../../ceos/CeoCard';
import {Tag} from '../../../../common/cards/Tag';

export class MasonRhee extends CeoCard {
  constructor() {
    super({
      name: CardName.MASON_RHEE,
      metadata: {
        cardNumber: 'CNL4',
        renderData: CardRenderer.builder((b) => {
          b.opgArrow().cards(3, {secondaryTag: Tag.STRUCTURE}).asterix();
        }),
        description:
          'Once per game, draw 3 cards with a Structure tag and keep 2 of them.',
      },
    });
  }

  public override canAct(player: IPlayer): boolean {
    return super.canAct(player) && player.game.projectDeck.canDraw(3);
  }

  public action(player: IPlayer): PlayerInput | undefined {
    this.isDisabled = true;
    player.drawCardKeepSome(3, {keepMax: 2, tag: Tag.STRUCTURE});
    return undefined;
  }
}
