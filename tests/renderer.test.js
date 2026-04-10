import { describe, it, expect } from '../js/test-runner.js';
import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('Isometric renderer math', () => {
  it('map pixel dimensions are consistent', () => {
    const right = worldToScreen(MAP_COLS - 1, 0, TILE_W, TILE_H);
    const left = worldToScreen(0, MAP_ROWS - 1, TILE_W, TILE_H);
    const worldW = right.x - left.x + TILE_W;
    expect(worldW).toBeGreaterThan(640);
  });

  it('bottom of map is below canvas height', () => {
    const bottom = worldToScreen(MAP_COLS - 1, MAP_ROWS - 1, TILE_W, TILE_H);
    expect(bottom.y + TILE_H).toBeGreaterThan(480);
  });
});
