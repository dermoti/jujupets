import { describe, it, expect } from '../js/test-runner.js';
import { createTileMap, ZONES } from '../js/tilemap.js';
import { MAP_COLS, MAP_ROWS } from '../js/iso.js';

describe('createTileMap', () => {
  it('has correct dimensions', () => {
    const map = createTileMap();
    expect(map.cols).toBe(MAP_COLS);
    expect(map.rows).toBe(MAP_ROWS);
  });

  it('returns grass for outer area tiles', () => {
    const map = createTileMap();
    const tile = map.getTile(0, 0);
    expect(tile).toBe('grass');
  });

  it('returns floor for building interior tiles', () => {
    const map = createTileMap();
    const tile = map.getTile(5, 12);
    expect(tile).toBe('floor');
  });

  it('returns path for walkway tiles', () => {
    const map = createTileMap();
    const tile = map.getTile(6, 20);
    expect(tile).toBe('path');
  });
});

describe('ZONES', () => {
  it('has dog run zone', () => {
    expect(ZONES.dogRun).toBeTruthy();
    expect(ZONES.dogRun.minRow).toBeLessThan(ZONES.dogRun.maxRow);
  });

  it('has building zone', () => {
    expect(ZONES.building).toBeTruthy();
  });

  it('getZone returns correct zone for a building tile', () => {
    const map = createTileMap();
    const zone = map.getZone(5, 12);
    expect(zone).toBe('building');
  });
});
