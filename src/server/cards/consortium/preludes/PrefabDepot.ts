import {Tag} from '../../../../common/cards/Tag';
import {PreludeCard} from '../../prelude/PreludeCard';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {IPlayer} from '../../../IPlayer';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

export class PrefabDepot extends PreludeCard {
  constructor() {
    super({
      name: CardName.PREFAB_DEPOT,
      tags: [Tag.STRUCTURE, Tag.BUILDING],

      behavior: {
        stock: {steel: 4},
        drawCard: {count: 1, tag: Tag.STRUCTURE},
      },

      metadata: {
        cardNumber: 'CNP8',
        renderData: CardRenderer.builder((b) => {
          b.steel(4, {digit}).cards(1, {secondaryTag: Tag.STRUCTURE}).br;
          b.megacredits(-BALANCE.PREFAB_DEPOT_DISCOUNT, {digit}).asterix();
        }),
        description:
          'Gain 4 steel. Reveal cards until you reveal 1 with a Structure tag and take it into hand. ' +
          'Your next megastructure segment this generation costs 3 M€ less.',
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    player.nextMegastructureSegmentDiscount = Math.max(
      player.nextMegastructureSegmentDiscount,
      BALANCE.PREFAB_DEPOT_DISCOUNT,
    );
    return undefined;
  }
}
