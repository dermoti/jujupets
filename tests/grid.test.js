import { describe, it, expect } from '../js/test-runner.js';
import { toScreen, toGrid, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('grid constants', () => {
  it('TILE_SIZE is 32', () => { expect(TILE_SIZE).toBe(32); });
  it('MAP_COLS is 24', () => { expect(MAP_COLS).toBe(24); });
  it('MAP_ROWS is 24', () => { expect(MAP_ROWS).toBe(24); });
});

describe('toScreen', () => {
  it('converts origin (0,0) to pixel (0,0)', () => { const s = toScreen(0, 0); expect(s.x).toBe(0); expect(s.y).toBe(0); });
  it('converts (1,0) to (32,0)', () => { const s = toScreen(1, 0); expect(s.x).toBe(32); expect(s.y).toBe(0); });
  it('converts (0,1) to (0,32)', () => { const s = toScreen(0, 1); expect(s.x).toBe(0); expect(s.y).toBe(32); });
  it('converts (3,5) to (96,160)', () => { const s = toScreen(3, 5); expect(s.x).toBe(96); expect(s.y).toBe(160); });
  it('handles fractional grid coords', () => { const s = toScreen(1.5, 2.5); expect(s.x).toBe(48); expect(s.y).toBe(80); });
});

describe('toGrid', () => {
  it('inverts toScreen for (0,0)', () => { const g = toGrid(0, 0); expect(g.col).toBe(0); expect(g.row).toBe(0); });
  it('inverts toScreen for (32,0)', () => { const g = toGrid(32, 0); expect(g.col).toBe(1); expect(g.row).toBe(0); });
  it('inverts toScreen for (96,160)', () => { const g = toGrid(96, 160); expect(g.col).toBe(3); expect(g.row).toBe(5); });
  it('roundtrips with toScreen', () => { const s = toScreen(7, 13); const g = toGrid(s.x, s.y); expect(g.col).toBe(7); expect(g.row).toBe(13); });
});
