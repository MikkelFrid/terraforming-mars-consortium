import {IGlobalEvent} from '../../../turmoil/globalEvents/IGlobalEvent';
import {GlobalEvent} from '../../../turmoil/globalEvents/GlobalEvent';
import {GlobalEventName} from '../../../../common/turmoil/globalEvents/GlobalEventName';
import {PartyName} from '../../../../common/turmoil/PartyName';
import {IGame} from '../../../IGame';
import {Turmoil} from '../../../turmoil/Turmoil';
import {Tag} from '../../../../common/cards/Tag';
import {Resource} from '../../../../common/Resource';
import {CardRenderer} from '../../render/CardRenderer';
import {Size} from '../../../../common/cards/render/Size';

export class CharterReview extends GlobalEvent implements IGlobalEvent {
  constructor() {
    super({
      name: GlobalEventName.CHARTER_REVIEW,
      description:
        'Gain 2 M€ for each Structure and Prospecting tag you have (max 5 tags total) and influence.',
      revealedDelegate: PartyName.SCIENTISTS,
      currentDelegate: PartyName.KELVINISTS,
      renderData: CardRenderer.builder((b) => {
        b.megacredits(2).slash().tag(Tag.STRUCTURE).tag(Tag.PROSPECTING)
          .influence({size: Size.SMALL});
      }),
    });
  }

  public resolve(game: IGame, turmoil: Turmoil) {
    game.playersInGenerationOrder.forEach((player) => {
      const tags = player.tags.count(Tag.STRUCTURE, 'raw') +
        player.tags.count(Tag.PROSPECTING, 'raw');
      const total = Math.min(tags, 5) + turmoil.getInfluence(player);
      player.stock.add(Resource.MEGACREDITS, 2 * total, {log: true, from: {globalEvent: this}});
    });
  }
}
