/** Identifiers for Consortium megastructures. */
export type MegastructureKind =
  | 'bridge'
  | 'space_elevator'
  | 'l1_magnetic_shield'
  | 'mohole'
  | 'solar_mirror'
  | 'arcology';

/** The five grand structures; two are drawn into each game. */
export const GRAND_STRUCTURE_KINDS: ReadonlyArray<Exclude<MegastructureKind, 'bridge'>> = [
  'space_elevator',
  'l1_magnetic_shield',
  'mohole',
  'solar_mirror',
  'arcology',
] as const;

/** Stable ids for serialization / lookup. Bridge ids include sector. */
export type MegastructureId =
  | 'bridge-0'
  | 'bridge-1'
  | 'bridge-2'
  | 'space_elevator'
  | 'l1_magnetic_shield'
  | 'mohole'
  | 'solar_mirror'
  | 'arcology';

export function displayName(kind: MegastructureKind, sector?: number): string {
  switch (kind) {
  case 'bridge':
    return `Bridge (Sector ${sector ?? 0})`;
  case 'space_elevator':
    return 'Space Elevator';
  case 'l1_magnetic_shield':
    return 'L1 Magnetic Shield';
  case 'mohole':
    return 'Mohole';
  case 'solar_mirror':
    return 'Solar Mirror';
  case 'arcology':
    return 'Arcology';
  }
}

/**
 * Grand structures that require a highland tile foundation before a player's
 * first contribution. Bridges, L1 Shield and Arcology have no foundation gate.
 */
export const FOUNDATION_REQUIRED_KINDS: ReadonlySet<MegastructureKind> = new Set([
  'space_elevator',
  'mohole',
  'solar_mirror',
]);
