import { describe, it, expect } from '../js/test-runner.js';
import { createTileMap } from '../js/tilemap.js';
import { MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('getDecoMap', () => {
  it('returns an array of MAP_ROWS rows', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    expect(deco.length).toBe(MAP_ROWS);
  });

  it('each row has MAP_COLS entries', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    for (const row of deco) {
      expect(row.length).toBe(MAP_COLS);
    }
  });

  it('most cells are null (sparse decoration)', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    let nullCount = 0;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (deco[r][c] === null) nullCount++;
      }
    }
    expect(nullCount).toBeGreaterThan(MAP_ROWS * MAP_COLS * 0.8);
  });

  it('has counter deco in reception area', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    let found = false;
    for (let r = 16; r <= 17; r++) {
      for (let c = 5; c <= 8; c++) {
        if (deco[r][c] === 'counter') found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('has food_bowl in at least one enclosure', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    let found = false;
    for (let r = 0; r < MAP_ROWS; r++) for (let c = 0; c < MAP_COLS; c++) if (deco[r][c] === 'food_bowl') found = true;
    expect(found).toBe(true);
  });

  it('has tree_oak in outdoor area', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    let found = false;
    for (let r = 0; r < MAP_ROWS; r++) for (let c = 0; c < MAP_COLS; c++) if (deco[r][c] === 'tree_oak') found = true;
    expect(found).toBe(true);
  });
});
