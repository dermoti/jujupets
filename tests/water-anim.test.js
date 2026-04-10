import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_SIZE } from '../js/grid.js';

describe('Water animation frames (PA style)', () => {
  it('water property is an array of 3 canvases', () => {
    const cache = createTileCache();
    expect(Array.isArray(cache.water)).toBe(true);
    expect(cache.water.length).toBe(3);
  });

  it('each water frame is a canvas element', () => {
    const cache = createTileCache();
    for (const frame of cache.water) {
      expect(frame instanceof HTMLCanvasElement).toBe(true);
    }
  });

  it('each water frame has PA tile dimensions (32x32)', () => {
    const cache = createTileCache();
    for (const frame of cache.water) {
      expect(frame.width).toBe(TILE_SIZE);
      expect(frame.height).toBe(TILE_SIZE);
    }
  });

  it('water frames differ in pixel content (wave moves)', () => {
    const cache = createTileCache();
    const ctx0 = cache.water[0].getContext('2d');
    const ctx1 = cache.water[1].getContext('2d');
    const data0 = ctx0.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
    const data1 = ctx1.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
    let diffCount = 0;
    for (let i = 0; i < data0.length; i++) {
      if (data0[i] !== data1[i]) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});
