import {expect} from 'chai';
import {
  clampScale,
  clampTranslation,
  fitScale,
  initialCamera,
  panBy,
  zoomAt,
} from '@/client/utils/boardCameraMath';

describe('boardCameraMath', () => {
  const viewport = {width: 390, height: 400};
  const content = {width: 891, height: 860};

  it('fits scale to viewport width without upscaling past 1', () => {
    const s = fitScale(viewport, content, 12);
    expect(s).to.be.lessThan(1);
    expect(s).to.be.closeTo((390 - 24) / 891, 0.001);
    expect(fitScale({width: 2000, height: 2000}, {width: 100, height: 100})).eq(1);
  });

  it('clamps scale to min/max', () => {
    expect(clampScale(0.1, 0.4, 1.75)).eq(0.4);
    expect(clampScale(3, 0.4, 1.75)).eq(1.75);
    expect(clampScale(1, 0.4, 1.75)).eq(1);
  });

  it('centers content when smaller than viewport', () => {
    const cam = initialCamera({width: 400, height: 400}, {width: 100, height: 100}, 0);
    expect(cam.scale).eq(1);
    expect(cam.x).eq(150);
    expect(cam.y).eq(150);
  });

  it('pans and clamps so content cannot leave the viewport band', () => {
    // Zoomed in so the board is larger than the viewport — pan hits opposite stops.
    const start = {x: 0, y: 0, scale: 1.2};
    const panned = panBy(start, viewport, content, 5000, 5000, 12);
    const pannedOut = panBy(start, viewport, content, -5000, -5000, 12);
    expect(clampTranslation(panned, viewport, content, 12)).deep.eq(panned);
    expect(clampTranslation(pannedOut, viewport, content, 12)).deep.eq(pannedOut);
    expect(panned.x).to.be.greaterThan(pannedOut.x);
    expect(panned.y).to.be.greaterThan(pannedOut.y);
  });

  it('zooms toward a pivot without jumping the pivot world point', () => {
    const start = {x: 0, y: 0, scale: 0.5};
    const pivotX = 100;
    const pivotY = 80;
    const worldX = (pivotX - start.x) / start.scale;
    const worldY = (pivotY - start.y) / start.scale;
    const next = zoomAt(start, viewport, content, 1, pivotX, pivotY, 0.3, 1.75, 12);
    expect(next.scale).eq(1);
    expect((pivotX - next.x) / next.scale).to.be.closeTo(worldX, 0.001);
    expect((pivotY - next.y) / next.scale).to.be.closeTo(worldY, 0.001);
  });

  it('clampTranslation is idempotent at a fixed scale', () => {
    const a = clampTranslation({x: -10, y: -10, scale: 0.5}, viewport, content, 12);
    const b = clampTranslation(a, viewport, content, 12);
    expect(b).deep.eq(a);
  });
});
