import {IGlobalEvent} from '../../../turmoil/globalEvents/IGlobalEvent';
import {GlobalEvent} from '../../../turmoil/globalEvents/GlobalEvent';
import {GlobalEventName} from '../../../../common/turmoil/globalEvents/GlobalEventName';
import {PartyName} from '../../../../common/turmoil/PartyName';
import {IGame} from '../../../IGame';
import {Turmoil} from '../../../turmoil/Turmoil';
import {Resource} from '../../../../common/Resource';
import {CardRenderer} from '../../render/CardRenderer';
import {Size} from '../../../../common/cards/render/Size';
import {Frontier} from '../../../consortium/Frontier';

export class RimQuake extends GlobalEvent implements IGlobalEvent {
  constructor() {
    super({
      name: GlobalEventName.RIM_QUAKE,
      description:
        'Lose 2 M€ for each frontier tile you own (max 3), reduced by influence.',
      revealedDelegate: PartyName.REDS,
      currentDelegate: PartyName.GREENS,
      renderData: CardRenderer.builder((b) => {
        b.minus().megacredits(2).slash().text('frontier', {size: Size.SMALL})
          .influence({size: Size.SMALL});
      }),
    });
  }

  public resolve(game: IGame, turmoil: Turmoil) {
    game.playersInGenerationOrder.forEach((player) => {
      const tiles = Math.min(3, Frontier.countOwnedFrontierTiles(player));
      const loss = Math.max(0, (2 * tiles) - turmoil.getInfluence(player));
      if (loss > 0) {
        player.stock.deduct(Resource.MEGACREDITS, loss, {log: true, from: {globalEvent: this}});
      }
    });
  }
}
