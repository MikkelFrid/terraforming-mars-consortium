import {BoardName} from './BoardName';
import {
  consortiumBoardBlurb,
  consortiumBoardPreviewUrl,
  isConsortiumBoard,
} from './ConsortiumBoards';

/**
 * Static lobby map previews.
 *
 * Consortium boards use the generated terrain composites under
 * `/assets/consortium/maps/`. Other boards use screenshots vendored from the
 * upstream Maps wiki into `/assets/maps/`.
 */
const BOARD_PREVIEW_URL: Partial<Record<BoardName, string>> = {
  [BoardName.THARSIS]: '/assets/maps/tharsis.png',
  [BoardName.HELLAS]: '/assets/maps/hellas.png',
  [BoardName.ELYSIUM]: '/assets/maps/elysium.png',
  [BoardName.ARABIA_TERRA]: '/assets/maps/arabia-terra.png',
  [BoardName.AMAZONIS]: '/assets/maps/amazonis.png',
  [BoardName.TERRA_CIMMERIA]: '/assets/maps/terra-cimmeria.png',
  // No separate wiki shot yet — Novus shares the Cimmeria family layout.
  [BoardName.TERRA_CIMMERIA_NOVA]: '/assets/maps/terra-cimmeria.png',
  [BoardName.VASTITAS_BOREALIS]: '/assets/maps/vastitas-borealis.png',
  [BoardName.VASTITAS_BOREALIS_NOVA]: '/assets/maps/vastitas-borealis-nova.png',
  [BoardName.UTOPIA_PLANITIA]: '/assets/maps/utopia-planitia.png',
  [BoardName.HOLLANDIA]: '/assets/maps/hollandia.png',
};

/** Optional one-line caption under the preview image. */
const BOARD_PREVIEW_BLURB: Partial<Record<BoardName, string>> = {
  [BoardName.THARSIS]: 'Classic official map.',
  [BoardName.HELLAS]: 'Official map — south pole ocean placement.',
  [BoardName.ELYSIUM]: 'Official map — Elysium Mons highlands.',
  [BoardName.ARABIA_TERRA]: 'Fan map — cove spaces and scarce steel.',
  [BoardName.AMAZONIS]: 'Fan map — large board with a restricted hole.',
  [BoardName.TERRA_CIMMERIA]: 'Fan map — volcanic line and plant belts.',
  [BoardName.TERRA_CIMMERIA_NOVA]: 'Fan map — Terra Cimmeria Novus variant.',
  [BoardName.VASTITAS_BOREALIS]: 'Fan map — temperature track placement bonus.',
  [BoardName.VASTITAS_BOREALIS_NOVA]: 'Fan map — Vastitas Borealis Novus variant.',
  [BoardName.UTOPIA_PLANITIA]: 'Fan map — Utopia Planitia.',
  [BoardName.HOLLANDIA]: 'Fan map — deflection zone protects plants.',
};

export function boardPreviewUrl(boardName: BoardName | string): string | undefined {
  if (isConsortiumBoard(boardName)) {
    return consortiumBoardPreviewUrl(boardName);
  }
  return BOARD_PREVIEW_URL[boardName as BoardName];
}

export function boardPreviewBlurb(
  boardName: BoardName | string,
  options?: {consortiumExpansion?: boolean},
): string {
  if (isConsortiumBoard(boardName)) {
    return consortiumBoardBlurb(boardName);
  }
  if (options?.consortiumExpansion === true && boardPreviewUrl(boardName) !== undefined) {
    return 'Consortium terrain overlay — highlands, craters, chasms and locked frontier.';
  }
  return BOARD_PREVIEW_BLURB[boardName as BoardName] ?? '';
}
