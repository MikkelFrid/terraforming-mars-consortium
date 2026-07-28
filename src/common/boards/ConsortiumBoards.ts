import {BoardName} from './BoardName';

/** Mars maps that require the Consortium expansion. */
export const CONSORTIUM_BOARDS: ReadonlyArray<BoardName> = [
  BoardName.CONSORTIUM,
  BoardName.CONSORTIUM_RIFT,
  BoardName.CONSORTIUM_ARCHIPELAGO,
] as const;

const CONSORTIUM_BOARD_SET: ReadonlySet<BoardName> = new Set(CONSORTIUM_BOARDS);

export function isConsortiumBoard(boardName: BoardName | string): boolean {
  return CONSORTIUM_BOARD_SET.has(boardName as BoardName);
}

/** Lobby / setup label. `consortium` stays the Massif id for save compatibility. */
export function consortiumBoardLabel(boardName: BoardName | string): string {
  switch (boardName) {
  case BoardName.CONSORTIUM:
    return 'Massif';
  case BoardName.CONSORTIUM_RIFT:
    return 'Rift Basin';
  case BoardName.CONSORTIUM_ARCHIPELAGO:
    return 'Archipelago';
  default:
    return String(boardName);
  }
}

/**
 * Terrain preview PNGs from `tools/consortium-art/build_board.py`
 * → `assets/consortium/maps/<stem>.png`.
 */
export function consortiumBoardPreviewUrl(boardName: BoardName | string): string | undefined {
  switch (boardName) {
  case BoardName.CONSORTIUM:
    return '/assets/consortium/maps/massif.png';
  case BoardName.CONSORTIUM_RIFT:
    return '/assets/consortium/maps/rift.png';
  case BoardName.CONSORTIUM_ARCHIPELAGO:
    return '/assets/consortium/maps/archipelago.png';
  default:
    return undefined;
  }
}

/** One-line pitch for lobby caption / rulebook. */
export function consortiumBoardBlurb(boardName: BoardName | string): string {
  switch (boardName) {
  case BoardName.CONSORTIUM:
    return 'Balanced default — even craters, mid-width chasms, open early game.';
  case BoardName.CONSORTIUM_RIFT:
    return 'Iridium hunger — wide chasms, scarce core craters, rich locked frontier.';
  case BoardName.CONSORTIUM_ARCHIPELAGO:
    return 'Structure play — more highlands, narrower chasms, wider open frontier.';
  default:
    return '';
  }
}
