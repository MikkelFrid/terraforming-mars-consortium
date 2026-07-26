import {MegastructureId} from '@/common/consortium/MegastructureKind';
import {InputResponse} from '@/common/inputs/InputResponse';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';

/**
 * Build an InputResponse that selects the contribute option for `structureId`
 * inside the player's current waitingFor tree.
 *
 * Supports:
 * - Flat SelectOption in the top-level OrOptions (title contains [id])
 * - Nested OrOptions titled "Contribute to a megastructure"
 *
 * Returns undefined when the action is not currently available.
 */
export function buildContributeResponse(
  waitingFor: PlayerInputModel | undefined,
  structureId: MegastructureId,
): InputResponse | undefined {
  if (waitingFor === undefined || waitingFor.type !== 'or') {
    return undefined;
  }
  const marker = `[${structureId}]`;
  const top = waitingFor as OrOptionsModel;

  for (let i = 0; i < top.options.length; i++) {
    const opt = top.options[i];
    if (opt.type === 'option' && titleContains(opt.title, marker)) {
      return {type: 'or', index: i, response: {type: 'option'}};
    }
    if (opt.type === 'or' && isMegastructureOr(opt)) {
      const nested = findStructureOption(opt, marker);
      if (nested !== undefined) {
        return {
          type: 'or',
          index: i,
          response: {type: 'or', index: nested, response: {type: 'option'}},
        };
      }
    }
  }
  return undefined;
}

function titleContains(title: string | {message?: string} | unknown, marker: string): boolean {
  if (typeof title === 'string') {
    return title.includes(marker);
  }
  // Message objects are rare for contribute titles (plain strings from server).
  if (title !== null && typeof title === 'object' && 'message' in (title as object)) {
    return String((title as {message: string}).message).includes(marker);
  }
  return String(title).includes(marker);
}

function isMegastructureOr(opt: OrOptionsModel): boolean {
  if (typeof opt.title === 'string') {
    return opt.title.toLowerCase().includes('megastructure');
  }
  return opt.options.some((o) => o.type === 'option' && titleContains(o.title, '['));
}

function findStructureOption(opt: OrOptionsModel, marker: string): number | undefined {
  for (let i = 0; i < opt.options.length; i++) {
    const child = opt.options[i];
    if (child.type === 'option' && titleContains(child.title, marker)) {
      return i;
    }
  }
  return undefined;
}
