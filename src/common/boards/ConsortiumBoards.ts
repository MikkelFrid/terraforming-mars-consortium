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
