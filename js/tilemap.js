import { MAP_COLS, MAP_ROWS } from './iso.js';

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

  return { tiles, cols: MAP_COLS, rows: MAP_ROWS, getTile, getZone };
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
