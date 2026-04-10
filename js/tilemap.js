import { MAP_COLS, MAP_ROWS } from './grid.js';

export const ZONES = {
  dogRun:       { minCol: 3,  maxCol: 10, minRow: 1,  maxRow: 6,  id: 'dogRun' },
  building:     { minCol: 2,  maxCol: 11, minRow: 8,  maxRow: 17, id: 'building' },
  catEnclosure: { minCol: 13, maxCol: 18, minRow: 9,  maxRow: 13, id: 'catEnclosure' },
  smallPetArea: { minCol: 14, maxCol: 18, minRow: 14, maxRow: 17, id: 'smallPetArea' },
  birdAviary:   { minCol: 19, maxCol: 22, minRow: 9,  maxRow: 12, id: 'birdAviary' },
  entrance:     { minCol: 4,  maxCol: 8,  minRow: 18, maxRow: 23, id: 'entrance' },
};

function inRect(col, row, zone) {
  return col >= zone.minCol && col <= zone.maxCol && row >= zone.minRow && row <= zone.maxRow;
}

export function createTileMap() {
  const tiles = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    tiles[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      tiles[row][col] = computeTileType(col, row);
    }
  }

  const decoMap = computeDecoMap(tiles);

  function getTile(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return null;
    return tiles[row][col];
  }

  function getZone(col, row) {
    for (const [name, zone] of Object.entries(ZONES)) {
      if (inRect(col, row, zone)) return name;
    }
    return null;
  }

  function getDecoMap() {
    return decoMap;
  }

  return { tiles, cols: MAP_COLS, rows: MAP_ROWS, getTile, getZone, getDecoMap };
}

function computeDecoMap(tiles) {
  const deco = [];
  for (let row = 0; row < MAP_ROWS; row++) {
    deco[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      deco[row][col] = null;
    }
  }

  // Trees at map edges (outdoor, non-zone areas)
  const treePositions = [
    { col: 0, row: 0, type: 'tree_pine' },
    { col: 1, row: 0, type: 'tree_oak' },
    { col: 23, row: 0, type: 'tree_pine' },
    { col: 0, row: 7, type: 'tree_oak' },
    { col: 22, row: 1, type: 'tree_pine' },
    { col: 23, row: 5, type: 'tree_pine' },
    { col: 0, row: 22, type: 'tree_oak' },
    { col: 1, row: 23, type: 'tree_pine' },
    { col: 23, row: 20, type: 'tree_pine' },
    { col: 22, row: 23, type: 'tree_oak' },
    { col: 12, row: 0, type: 'tree_oak' },
    { col: 20, row: 3, type: 'tree_oak' },
  ];
  for (const t of treePositions) {
    if (t.col >= 0 && t.col < MAP_COLS && t.row >= 0 && t.row < MAP_ROWS) {
      deco[t.row][t.col] = t.type;
    }
  }

  // Bushes near paths
  const bushPositions = [
    { col: 5, row: 18 }, { col: 7, row: 18 },
    { col: 5, row: 20 }, { col: 7, row: 20 },
    { col: 11, row: 18 }, { col: 13, row: 18 },
  ];
  for (const b of bushPositions) {
    if (tiles[b.row][b.col] === 'grass' || tiles[b.row][b.col] === 'grass_flower') {
      deco[b.row][b.col] = 'bush';
    }
  }

  // Bench along main path
  deco[19][5] = 'bench';
  deco[21][7] = 'bench';

  // Flower bed in front of building
  deco[7][4] = 'flower_bed';
  deco[7][8] = 'flower_bed';

  // Indoor furniture: cages (row 10-14, col 3-6)
  deco[11][4] = 'cage';
  deco[13][4] = 'cage';
  deco[11][5] = 'cage';

  // Treatment table (row 10-13, col 7-9)
  deco[11][8] = 'treatment_table';

  // Counter in reception (row 16-17, col 5-8)
  deco[16][6] = 'counter';
  deco[16][7] = 'counter';

  // Shelf in storage (row 14-16, col 9-11)
  deco[15][10] = 'shelf';

  // Food/water bowls in enclosures
  // Dog run
  deco[3][5] = 'food_bowl';
  deco[3][7] = 'water_bowl';
  deco[4][8] = 'food_bowl';

  // Cat enclosure
  deco[11][15] = 'food_bowl';
  deco[11][16] = 'water_bowl';
  deco[10][17] = 'climbing_tree';

  // Small pet area
  deco[15][16] = 'food_bowl';
  deco[16][16] = 'water_bowl';

  // Bird aviary
  deco[10][20] = 'food_bowl';
  deco[10][21] = 'water_bowl';

  return deco;
}

function computeTileType(col, row) {
  // Building interior
  if (inRect(col, row, ZONES.building)) {
    if (row === ZONES.building.minRow) return 'wall_back';
    if (col === ZONES.building.minCol) return 'wall_left';
    if (col === ZONES.building.maxCol) return 'wall_right';
    return 'floor';
  }

  // Paths
  if (col === 6 && row >= 17 && row <= 23) return 'path';
  if (row === 17 && col >= 2 && col <= 22) return 'path';
  if (col === 12 && row >= 8 && row <= 17) return 'path';
  if (row === 8 && col >= 6 && col <= 12) return 'path';

  // Fenced outdoor enclosures
  if (inRect(col, row, ZONES.dogRun)) {
    if (col === ZONES.dogRun.minCol || col === ZONES.dogRun.maxCol ||
        row === ZONES.dogRun.minRow || row === ZONES.dogRun.maxRow) return 'fence';
    return 'grass';
  }
  if (inRect(col, row, ZONES.catEnclosure)) {
    if (col === ZONES.catEnclosure.minCol || col === ZONES.catEnclosure.maxCol ||
        row === ZONES.catEnclosure.minRow || row === ZONES.catEnclosure.maxRow) return 'fence';
    return 'grass_flower';
  }
  if (inRect(col, row, ZONES.smallPetArea)) {
    if (col === ZONES.smallPetArea.minCol || col === ZONES.smallPetArea.maxCol ||
        row === ZONES.smallPetArea.minRow || row === ZONES.smallPetArea.maxRow) return 'fence';
    return 'grass';
  }
  if (inRect(col, row, ZONES.birdAviary)) {
    if (col === ZONES.birdAviary.minCol || col === ZONES.birdAviary.maxCol ||
        row === ZONES.birdAviary.minRow || row === ZONES.birdAviary.maxRow) return 'fence';
    return 'grass';
  }

  // Water feature
  if (col >= 1 && col <= 2 && row >= 4 && row <= 5) return 'water';

  // Default with flower variation
  if ((col + row) % 7 === 0) return 'grass_flower';
  return 'grass';
}
