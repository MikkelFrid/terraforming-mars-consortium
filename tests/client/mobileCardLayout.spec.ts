import {expect} from 'chai';
import {
  CARD_DESIGN_WIDTH_PX,
  focusCardScale,
  gridCardScale,
  gridTileSize,
  isMobileCardGridSize,
  MOBILE_CARD_GRID_COLS,
} from '@/client/components/mobile/mobileCardLayout';

describe('mobileCardLayout', () => {
  it('exposes the fixed card design width', () => {
    expect(CARD_DESIGN_WIDTH_PX).eq(240);
  });

  it('scales an iPhone-width viewport above 1.0 for readability', () => {
    const scale = focusCardScale(390);
    expect(scale).to.be.greaterThan(1.0);
    expect(scale).to.be.at.most(1.55);
    expect(scale).to.be.closeTo(366 / 240, 0.02);
  });

  it('never scales focus below 1.0', () => {
    expect(focusCardScale(200)).eq(1.0);
  });

  it('caps very wide viewports', () => {
    expect(focusCardScale(1200)).eq(1.55);
  });

  it('computes grid tile scale from columns', () => {
    const s = gridCardScale(360, 3, 8);
    // (360 - 16) / 3 / 240 ≈ 0.478
    expect(s).to.be.closeTo((360 - 16) / 3 / 240, 0.01);
    expect(MOBILE_CARD_GRID_COLS.s).eq(4);
    expect(MOBILE_CARD_GRID_COLS.l).eq(2);
    expect(isMobileCardGridSize('m')).eq(true);
    expect(isMobileCardGridSize('xl')).eq(false);
    const box = gridTileSize(0.5);
    expect(box.width).eq(120);
    expect(box.height).eq(168); // 335 * 0.5 rounded
  });
});
