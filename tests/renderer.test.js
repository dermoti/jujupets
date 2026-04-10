import { describe, it, expect } from '../js/test-runner.js';
import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('Top-down renderer math', () => {
  it('world pixel dimensions are 768x768', () => {
    expect(MAP_COLS * TILE_SIZE).toBe(768);
    expect(MAP_ROWS * TILE_SIZE).toBe(768);
  });

  it('toScreen produces correct screen coords for projection', () => {
    const s = toScreen(5, 10);
    expect(s.x).toBe(160);
    expect(s.y).toBe(320);
  });

  it('bottom-right tile screen position is (736,736)', () => {
    const s = toScreen(MAP_COLS - 1, MAP_ROWS - 1);
    expect(s.x).toBe(736);
    expect(s.y).toBe(736);
  });
});

describe('Renderer getWorldSize', () => {
  it('returns 768x768 for PA top-down', () => {
    expect(MAP_COLS * TILE_SIZE).toBe(768);
    expect(MAP_ROWS * TILE_SIZE).toBe(768);
  });
});
