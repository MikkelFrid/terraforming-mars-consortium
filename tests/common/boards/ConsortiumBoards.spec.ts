import {expect} from 'chai';
import {BoardName} from '@/common/boards/BoardName';
import {
  CONSORTIUM_BOARDS,
  consortiumBoardBlurb,
  consortiumBoardLabel,
  consortiumBoardPreviewUrl,
  isConsortiumBoard,
} from '@/common/boards/ConsortiumBoards';

describe('ConsortiumBoards', () => {
  it('lists the three Consortium maps', () => {
    expect(CONSORTIUM_BOARDS).deep.eq([
      BoardName.CONSORTIUM,
      BoardName.CONSORTIUM_RIFT,
      BoardName.CONSORTIUM_ARCHIPELAGO,
    ]);
  });

  it('recognizes Consortium board ids', () => {
    expect(isConsortiumBoard(BoardName.CONSORTIUM)).eq(true);
    expect(isConsortiumBoard(BoardName.CONSORTIUM_RIFT)).eq(true);
    expect(isConsortiumBoard(BoardName.CONSORTIUM_ARCHIPELAGO)).eq(true);
    expect(isConsortiumBoard(BoardName.THARSIS)).eq(false);
  });

  it('returns lobby labels', () => {
    expect(consortiumBoardLabel(BoardName.CONSORTIUM)).eq('Massif');
    expect(consortiumBoardLabel(BoardName.CONSORTIUM_RIFT)).eq('Rift Basin');
    expect(consortiumBoardLabel(BoardName.CONSORTIUM_ARCHIPELAGO)).eq('Archipelago');
  });

  it('maps each board to a terrain preview asset', () => {
    expect(consortiumBoardPreviewUrl(BoardName.CONSORTIUM))
      .eq('/assets/consortium/maps/massif.png');
    expect(consortiumBoardPreviewUrl(BoardName.CONSORTIUM_RIFT))
      .eq('/assets/consortium/maps/rift.png');
    expect(consortiumBoardPreviewUrl(BoardName.CONSORTIUM_ARCHIPELAGO))
      .eq('/assets/consortium/maps/archipelago.png');
    expect(consortiumBoardPreviewUrl(BoardName.THARSIS)).eq(undefined);
  });

  it('provides a short blurb per map', () => {
    expect(consortiumBoardBlurb(BoardName.CONSORTIUM)).to.include('Balanced');
    expect(consortiumBoardBlurb(BoardName.CONSORTIUM_RIFT)).to.include('Iridium');
    expect(consortiumBoardBlurb(BoardName.CONSORTIUM_ARCHIPELAGO)).to.include('Structure');
    expect(consortiumBoardBlurb(BoardName.THARSIS)).eq('');
  });
});
