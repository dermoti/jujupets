export function worldToScreen(col, row, tileW, tileH) {
  return {
    x: (col - row) * (tileW / 2),
    y: (col + row) * (tileH / 2),
  };
}

export function screenToWorld(sx, sy, tileW, tileH) {
  return {
    col: (sx / (tileW / 2) + sy / (tileH / 2)) / 2,
    row: (sy / (tileH / 2) - sx / (tileW / 2)) / 2,
  };
}

export function depthKey(col, row, height) {
  return (row + col) * 100 + height;
}

export const TILE_W = 64;
export const TILE_H = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 24;
