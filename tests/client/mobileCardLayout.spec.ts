import {expect} from 'chai';
import {CARD_DESIGN_WIDTH_PX, focusCardScale} from '@/client/components/mobile/mobileCardLayout';

describe('mobileCardLayout', () => {
  it('exposes the fixed card design width', () => {
    expect(CARD_DESIGN_WIDTH_PX).eq(240);
  });

  it('scales an iPhone-width viewport above 1.0 for readability', () => {
    const scale = focusCardScale(390);
    expect(scale).to.be.greaterThan(1.0);
    expect(scale).to.be.at.most(1.55);
    // 390 - 24 padding = 366 / 240 ≈ 1.525
    expect(scale).to.be.closeTo(366 / 240, 0.02);
  });

  it('never scales focus below 1.0', () => {
    expect(focusCardScale(200)).eq(1.0);
  });

  it('caps very wide viewports', () => {
    expect(focusCardScale(1200)).eq(1.55);
  });
});
