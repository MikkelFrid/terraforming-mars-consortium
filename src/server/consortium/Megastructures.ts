import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../common/consortium/MegastructureConstants';
import {
  displayName,
  FOUNDATION_REQUIRED_KINDS,
  GRAND_STRUCTURE_KINDS,
  MegastructureId,
  MegastructureKind,
} from '../../common/consortium/MegastructureKind';
import {CardName} from '../../common/cards/CardName';
import {Payment} from '../../common/inputs/Payment';
import {Resource} from '../../common/Resource';
import {SpaceType} from '../../common/boards/SpaceType';
import {PlayerId} from '../../common/Types';
import {Random} from '../../common/utils/Random';
import {Board} from '../boards/Board';
import {SelectPaymentDeferred} from '../deferredActions/SelectPaymentDeferred';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {PlayerInput} from '../PlayerInput';
import {SelectOption} from '../inputs/SelectOption';
import {VictoryPointsBreakdownBuilder} from '../game/VictoryPointsBreakdownBuilder';
import {inplaceShuffle} from '../utils/shuffle';
import {Iridium} from './Iridium';
import {MEGASTRUCTURE_EFFECTS} from './MegastructureEffects';
import {
  SerializedMegastructure,
  SerializedMegastructuresData,
} from './SerializedMegastructuresData';

export type MegastructureSegment = {
  owner: PlayerId | undefined;
};

export type Megastructure = {
  id: MegastructureId;
  kind: MegastructureKind;
  sector?: number;
  segments: Array<MegastructureSegment>;
  completed: boolean;
  keystonePlayer?: PlayerId;
};

export type MegastructuresData = {
  structures: Array<Megastructure>;
};

/**
 * Consortium megastructure tracks: contribution, completion, scoring and
 * serialization. No UI and no board coupling — frontier unlock is a later phase.
 */
export class Megastructures {
  private constructor() {
  }

  public static initialize(rng: Random): MegastructuresData {
    const bridges: Array<Megastructure> = [0, 1, 2].map((sector) =>
      this.newStructure('bridge', `bridge-${sector}` as MegastructureId, sector));

    const pool = [...GRAND_STRUCTURE_KINDS];
    inplaceShuffle(pool, rng);
    const grands = pool
      .slice(0, BALANCE.GRAND_STRUCTURES_PER_GAME)
      .map((kind) => this.newStructure(kind, kind));

    return {structures: [...bridges, ...grands]};
  }

  private static newStructure(
    kind: MegastructureKind,
    id: MegastructureId,
    sector?: number,
  ): Megastructure {
    const count = kind === 'bridge' ? BALANCE.BRIDGE_SEGMENT_COUNT : BALANCE.GRAND_SEGMENT_COUNT;
    return {
      id,
      kind,
      sector,
      segments: Array.from({length: count}, () => ({owner: undefined})),
      completed: false,
    };
  }

  public static serialize(data: MegastructuresData | undefined): SerializedMegastructuresData | undefined {
    if (data === undefined) {
      return undefined;
    }
    return {
      structures: data.structures.map((s): SerializedMegastructure => ({
        id: s.id,
        kind: s.kind,
        sector: s.sector,
        segments: s.segments.map((seg) => ({owner: seg.owner})),
        completed: s.completed,
        keystonePlayer: s.keystonePlayer,
      })),
    };
  }

  public static deserialize(data: SerializedMegastructuresData | undefined): MegastructuresData | undefined {
    if (data === undefined) {
      return undefined;
    }
    return {
      structures: data.structures.map((s) => ({
        id: s.id,
        kind: s.kind,
        sector: s.sector,
        segments: s.segments.map((seg) => ({owner: seg.owner})),
        completed: s.completed,
        keystonePlayer: s.keystonePlayer,
      })),
    };
  }

  public static get(game: IGame, id: MegastructureId): Megastructure | undefined {
    return game.megastructuresData?.structures.find((s) => s.id === id);
  }

  /** Next empty segment index, or -1 if full. */
  public static nextSegmentIndex(structure: Megastructure): number {
    return structure.segments.findIndex((s) => s.owner === undefined);
  }

  public static isKeystone(structure: Megastructure, index: number): boolean {
    return index === structure.segments.length - 1;
  }

  public static segmentCostMc(structure: Megastructure, index: number): number {
    if (structure.kind === 'bridge') {
      return this.isKeystone(structure, index) ?
        BALANCE.BRIDGE_KEYSTONE_COST_MC :
        BALANCE.BRIDGE_SEGMENT_COST_MC;
    }
    return this.isKeystone(structure, index) ?
      BALANCE.GRAND_KEYSTONE_COST_MC :
      BALANCE.GRAND_SEGMENT_COST_MC;
  }

  /**
   * Permanent + one-shot segment discounts (Site Foreman + Scaffold Yard).
   * They stack. Balance knobs in MEGASTRUCTURE_BALANCE.
   */
  public static segmentDiscountMc(player: IPlayer): number {
    let discount = 0;
    if (player.tableau.has(CardName.SITE_FOREMAN)) {
      discount += BALANCE.SITE_FOREMAN_DISCOUNT;
    }
    if (player.tableau.has(CardName.KEYSTONE_CONSORTIUM)) {
      discount += BALANCE.KEYSTONE_CONSORTIUM_DISCOUNT;
    }
    discount += player.nextMegastructureSegmentDiscount;
    return discount;
  }

  /** Base segment cost minus stacking discounts, floored at 0. */
  public static effectiveSegmentCostMc(
    player: IPlayer,
    structure: Megastructure,
    index: number,
  ): number {
    return Math.max(0, this.segmentCostMc(structure, index) - this.segmentDiscountMc(player));
  }

  public static keystoneMinIridium(structure: Megastructure): number {
    return structure.kind === 'bridge' ?
      BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM :
      BALANCE.GRAND_KEYSTONE_MIN_IRIDIUM;
  }

  public static playerOwnsHighlandTile(player: IPlayer): boolean {
    return player.game.board.spaces.some((space) =>
      space.spaceType === SpaceType.HIGHLAND &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space));
  }

  /** True if this would be the player's first segment on a foundation-gated structure. */
  public static needsFoundation(player: IPlayer, structure: Megastructure): boolean {
    if (!FOUNDATION_REQUIRED_KINDS.has(structure.kind)) {
      return false;
    }
    return structure.segments.every((s) => s.owner !== player.id);
  }

  public static meetsFoundation(player: IPlayer, structure: Megastructure): boolean {
    if (!this.needsFoundation(player, structure)) {
      return true;
    }
    // Structural Engineers: owner-only highland-foundation bypass.
    if (player.tableau.has(CardName.STRUCTURAL_ENGINEERS)) {
      return true;
    }
    return this.playerOwnsHighlandTile(player);
  }

  public static canContribute(player: IPlayer, structure: Megastructure): boolean {
    if (structure.completed) {
      return false;
    }
    const index = this.nextSegmentIndex(structure);
    if (index < 0) {
      return false;
    }
    if (!this.meetsFoundation(player, structure)) {
      return false;
    }
    const cost = this.effectiveSegmentCostMc(player, structure, index);
    const minIridium = this.isKeystone(structure, index) ? this.keystoneMinIridium(structure) : 0;
    if (player.iridium < minIridium) {
      return false;
    }
    // Segments accept MC, steel, titanium and iridium. Iridium remains tag-gated
    // everywhere else; this is an explicit permitted spend target.
    // Scarp Foundry may raise the steel rate for this check only.
    return player.canAfford({
      cost,
      steel: true,
      titanium: true,
      iridium: true,
      steelRate: player.getMegastructureSteelValue(),
    });
  }

  /** Total segments this player owns across all structures. */
  public static countSegmentsFor(player: IPlayer): number {
    const data = player.game.megastructuresData;
    if (data === undefined) {
      return 0;
    }
    let count = 0;
    for (const structure of data.structures) {
      count += structure.segments.filter((s) => s.owner === player.id).length;
    }
    return count;
  }

  /** Distinct structures this player has contributed at least one segment to. */
  public static countStructuresContributed(player: IPlayer): number {
    const data = player.game.megastructuresData;
    if (data === undefined) {
      return 0;
    }
    return data.structures.filter((structure) =>
      structure.segments.some((s) => s.owner === player.id)).length;
  }

  /** Structures where this player owns at least `min` segments. */
  public static countStructuresWithMinSegments(player: IPlayer, min: number): number {
    const data = player.game.megastructuresData;
    if (data === undefined) {
      return 0;
    }
    return data.structures.filter((structure) =>
      structure.segments.filter((s) => s.owner === player.id).length >= min).length;
  }

  /** Completed megastructures in the game. */
  public static countCompleted(game: IGame): number {
    return game.megastructuresData?.structures.filter((s) => s.completed).length ?? 0;
  }

  /**
   * Owned tiles in frontier zones. Frontier spaces carry `bridge` from the
   * Consortium board JSON (survives unlock / serialize).
   */
  public static countFrontierTiles(player: IPlayer): number {
    return player.game.board.spaces.filter((space) =>
      space.bridge !== undefined &&
      space.tile !== undefined &&
      Board.ownedBy(player)(space)).length;
  }

  /**
   * Player-action entry: OrOptions over contributable structures. Choosing one
   * defers payment then places the next segment.
   */
  public static contributeAction(player: IPlayer): PlayerInput | undefined {
    const data = player.game.megastructuresData;
    if (data === undefined) {
      return undefined;
    }
    const options = data.structures
      .filter((s) => this.canContribute(player, s))
      .map((structure) => {
        const index = this.nextSegmentIndex(structure);
        const cost = this.effectiveSegmentCostMc(player, structure, index);
        const keystone = this.isKeystone(structure, index);
        // Titles embed [id] so the track panel can target a structure in one click.
        const title = keystone ?
          `Contribute keystone to ${displayName(structure.kind, structure.sector)} [${structure.id}] (${cost} M€, min ${this.keystoneMinIridium(structure)} iridium)` :
          `Contribute segment ${index + 1} to ${displayName(structure.kind, structure.sector)} [${structure.id}] (${cost} M€)`;
        return new SelectOption(title).andThen(() => {
          this.beginContribute(player, structure);
          return undefined;
        });
      });
    if (options.length === 0) {
      return undefined;
    }
    return new OrOptions(...options)
      .setTitle('Contribute to a megastructure')
      .setButtonLabel('Contribute');
  }

  public static beginContribute(player: IPlayer, structure: Megastructure): void {
    if (!this.canContribute(player, structure)) {
      throw new Error(`Cannot contribute to ${structure.id}`);
    }
    const index = this.nextSegmentIndex(structure);
    const cost = this.effectiveSegmentCostMc(player, structure, index);
    const keystone = this.isKeystone(structure, index);
    const minIridium = keystone ? this.keystoneMinIridium(structure) : undefined;
    const title = keystone ?
      `Select how to pay ${cost} M€ for ${displayName(structure.kind, structure.sector)} keystone (min ${minIridium} iridium)` :
      `Select how to pay ${cost} M€ for ${displayName(structure.kind, structure.sector)} segment ${index + 1}`;
    player.game.defer(new SelectPaymentDeferred(player, cost, {
      canUseSteel: true,
      canUseTitanium: true,
      canUseIridium: true,
      minIridium,
      steelRate: player.getMegastructureSteelValue(),
      title,
    })).andThen((payment) => {
      // SelectPaymentDeferred already called player.pay.
      this.placeSegment(player, structure, payment, /* alreadyPaid */ true);
    });
  }

  /**
   * Validate payment and place the next segment. Completes the structure when
   * the keystone is placed. Public for tests.
   *
   * @param alreadyPaid when true, resources were already deducted (e.g. by
   *   SelectPaymentDeferred); only validate the payment shape and place the marker.
   */
  public static placeSegment(
    player: IPlayer,
    structure: Megastructure,
    payment: Payment,
    alreadyPaid = false,
  ): void {
    if (structure.completed) {
      throw new Error(`Cannot contribute to completed megastructure ${structure.id}`);
    }
    const index = this.nextSegmentIndex(structure);
    if (index < 0) {
      throw new Error(`Megastructure ${structure.id} has no empty segments`);
    }
    if (!this.meetsFoundation(player, structure)) {
      throw new Error(`Foundation required for ${structure.id}`);
    }

    const cost = this.effectiveSegmentCostMc(player, structure, index);
    const keystone = this.isKeystone(structure, index);
    const minIridium = keystone ? this.keystoneMinIridium(structure) : 0;
    if (payment.iridium < minIridium) {
      throw new Error(`Keystone requires at least ${minIridium} iridium`);
    }

    const paid = player.payingAmount(payment, {
      steel: true,
      titanium: true,
      iridium: true,
      heat: player.canUseHeatAsMegaCredits,
      steelRate: player.getMegastructureSteelValue(),
    });
    if (paid < cost) {
      throw new Error(`Payment of ${paid} does not cover segment cost ${cost}`);
    }

    if (!alreadyPaid) {
      // Stock checks — pay() will throw if a resource is short; catch early for clarity.
      if (payment.megacredits > player.megaCredits ||
        payment.steel > player.steel ||
        payment.titanium > player.titanium ||
        payment.iridium > player.iridium) {
        throw new Error('Insufficient resources for megastructure contribution');
      }
      player.pay(payment);
    }

    // Consume Scaffold Yard one-shot after a successful contribute.
    player.nextMegastructureSegmentDiscount = 0;

    structure.segments[index].owner = player.id;

    player.game.log('${0} contributed segment ${1} to ${2}', (b) =>
      b.player(player).number(index + 1).string(displayName(structure.kind, structure.sector)));

    if (keystone) {
      // Keystone Rights: claim once via card.data (survives serialize).
      const rights = player.tableau.get(CardName.KEYSTONE_RIGHTS);
      if (rights !== undefined && rights.data !== true) {
        rights.data = true;
      }
      // Keystone Consortium: +1 M€ production when placing a keystone.
      if (player.tableau.has(CardName.KEYSTONE_CONSORTIUM)) {
        player.production.add(Resource.MEGACREDITS, 1, {log: true});
      }
      this.complete(player.game, structure, player);
    }
  }

  private static complete(game: IGame, structure: Megastructure, keystonePlayer: IPlayer): void {
    structure.completed = true;
    structure.keystonePlayer = keystonePlayer.id;

    game.log('${0} completed ${1}', (b) =>
      b.player(keystonePlayer).string(displayName(structure.kind, structure.sector)));

    // VP is derived from segment ownership at scoring time; log the breakdown.
    const byPlayer = new Map<PlayerId, number>();
    for (const seg of structure.segments) {
      if (seg.owner !== undefined) {
        byPlayer.set(seg.owner, (byPlayer.get(seg.owner) ?? 0) + 1);
      }
    }
    for (const [id, count] of byPlayer) {
      const p = game.getPlayerById(id);
      const vp = count * BALANCE.VP_PER_SEGMENT +
        (id === keystonePlayer.id ? BALANCE.VP_KEYSTONE_BONUS : 0);
      game.log('${0} scores ${1} VP from ${2}', (b) =>
        b.player(p).number(vp).string(displayName(structure.kind, structure.sector)));
    }

    const effect = MEGASTRUCTURE_EFFECTS[structure.kind];
    effect.global(game, structure);
    for (const [id, count] of byPlayer) {
      effect.perContributor(game.getPlayerById(id), structure, count);
    }
  }

  /**
   * Fold megastructure VP into the breakdown. Incomplete structures score nothing.
   * Arcology contributors also get ARCOLOGY_EXTRA_VP_PER_SEGMENT on top of the base.
   */
  public static calculateVictoryPoints(player: IPlayer, builder: VictoryPointsBreakdownBuilder): void {
    const data = player.game.megastructuresData;
    if (data === undefined) {
      return;
    }
    for (const structure of data.structures) {
      if (!structure.completed) {
        continue;
      }
      const owned = structure.segments.filter((s) => s.owner === player.id).length;
      if (owned === 0 && structure.keystonePlayer !== player.id) {
        continue;
      }
      let vp = owned * BALANCE.VP_PER_SEGMENT;
      if (structure.kind === 'arcology') {
        vp += owned * BALANCE.ARCOLOGY_EXTRA_VP_PER_SEGMENT;
      }
      if (structure.keystonePlayer === player.id) {
        vp += BALANCE.VP_KEYSTONE_BONUS;
      }
      if (vp !== 0) {
        builder.setVictoryPoints('victoryPoints', vp, displayName(structure.kind, structure.sector));
      }
    }
  }

  /**
   * Mohole per-generation iridium: one grant per contributing player when the
   * bank has any. No-op if Mohole is incomplete or the bank is empty.
   * Called from Game.startGeneration.
   */
  public static grantMoholeGenerationIridium(game: IGame): void {
    const data = game.megastructuresData;
    if (data === undefined) {
      return;
    }
    const mohole = data.structures.find((s) => s.kind === 'mohole' && s.completed);
    if (mohole === undefined) {
      return;
    }
    const recipients = new Set<PlayerId>();
    for (const seg of mohole.segments) {
      if (seg.owner !== undefined) {
        recipients.add(seg.owner);
      }
    }
    for (const id of recipients) {
      // Cap is inherent: one call of MOHOLE_GENERATION_IRIDIUM (1) per player per generation.
      Iridium.grant(game.getPlayerById(id), BALANCE.MOHOLE_GENERATION_IRIDIUM);
    }
  }

  public static hasCompleted(game: IGame, kind: MegastructureKind): boolean {
    return game.megastructuresData?.structures.some((s) => s.kind === kind && s.completed) === true;
  }
}
