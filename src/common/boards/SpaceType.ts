export enum SpaceType {
    LAND = 'land',
    OCEAN = 'ocean',
    COLONY = 'colony',
    LUNAR_MINE = 'lunar_mine', // Reserved for The Moon.
    COVE = 'cove', // Cove can represent an ocean and a land space.
    RESTRICTED = 'restricted', // Amazonis Planitia
    DEFLECTION_ZONE = 'deflection', // Hollandia
    /** Consortium: nothing may be placed. Same exclusion mechanism as RESTRICTED; distinct type for art and future bridge unlock. */
    CHASM = 'chasm',
    /** Consortium: land-like; first tile placement grants iridium once (stubbed until Iridium exists). */
    CRATER_FIELD = 'crater_field',
    /** Consortium: land-like; oceans may not be placed. Future megastructure foundation. */
    HIGHLAND = 'highland',
}
