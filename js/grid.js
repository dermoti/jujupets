export const TILE_SIZE = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 24;

export function toScreen(col, row) {
  return { x: col * TILE_SIZE, y: row * TILE_SIZE };
}

export function toGrid(sx, sy) {
  return { col: sx / TILE_SIZE, row: sy / TILE_SIZE };
}
