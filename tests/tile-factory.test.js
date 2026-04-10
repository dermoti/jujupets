import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_SIZE } from '../js/grid.js';

describe('createTileCache (PA style)', () => {
  it('returns an object with canvas for each tile type', () => {
    const cache = createTileCache();
    expect(cache.grass !== undefined).toBeTruthy();
    expect(cache.path !== undefined).toBeTruthy();
    expect(cache.floor !== undefined).toBeTruthy();
    expect(cache.wall !== undefined).toBeTruthy();
    expect(cache.fence !== undefined).toBeTruthy();
  });

  it('each cached tile is a canvas element', () => {
    const cache = createTileCache();
    expect(cache.grass instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.wall instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('grass tile has correct dimensions (32x32)', () => {
    const cache = createTileCache();
    expect(cache.grass.width).toBe(TILE_SIZE);
    expect(cache.grass.height).toBe(TILE_SIZE);
  });

  it('wall tile has same height as floor tile (32x32, no 3D extrusion)', () => {
    const cache = createTileCache();
    expect(cache.wall.height).toBe(cache.floor.height);
    expect(cache.wall.height).toBe(TILE_SIZE);
  });

  it('has no wall_back, wall_left, wall_right (unified wall)', () => {
    const cache = createTileCache();
    expect(cache.wall_back === undefined).toBeTruthy();
    expect(cache.wall_left === undefined).toBeTruthy();
    expect(cache.wall_right === undefined).toBeTruthy();
  });

  it('has grass variants and grass_flower', () => {
    const cache = createTileCache();
    expect(cache.grass2 instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.grass3 instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.grass_flower instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('water is an array of 3 canvas frames', () => {
    const cache = createTileCache();
    expect(Array.isArray(cache.water)).toBeTruthy();
    expect(cache.water.length).toBe(3);
    for (const frame of cache.water) {
      expect(frame instanceof HTMLCanvasElement).toBeTruthy();
      expect(frame.width).toBe(TILE_SIZE);
      expect(frame.height).toBe(TILE_SIZE);
    }
  });

  it('has 9 required tile types', () => {
    const cache = createTileCache();
    const canvasKeys = ['grass', 'grass2', 'grass3', 'grass_flower', 'path', 'floor', 'wall', 'fence'];
    for (const key of canvasKeys) {
      expect(cache[key] instanceof HTMLCanvasElement).toBeTruthy();
    }
    expect(Array.isArray(cache.water)).toBeTruthy();
  });
});

describe('PA tile colors', () => {
  it('grass tile center pixel is near PA green (#5a7a3a)', () => {
    const cache = createTileCache();
    const ctx = cache.grass.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #5a7a3a = rgb(90, 122, 58)
    expect(pixel[0]).toBe(90);
    expect(pixel[1]).toBe(122);
    expect(pixel[2]).toBe(58);
  });

  it('floor tile center pixel is near PA beige (#c8b8a0)', () => {
    const cache = createTileCache();
    const ctx = cache.floor.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #c8b8a0 = rgb(200, 184, 160)
    expect(pixel[0]).toBe(200);
    expect(pixel[1]).toBe(184);
    expect(pixel[2]).toBe(160);
  });

  it('path tile center pixel is near PA concrete (#a09080)', () => {
    const cache = createTileCache();
    const ctx = cache.path.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #a09080 = rgb(160, 144, 128)
    expect(pixel[0]).toBe(160);
    expect(pixel[1]).toBe(144);
    expect(pixel[2]).toBe(128);
  });
});
