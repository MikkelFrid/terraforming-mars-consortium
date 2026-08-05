import {IGlobalEvent} from '../../../turmoil/globalEvents/IGlobalEvent';
import {GlobalEvent} from '../../../turmoil/globalEvents/GlobalEvent';
import {GlobalEventName} from '../../../../common/turmoil/globalEvents/GlobalEventName';
import {PartyName} from '../../../../common/turmoil/PartyName';
import {IGame} from '../../../IGame';
import {Turmoil} from '../../../turmoil/Turmoil';
import {Resource} from '../../../../common/Resource';
import {CardRenderer} from '../../render/CardRenderer';
import {Size} from '../../../../common/cards/render/Size';
import {Iridium} from '../../../consortium/Iridium';

/**
 * Negative GE: drain 1 iridium (returning it to the bank) or 4 M€ if the player
 * has none. Influence reduces the M€ penalty when paying cash instead.
 */
export class IridiumEmbargo extends GlobalEvent implements IGlobalEvent {
  constructor() {
    super({
      name: GlobalEventName.IRIDIUM_EMBARGO,
      description:
        'Lose 1 iridium (returned to the bank). If you have none, lose 4 M€ minus influence.',
      revealedDelegate: PartyName.KELVINISTS,
      currentDelegate: PartyName.REDS,
      renderData: CardRenderer.builder((b) => {
        b.minus().iridium(1).or()
          .minus().megacredits(4).influence({size: Size.SMALL});
      }),
    });
  }

  public resolve(game: IGame, turmoil: Turmoil) {
    game.playersInGenerationOrder.forEach((player) => {
      if (player.iridium > 0) {
        Iridium.spend(player, 1);
      } else {
        const loss = Math.max(0, 4 - turmoil.getInfluence(player));
        if (loss > 0) {
          player.stock.deduct(Resource.MEGACREDITS, loss, {log: true, from: {globalEvent: this}});
        }
      }
    });
  }
}
