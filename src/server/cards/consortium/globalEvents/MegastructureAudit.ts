import {IGlobalEvent} from '../../../turmoil/globalEvents/IGlobalEvent';
import {GlobalEvent} from '../../../turmoil/globalEvents/GlobalEvent';
import {GlobalEventName} from '../../../../common/turmoil/globalEvents/GlobalEventName';
import {PartyName} from '../../../../common/turmoil/PartyName';
import {IGame} from '../../../IGame';
import {Turmoil} from '../../../turmoil/Turmoil';
import {Resource} from '../../../../common/Resource';
import {CardRenderer} from '../../render/CardRenderer';
import {Size} from '../../../../common/cards/render/Size';

export class MegastructureAudit extends GlobalEvent implements IGlobalEvent {
  constructor() {
    super({
      name: GlobalEventName.MEGASTRUCTURE_AUDIT,
      description:
        'If you own 2 or more segments on incomplete megastructures, increase your M€ production 1 step. ' +
        'Otherwise lose 3 M€ (influence reduces the loss).',
      revealedDelegate: PartyName.MARS,
      currentDelegate: PartyName.UNITY,
      renderData: CardRenderer.builder((b) => {
        b.text('2+', {size: Size.SMALL}).text('seg').colon()
          .production((pb) => pb.megacredits(1)).or()
          .minus().megacredits(3).influence({size: Size.SMALL});
      }),
    });
  }

  private static incompleteSegmentCount(game: IGame, playerId: string): number {
    const data = game.megastructuresData;
    if (data === undefined) {
      return 0;
    }
    let count = 0;
    for (const structure of data.structures) {
      if (structure.completed) {
        continue;
      }
      count += structure.segments.filter((s) => s.owner === playerId).length;
    }
    return count;
  }

  public resolve(game: IGame, turmoil: Turmoil) {
    game.playersInGenerationOrder.forEach((player) => {
      if (MegastructureAudit.incompleteSegmentCount(game, player.id) >= 2) {
        player.production.add(Resource.MEGACREDITS, 1, {log: true, from: {globalEvent: this}});
      } else {
        const loss = Math.max(0, 3 - turmoil.getInfluence(player));
        if (loss > 0) {
          player.stock.deduct(Resource.MEGACREDITS, loss, {log: true, from: {globalEvent: this}});
        }
      }
    });
  }
}
