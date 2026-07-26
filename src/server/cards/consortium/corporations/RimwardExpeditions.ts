import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';
import {Space} from '../../../boards/Space';
import {BoardType} from '../../../boards/BoardType';
import {Phase} from '../../../../common/Phase';
import {GainResourcesDeferred} from '../../../deferredActions/GainResourcesDeferred';
import {Resource} from '../../../../common/Resource';
import {Frontier} from '../../../consortium/Frontier';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

/**
 * Frontier placement rebate + free-rider payout on any bridge completion
 * (bridgeEffect.global in MegastructureEffects).
 */
export class RimwardExpeditions extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.RIMWARD_EXPEDITIONS,
      tags: [Tag.SPACE, Tag.EARTH],
      startingMegaCredits: 40,

      metadata: {
        cardNumber: 'CNC3',
        description: 'You start with 40 M€.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(40);
          b.corpBox('effect', (ce) => {
            ce.effect('Your tile placements in frontier zones cost 3 M€ less.', (eb) => {
              eb.empty().startEffect.megacredits(-BALANCE.RIMWARD_FRONTIER_REBATE, {digit});
            });
            ce.effect('Whenever any bridge completes, gain 4 M€ and draw a card, whether or not you contributed.', (eb) => {
              eb.empty().asterix().startEffect.megacredits(BALANCE.RIMWARD_BRIDGE_COMPLETE_MC, {digit}).cards(1);
            });
          });
        }),
      },
    });
  }

  public onTilePlaced(cardOwner: IPlayer, activePlayer: IPlayer, space: Space, boardType: BoardType) {
    if (cardOwner.id !== activePlayer.id) {
      return;
    }
    if (boardType !== BoardType.MARS) {
      return;
    }
    if (cardOwner.game.phase === Phase.SOLAR) {
      return;
    }
    if (!Frontier.isFrontierSpace(space)) {
      return;
    }
    cardOwner.game.defer(new GainResourcesDeferred(
      cardOwner, Resource.MEGACREDITS, {count: BALANCE.RIMWARD_FRONTIER_REBATE, log: true}));
  }
}
