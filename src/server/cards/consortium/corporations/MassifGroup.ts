import {CorporationCard} from '../../corporation/CorporationCard';
import {Tag} from '../../../../common/cards/Tag';
import {IPlayer} from '../../../IPlayer';
import {CardName} from '../../../../common/cards/CardName';
import {CardRenderer} from '../../render/CardRenderer';
import {ICorporationCard} from '../../corporation/ICorporationCard';
import {IProjectCard} from '../../IProjectCard';
import {TileType} from '../../../../common/TileType';
import {PlaceTile} from '../../../deferredActions/PlaceTile';
import {Terrain} from '../../../consortium/Terrain';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../common/consortium/MegastructureConstants';
import {digit} from '../../Options';

/** Cards whose playability requires owning a highland tile. */
const HIGHLAND_REQUIREMENT_CARDS: ReadonlySet<CardName> = new Set([
  CardName.HIGHLAND_TERRACE,
  CardName.SCARP_FOUNDRY,
  CardName.RIMWALL_HABITAT,
  CardName.HIGHLAND_ANCHOR,
]);

export class MassifGroup extends CorporationCard implements ICorporationCard {
  constructor() {
    super({
      name: CardName.MASSIF_GROUP,
      tags: [Tag.BUILDING],
      startingMegaCredits: 45,

      metadata: {
        cardNumber: 'CNC4',
        description:
          'You start with 45 M€. When you play this, place a special tile on a highland space.',
        renderData: CardRenderer.builder((b) => {
          b.megacredits(45).nbsp.tile(TileType.MASSIF_GROUP, true).asterix();
          b.corpBox('effect', (ce) => {
            ce.effect('Cards that require you to own a highland tile cost 4 M€ less.', (eb) => {
              eb.empty().startEffect.megacredits(-BALANCE.MASSIF_HIGHLAND_CARD_DISCOUNT, {digit});
            });
          });
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer) {
    const spaces = Terrain.availableHighlandSpaces(player);
    if (spaces.length === 0) {
      return undefined;
    }
    player.game.defer(
      new PlaceTile(player, {
        tile: {tileType: TileType.MASSIF_GROUP, card: this.name},
        on: () => spaces,
        title: 'Select highland for Massif Group',
      }));
    return undefined;
  }

  public override getCardDiscount(_player: IPlayer, card: IProjectCard): number {
    return HIGHLAND_REQUIREMENT_CARDS.has(card.name) ?
      BALANCE.MASSIF_HIGHLAND_CARD_DISCOUNT : 0;
  }
}
