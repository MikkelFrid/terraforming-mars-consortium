/**
 * Consortium megastructure balance knobs.
 *
 * Every numeric rule for segments, costs, keystones, selection, VP and
 * completion effects lives here so tuning stays in one place.
 * See docs/consortium/06-megastructures.md and 08-megastructure-effects.md.
 */

export const MEGASTRUCTURE_BALANCE = {
  // --- Selection -----------------------------------------------------------
  /** Always in play: one bridge per board sector. Balance knob. */
  BRIDGES_PER_GAME: 3,
  /** Grand structures drawn at random into each game. Balance knob. */
  GRAND_STRUCTURES_PER_GAME: 2,

  // --- Bridge segments -----------------------------------------------------
  /** Segments on a Bridge track. Balance knobs. */
  BRIDGE_SEGMENT_COUNT: 4,
  /** M€ cost of Bridge segments 1–3. Balance knob. */
  BRIDGE_SEGMENT_COST_MC: 12,
  /** M€ cost of the Bridge keystone (last segment). Balance knob. */
  BRIDGE_KEYSTONE_COST_MC: 8,
  /** Minimum iridium that must be spent on the Bridge keystone. Balance knob. */
  BRIDGE_KEYSTONE_MIN_IRIDIUM: 2,

  // --- Grand structure segments --------------------------------------------
  /** Segments on a grand structure track. Balance knob. */
  GRAND_SEGMENT_COUNT: 6,
  /** M€ cost of grand-structure segments 1–5. Balance knob. */
  GRAND_SEGMENT_COST_MC: 16,
  /** M€ cost of the grand-structure keystone (last segment). Balance knob. */
  GRAND_KEYSTONE_COST_MC: 12,
  /** Minimum iridium that must be spent on a grand keystone. Balance knob. */
  GRAND_KEYSTONE_MIN_IRIDIUM: 3,

  // --- Victory points (base, phase 6a) -------------------------------------
  /** VP awarded per segment a player paid for on a completed structure. Balance knob. */
  VP_PER_SEGMENT: 1,
  /** Extra VP for the player who placed the keystone. Balance knob. */
  VP_KEYSTONE_BONUS: 2,

  // --- Completion effects (phase 6c, first-pass playtest) ------------------
  /** Bridge contributor: +N M€ production per segment. Balance knob. */
  BRIDGE_MC_PRODUCTION_PER_SEGMENT: 1,

  /** Space Elevator global: M€ discount on space-tag cards for all players. Balance knob. */
  SPACE_ELEVATOR_SPACE_TAG_DISCOUNT: 2,
  /** Space Elevator contributor: titanium production per this many segments. Balance knob. */
  SPACE_ELEVATOR_TITANIUM_PROD_PER_SEGMENTS: 2,

  /** L1 Magnetic Shield global: plants knocked off greenery cost for all. Balance knob. */
  L1_SHIELD_GREENERY_DISCOUNT: 1,
  /** L1 Magnetic Shield contributor: plant production per this many segments. Balance knob. */
  L1_SHIELD_PLANT_PROD_PER_SEGMENTS: 2,

  /** Mohole global: heat production for all players. Balance knob. */
  MOHOLE_GLOBAL_HEAT_PRODUCTION: 1,
  /** Mohole contributor: immediate iridium per segment owned. Balance knob. */
  MOHOLE_IRIDIUM_PER_SEGMENT: 1,
  /** Mohole contributor: iridium granted at generation start (capped at 1). Balance knob. */
  MOHOLE_GENERATION_IRIDIUM: 1,

  /** Solar Mirror global: temperature steps on completion. Balance knob. */
  SOLAR_MIRROR_TEMPERATURE_STEPS: 1,
  /** Solar Mirror contributor: heat production per this many segments. Balance knob. */
  SOLAR_MIRROR_HEAT_PROD_PER_SEGMENTS: 2,

  /** Arcology global: M€ production for all players. Balance knob. */
  ARCOLOGY_GLOBAL_MC_PRODUCTION: 1,
  /** Arcology contributor: extra VP per segment on top of VP_PER_SEGMENT. Balance knob. */
  ARCOLOGY_EXTRA_VP_PER_SEGMENT: 1,
} as const;
