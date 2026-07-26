import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardType} from '../../../common/cards/CardType';
import {CardName} from '../../../common/cards/CardName';
import {CardRenderer} from '../render/CardRenderer';
import {IPlayer} from '../../IPlayer';
import {Space} from '../../boards/Space';
import {BoardType} from '../../boards/BoardType';
import {Phase} from '../../../common/Phase';
import {GainResourcesDeferred} from '../../deferredActions/GainResourcesDeferred';
import {Resource} from '../../../common/Resource';
import {Frontier} from '../../consortium/Frontier';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../common/consortium/MegastructureConstants';
import {digit} from '../Options';

/**
 * Effect: tile placements in frontier zones cost SECTOR_CLAIM_REBATE M€ less.
 * Implemented as an on-place rebate (same pattern as Gordon / place6mc).
 */
export class SectorClaim extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.ACTIVE,
      name: CardName.SECTOR_CLAIM,
      tags: [],
      cost: 18,

      metadata: {
        cardNumber: 'CN30',
        renderData: CardRenderer.builder((b) => {
          b.effect('Your tile placements in frontier zones cost 4 M€ less.', (eb) => {
            eb.empty().startEffect.megacredits(-BALANCE.SECTOR_CLAIM_REBATE, {digit});
          });
        }),
        description: 'Requires at least 1 open frontier sector.',
      },
    });
  }

  public override bespokeCanPlay(player: IPlayer): boolean {
    return Frontier.countOpenSectors(player.game) >= 1;
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
      cardOwner, Resource.MEGACREDITS, {count: BALANCE.SECTOR_CLAIM_REBATE, log: true}));
  }
}
