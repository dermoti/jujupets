import { describe, it, expect } from '../js/test-runner.js';
import { createTileMap, ZONES } from '../js/tilemap.js';
import { MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('createTileMap', () => {
  it('has correct dimensions', () => {
    const map = createTileMap();
    expect(map.cols).toBe(MAP_COLS);
    expect(map.rows).toBe(MAP_ROWS);
  });

  it('returns grass for outer area tiles', () => {
    const map = createTileMap();
    const tile = map.getTile(1, 0);
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

  it('getZone returns dogRun for dog area', () => {
    const map = createTileMap();
    expect(map.getZone(5, 3)).toBe('dogRun');
  });

  it('getZone returns catEnclosure for cat area', () => {
    const map = createTileMap();
    expect(map.getZone(15, 11)).toBe('catEnclosure');
  });

  it('getZone returns null for unzoned area', () => {
    const map = createTileMap();
    expect(map.getZone(0, 0)).toBe(null);
  });
});

describe('tile type coverage', () => {
  it('returns wall_back for building top row', () => {
    const map = createTileMap();
    expect(map.getTile(5, 8)).toBe('wall_back');
  });

  it('returns wall_left for building left edge', () => {
    const map = createTileMap();
    expect(map.getTile(2, 12)).toBe('wall_left');
  });

  it('returns wall_right for building right edge', () => {
    const map = createTileMap();
    expect(map.getTile(11, 12)).toBe('wall_right');
  });

  it('returns fence for dog run boundary', () => {
    const map = createTileMap();
    expect(map.getTile(3, 1)).toBe('fence');
  });

  it('returns water for pond area', () => {
    const map = createTileMap();
    expect(map.getTile(1, 4)).toBe('water');
  });

  it('returns grass_flower for cat enclosure interior', () => {
    const map = createTileMap();
    expect(map.getTile(15, 11)).toBe('grass_flower');
  });

  it('returns null for out-of-bounds', () => {
    const map = createTileMap();
    expect(map.getTile(-1, 0)).toBe(null);
    expect(map.getTile(0, 24)).toBe(null);
  });
});
