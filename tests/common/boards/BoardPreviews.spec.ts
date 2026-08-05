import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {boardPreviewBlurb, boardPreviewUrl} from '../../../src/common/boards/BoardPreviews';

describe('BoardPreviews', () => {
  it('covers every concrete BoardName', () => {
    for (const name of Object.values(BoardName)) {
      expect(boardPreviewUrl(name), name).to.be.a('string').and.not.empty;
    }
  });

  it('uses Consortium terrain composites for native maps', () => {
    expect(boardPreviewUrl(BoardName.CONSORTIUM)).eq('/assets/consortium/maps/massif.png');
    expect(boardPreviewUrl(BoardName.CONSORTIUM_RIFT)).eq('/assets/consortium/maps/rift.png');
    expect(boardPreviewUrl(BoardName.CONSORTIUM_ARCHIPELAGO))
      .eq('/assets/consortium/maps/archipelago.png');
  });

  it('uses vendored wiki shots for official and fan maps', () => {
    expect(boardPreviewUrl(BoardName.THARSIS)).eq('/assets/maps/tharsis.png');
    expect(boardPreviewUrl(BoardName.HOLLANDIA)).eq('/assets/maps/hollandia.png');
  });

  it('mentions overlay when Consortium is on a non-native map', () => {
    expect(boardPreviewBlurb(BoardName.THARSIS, {consortiumExpansion: true}))
      .to.include('overlay');
    expect(boardPreviewBlurb(BoardName.THARSIS, {consortiumExpansion: false}))
      .to.include('Classic');
  });
});
