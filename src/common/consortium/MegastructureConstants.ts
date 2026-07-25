/**
 * Consortium megastructure balance knobs.
 *
 * Every numeric rule for segments, costs, keystones, selection and VP lives
 * here so tuning stays in one place. See docs/consortium/06-megastructures.md.
 */

export const MEGASTRUCTURE_BALANCE = {
  // --- Selection -----------------------------------------------------------
  /** Always in play: one bridge per board sector. Balance knob. */
  BRIDGES_PER_GAME: 3,
  /** Grand structures drawn at random into each game. Balance knob. */
  GRAND_STRUCTURES_PER_GAME: 2,

  // --- Bridge segments -----------------------------------------------------
  /** Segments on a Bridge track. Balance knob. */
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

  // --- Victory points ------------------------------------------------------
  /** VP awarded per segment a player paid for on a completed structure. Balance knob. */
  VP_PER_SEGMENT: 1,
  /** Extra VP for the player who placed the keystone. Balance knob. */
  VP_KEYSTONE_BONUS: 2,
} as const;
