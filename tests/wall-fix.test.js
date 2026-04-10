import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_W, TILE_H } from '../js/iso.js';

describe('Wall-tile fix', () => {
  it('wall_back top-left quadrant has roof color, not wall color', () => {
    const cache = createTileCache();
    const ctx = cache.wall_back.getContext('2d');
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2 - 2, 1, 1).data;
    expect(pixel[0]).toBe(139);
    expect(pixel[1]).toBe(69);
    expect(pixel[2]).toBe(19);
  });

  it('wall_back wall face starts below the diamond', () => {
    const cache = createTileCache();
    const ctx = cache.wall_back.getContext('2d');
    const wallH = cache.wall_back.height;
    const sampleY = TILE_H + Math.floor((wallH - TILE_H) / 2);
    const pixel = ctx.getImageData(TILE_W / 2 + 8, sampleY, 1, 1).data;
    expect(pixel[0]).toBe(196);
    expect(pixel[1]).toBe(145);
    expect(pixel[2]).toBe(85);
  });

  it('wall_left wall face occupies area below diamond only', () => {
    const cache = createTileCache();
    const ctx = cache.wall_left.getContext('2d');
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2, 1, 1).data;
    expect(pixel[0]).toBe(196);
    expect(pixel[1]).toBe(145);
    expect(pixel[2]).toBe(85);
  });

  it('wall_right wall face occupies area below diamond only', () => {
    const cache = createTileCache();
    const ctx = cache.wall_right.getContext('2d');
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2, 1, 1).data;
    expect(pixel[0]).toBe(184);
    expect(pixel[1]).toBe(131);
    expect(pixel[2]).toBe(74);
  });
});
