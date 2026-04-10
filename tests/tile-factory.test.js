import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';

describe('createTileCache', () => {
  it('returns an object with canvas for each tile type', () => {
    const cache = createTileCache();
    expect(cache.grass !== undefined).toBeTruthy();
    expect(cache.path !== undefined).toBeTruthy();
    expect(cache.floor !== undefined).toBeTruthy();
    expect(cache.wall_back !== undefined).toBeTruthy();
    expect(cache.fence !== undefined).toBeTruthy();
  });

  it('each cached tile is a canvas element', () => {
    const cache = createTileCache();
    expect(cache.grass instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('grass tile has correct dimensions (64x32)', () => {
    const cache = createTileCache();
    expect(cache.grass.width).toBe(64);
    expect(cache.grass.height).toBe(32);
  });

  it('wall tiles are taller than floor tiles', () => {
    const cache = createTileCache();
    expect(cache.wall_back.height).toBeGreaterThan(cache.floor.height);
  });
});
