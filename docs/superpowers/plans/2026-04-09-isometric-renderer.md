# Isometric Renderer & UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat grid renderer with an animated isometric pixel-art engine featuring a cutaway building, outdoor areas, animated sprites, camera scrolling, and a warm wood/parchment UI theme.

**Architecture:** Isometric tile-based rendering on a 640x480 Canvas. Pure math module (`iso.js`) handles coordinate transforms. `tilemap.js` defines the 24x24 shelter layout with zones. `tile-factory.js` and `sprite-factory.js` procedurally generate all tile and sprite graphics into offscreen canvases (no external PNG assets needed for v1). `camera.js` handles viewport scrolling. The rewritten `renderer.js` orchestrates depth-sorted rendering. CSS/HTML get a warm wood/parchment theme with pixel font.

**Tech Stack:** Vanilla HTML5 Canvas 2D, ES Modules, OffscreenCanvas for sprite caching, CSS gradients for UI textures

---

## File Map

| File | Responsibility |
|------|---------------|
| `js/iso.js` | Pure isometric math: worldToScreen, screenToWorld, depthSort |
| `js/camera.js` | Camera position, WASD/drag scrolling, bounds clamping |
| `js/tilemap.js` | 24x24 tile map data, zone definitions, tile-type lookups |
| `js/tile-factory.js` | Procedurally draw tile graphics (grass, path, floor, walls, fence) into cached canvases |
| `js/sprite-factory.js` | Procedurally draw animal and staff sprites with animation frames into cached canvases |
| `js/sprites.js` | Animation controller: frame timing, animation state per entity, draw from cached sheets |
| `js/renderer.js` | Rewrite: isometric render loop, depth sorting, draws tiles + sprites + deco via camera |
| `js/ui.js` | Modify: update createUI for new theme (mini-portraits, holz-buttons). Pure functions unchanged. |
| `css/style.css` | Rewrite: wood/parchment theme, pixel font, 640x480 canvas, warm palette |
| `index.html` | Modify: canvas 640x480, updated layout dimensions |
| `js/main.js` | Modify: camera init, keyboard/mouse handlers, asset preloading |
| `tests/iso.test.js` | Tests: worldToScreen, screenToWorld, depthSort |
| `tests/camera.test.js` | Tests: move, clamp, worldBounds |
| `tests/tilemap.test.js` | Tests: getTile, getZone, zone boundaries |
| `tests/tile-factory.test.js` | Tests: tile cache creation, tile type coverage |
| `tests/sprite-factory.test.js` | Tests: sprite sheet dimensions, animation frame counts |

---

### Task 1: Isometric Math Module

**Files:**
- Create: `js/iso.js`
- Create: `tests/iso.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write iso tests**

```js
// tests/iso.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { worldToScreen, screenToWorld, depthKey } from '../js/iso.js';

const TILE_W = 64;
const TILE_H = 32;

describe('worldToScreen', () => {
  it('converts origin (0,0) to screen center offset', () => {
    const s = worldToScreen(0, 0, TILE_W, TILE_H);
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
  });

  it('moves right along col axis (down-right on screen)', () => {
    const s = worldToScreen(1, 0, TILE_W, TILE_H);
    expect(s.x).toBe(32);
    expect(s.y).toBe(16);
  });

  it('moves down along row axis (down-left on screen)', () => {
    const s = worldToScreen(0, 1, TILE_W, TILE_H);
    expect(s.x).toBe(-32);
    expect(s.y).toBe(16);
  });

  it('col=1,row=1 moves straight down', () => {
    const s = worldToScreen(1, 1, TILE_W, TILE_H);
    expect(s.x).toBe(0);
    expect(s.y).toBe(32);
  });
});

describe('screenToWorld', () => {
  it('inverts worldToScreen for (1,0)', () => {
    const w = screenToWorld(32, 16, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(1);
    expect(Math.round(w.row)).toBe(0);
  });

  it('inverts worldToScreen for (0,1)', () => {
    const w = screenToWorld(-32, 16, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(0);
    expect(Math.round(w.row)).toBe(1);
  });

  it('inverts worldToScreen for (3,5)', () => {
    const s = worldToScreen(3, 5, TILE_W, TILE_H);
    const w = screenToWorld(s.x, s.y, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(3);
    expect(Math.round(w.row)).toBe(5);
  });
});

describe('depthKey', () => {
  it('returns higher values for tiles further down-screen', () => {
    expect(depthKey(0, 0, 0)).toBeLessThan(depthKey(1, 1, 0));
  });

  it('uses height as tiebreaker', () => {
    expect(depthKey(1, 1, 0)).toBeLessThan(depthKey(1, 1, 1));
  });

  it('row+col dominates over height', () => {
    expect(depthKey(2, 2, 0)).toBeGreaterThan(depthKey(1, 1, 10));
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/iso.test.js';` before runAll() in test.html.

- [ ] **Step 3: Run tests — expect failure**

Expected: Import error, `js/iso.js` does not exist.

- [ ] **Step 4: Implement js/iso.js**

```js
// js/iso.js

/**
 * Convert world (col, row) to screen (x, y) pixel position.
 * Returns the top-center of the isometric diamond for that tile.
 */
export function worldToScreen(col, row, tileW, tileH) {
  return {
    x: (col - row) * (tileW / 2),
    y: (col + row) * (tileH / 2),
  };
}

/**
 * Convert screen (x, y) back to fractional world (col, row).
 * Caller should Math.floor() for tile lookup.
 */
export function screenToWorld(sx, sy, tileW, tileH) {
  return {
    col: (sx / (tileW / 2) + sy / (tileH / 2)) / 2,
    row: (sy / (tileH / 2) - sx / (tileW / 2)) / 2,
  };
}

/**
 * Depth-sort key. Higher = rendered later (in front).
 * Primary: row + col. Tiebreaker: height layer (0=ground, 1=object, 2=tall).
 */
export function depthKey(col, row, height) {
  return (row + col) * 100 + height;
}

/** Constants shared across modules */
export const TILE_W = 64;
export const TILE_H = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 24;
```

- [ ] **Step 5: Run tests — expect pass**

- [ ] **Step 6: Commit**

```bash
git add js/iso.js tests/iso.test.js test.html
git commit -m "feat: add isometric math module with coordinate transforms and depth sorting"
```

---

### Task 2: Camera System

**Files:**
- Create: `js/camera.js`
- Create: `tests/camera.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write camera tests**

```js
// tests/camera.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createCamera } from '../js/camera.js';

describe('createCamera', () => {
  it('starts at position (0, 0)', () => {
    const cam = createCamera(640, 480, 1536, 768);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('moves by delta', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(100, 50);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(50);
  });

  it('clamps to world bounds (no negative)', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(-100, -50);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('clamps to max bounds', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(9999, 9999);
    expect(cam.x).toBe(1536 - 640);
    expect(cam.y).toBe(768 - 480);
  });

  it('centerOn sets camera to center a world point', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.centerOn(400, 300);
    expect(cam.x).toBe(400 - 320);
    expect(cam.y).toBe(300 - 240);
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/camera.test.js';` before runAll().

- [ ] **Step 3: Run tests — expect failure**

- [ ] **Step 4: Implement js/camera.js**

```js
// js/camera.js

export function createCamera(viewW, viewH, worldW, worldH) {
  let x = 0;
  let y = 0;

  function clamp() {
    const maxX = Math.max(0, worldW - viewW);
    const maxY = Math.max(0, worldH - viewH);
    x = Math.max(0, Math.min(maxX, x));
    y = Math.max(0, Math.min(maxY, y));
  }

  return {
    get x() { return x; },
    get y() { return y; },
    get viewW() { return viewW; },
    get viewH() { return viewH; },

    move(dx, dy) {
      x += dx;
      y += dy;
      clamp();
    },

    centerOn(wx, wy) {
      x = wx - viewW / 2;
      y = wy - viewH / 2;
      clamp();
    },

    setPosition(nx, ny) {
      x = nx;
      y = ny;
      clamp();
    },
  };
}
```

- [ ] **Step 5: Run tests — expect pass**

- [ ] **Step 6: Commit**

```bash
git add js/camera.js tests/camera.test.js test.html
git commit -m "feat: add camera system with scrolling and bounds clamping"
```

---

### Task 3: Tile Map

**Files:**
- Create: `js/tilemap.js`
- Create: `tests/tilemap.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write tilemap tests**

```js
// tests/tilemap.test.js
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
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/tilemap.test.js';` before runAll().

- [ ] **Step 3: Run tests — expect failure**

- [ ] **Step 4: Implement js/tilemap.js**

```js
// js/tilemap.js
import { MAP_COLS, MAP_ROWS } from './iso.js';

export const ZONES = {
  dogRun:       { minCol: 3,  maxCol: 10, minRow: 1,  maxRow: 6,  id: 'dogRun' },
  building:     { minCol: 2,  maxCol: 11, minRow: 8,  maxRow: 17, id: 'building' },
  catEnclosure: { minCol: 13, maxCol: 18, minRow: 9,  maxRow: 13, id: 'catEnclosure' },
  smallPetArea: { minCol: 14, maxCol: 18, minRow: 14, maxRow: 17, id: 'smallPetArea' },
  birdAviary:   { minCol: 19, maxCol: 22, minRow: 9,  maxRow: 12, id: 'birdAviary' },
  entrance:     { minCol: 4,  maxCol: 8,  minRow: 18, maxRow: 23, id: 'entrance' },
};

// Building sub-zones
const ROOMS = {
  reception:  { minCol: 5,  maxCol: 8,  minRow: 16, maxRow: 17 },
  cages:      { minCol: 3,  maxCol: 6,  minRow: 10, maxRow: 14 },
  treatment:  { minCol: 7,  maxCol: 9,  minRow: 10, maxRow: 13 },
  storage:    { minCol: 9,  maxCol: 11, minRow: 14, maxRow: 16 },
};

function inRect(col, row, zone) {
  return col >= zone.minCol && col <= zone.maxCol && row >= zone.minRow && row <= zone.maxRow;
}

export function createTileMap() {
  // Build the 24x24 grid
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

  return {
    tiles,
    cols: MAP_COLS,
    rows: MAP_ROWS,
    getTile,
    getZone,
  };
}

function computeTileType(col, row) {
  // Building interior
  if (inRect(col, row, ZONES.building)) {
    // Walls
    if (row === ZONES.building.minRow) return 'wall_back';
    if (col === ZONES.building.minCol) return 'wall_left';
    if (col === ZONES.building.maxCol) return 'wall_right';
    return 'floor';
  }

  // Paths — main walkway from entrance to building and enclosures
  if (col === 6 && row >= 17 && row <= 23) return 'path';
  if (row === 17 && col >= 2 && col <= 22) return 'path';
  if (col === 12 && row >= 8 && row <= 17) return 'path';
  if (row === 8 && col >= 6 && col <= 12) return 'path';

  // Fences around outdoor enclosures
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

  // Default outdoor
  // Add some flower variation
  if ((col + row) % 7 === 0) return 'grass_flower';
  return 'grass';
}
```

- [ ] **Step 5: Run tests — expect pass**

- [ ] **Step 6: Commit**

```bash
git add js/tilemap.js tests/tilemap.test.js test.html
git commit -m "feat: add 24x24 tile map with shelter zones and tile type computation"
```

---

### Task 4: Tile Factory (Procedural Tile Graphics)

**Files:**
- Create: `js/tile-factory.js`
- Create: `tests/tile-factory.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write tile factory tests**

```js
// tests/tile-factory.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';

describe('createTileCache', () => {
  it('returns an object with canvas for each tile type', () => {
    const cache = createTileCache();
    expect(cache.grass !== undefined).toBeTruthy();
    expect(cache.path !== undefined).toBeTruthy();
    expect(cache.floor !== undefined).toBeTruthy();
    expect(cache.wall_back !== undefined).toBeTruthy();
    expect(cache.fence !== undefined).toBeTruthy();
  });

  it('each cached tile is a canvas element', () => {
    const cache = createTileCache();
    expect(cache.grass instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('grass tile has correct dimensions (64x32)', () => {
    const cache = createTileCache();
    expect(cache.grass.width).toBe(64);
    expect(cache.grass.height).toBe(32);
  });

  it('wall tiles are taller than floor tiles', () => {
    const cache = createTileCache();
    expect(cache.wall_back.height).toBeGreaterThan(cache.floor.height);
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/tile-factory.test.js';` before runAll().

- [ ] **Step 3: Run tests — expect failure**

- [ ] **Step 4: Implement js/tile-factory.js**

```js
// js/tile-factory.js
import { TILE_W, TILE_H } from './iso.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawDiamond(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(w / 2, h);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.fill();
}

function drawDiamondOutline(ctx, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(w / 2, h);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawGrass(variant) {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  const colors = ['#7CB342', '#689F38', '#8BC34A'];
  drawDiamond(ctx, TILE_W, TILE_H, colors[variant % 3]);
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#558B2F');
  // Grass texture dots
  ctx.fillStyle = '#9CCC65';
  for (let i = 0; i < 5; i++) {
    const gx = 16 + Math.floor(Math.sin(i * 2.1 + variant) * 12);
    const gy = 8 + Math.floor(Math.cos(i * 1.7 + variant) * 6);
    ctx.fillRect(gx, gy, 2, 1);
  }
  return c;
}

function drawGrassFlower() {
  const c = drawGrass(1);
  const ctx = c.getContext('2d');
  // Small flowers
  ctx.fillStyle = '#E91E63';
  ctx.fillRect(28, 12, 3, 3);
  ctx.fillStyle = '#FF9800';
  ctx.fillRect(38, 18, 3, 3);
  ctx.fillStyle = '#FFEB3B';
  ctx.fillRect(22, 20, 2, 2);
  return c;
}

function drawPath() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#D7A86E');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#C49155');
  // Sand texture
  ctx.fillStyle = '#E0C8A0';
  for (let i = 0; i < 4; i++) {
    const px = 20 + i * 8;
    const py = 12 + (i % 2) * 6;
    ctx.fillRect(px, py, 2, 1);
  }
  return c;
}

function drawFloor() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#C49155');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#A0724A');
  // Wood plank lines
  ctx.strokeStyle = '#B8834A';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(16, 12);
  ctx.lineTo(48, 12);
  ctx.moveTo(10, 18);
  ctx.lineTo(54, 18);
  ctx.moveTo(16, 24);
  ctx.lineTo(48, 24);
  ctx.stroke();
  return c;
}

function drawWallBack() {
  const wallH = 48; // Taller than a flat tile
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Wall face (vertical part)
  ctx.fillStyle = '#D7A86E';
  ctx.beginPath();
  ctx.moveTo(0, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.lineTo(0, TILE_H / 2 - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W, TILE_H / 2 - 16);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.closePath();
  ctx.fill();
  // Top cap
  drawDiamond(ctx, TILE_W, TILE_H, '#8B4513');
  return c;
}

function drawWallLeft() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Left wall face
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(0, TILE_H / 2);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(0, wallH - TILE_H / 2);
  ctx.closePath();
  ctx.fill();
  // Top
  drawDiamond(ctx, TILE_W, TILE_H, '#C49155');
  return c;
}

function drawWallRight() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Right wall face
  ctx.fillStyle = '#B8834A';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, 0);
  ctx.lineTo(TILE_W, TILE_H / 2);
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.closePath();
  ctx.fill();
  // Top
  drawDiamond(ctx, TILE_W, TILE_H, '#B8834A');
  return c;
}

function drawFence() {
  const fenceH = 40;
  const c = makeCanvas(TILE_W, fenceH);
  const ctx = c.getContext('2d');
  // Base diamond
  const baseY = fenceH - TILE_H;
  ctx.save();
  ctx.translate(0, baseY);
  drawDiamond(ctx, TILE_W, TILE_H, '#689F38');
  ctx.restore();
  // Fence posts
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(10, baseY - 8, 3, 16);
  ctx.fillRect(30, baseY - 8, 3, 16);
  ctx.fillRect(50, baseY - 8, 3, 16);
  // Fence rail
  ctx.fillStyle = '#A0724A';
  ctx.fillRect(10, baseY - 4, 43, 2);
  ctx.fillRect(10, baseY + 2, 43, 2);
  return c;
}

function drawWater() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#42A5F5');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#1E88E5');
  // Ripple effect
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(TILE_W / 2, TILE_H / 2, 6, 0, Math.PI);
  ctx.stroke();
  return c;
}

export function createTileCache() {
  return {
    grass: drawGrass(0),
    grass2: drawGrass(1),
    grass3: drawGrass(2),
    grass_flower: drawGrassFlower(),
    path: drawPath(),
    floor: drawFloor(),
    wall_back: drawWallBack(),
    wall_left: drawWallLeft(),
    wall_right: drawWallRight(),
    fence: drawFence(),
    water: drawWater(),
  };
}
```

- [ ] **Step 5: Run tests — expect pass**

- [ ] **Step 6: Commit**

```bash
git add js/tile-factory.js tests/tile-factory.test.js test.html
git commit -m "feat: add procedural tile factory for isometric tile graphics"
```

---

### Task 5: Sprite Factory (Procedural Animal & Staff Sprites)

**Files:**
- Create: `js/sprite-factory.js`
- Create: `tests/sprite-factory.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write sprite factory tests**

```js
// tests/sprite-factory.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet } from '../js/sprite-factory.js';

describe('createAnimalSpriteSheet', () => {
  it('returns a canvas for dog', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('has correct width for 4 frames', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.width).toBe(32 * 4);
  });

  it('has correct height for 4 animation rows', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.height).toBe(32 * 4);
  });

  it('creates sheets for all 5 species', () => {
    for (const species of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
      const sheet = createAnimalSpriteSheet(species);
      expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
    }
  });
});

describe('createStaffSpriteSheet', () => {
  it('returns a canvas for caretaker', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('has correct width for 6 frames', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.width).toBe(32 * 6);
  });

  it('has correct height for 3 animation rows', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.height).toBe(48 * 3);
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/sprite-factory.test.js';` before runAll().

- [ ] **Step 3: Run tests — expect failure**

- [ ] **Step 4: Implement js/sprite-factory.js**

```js
// js/sprite-factory.js

const ANIMAL_W = 32;
const ANIMAL_H = 32;
const ANIMAL_FRAMES = 4;
const ANIMAL_ANIMS = 4; // idle, happy, sad, eating

const STAFF_W = 32;
const STAFF_H = 48;
const STAFF_FRAMES = 6;
const STAFF_ANIMS = 3; // idle, walk, work

const SPECIES_PALETTE = {
  dog:      { body: '#C8A070', dark: '#A07848', ear: '#8B6914', eye: '#333' },
  cat:      { body: '#9E9E9E', dark: '#757575', ear: '#BDBDBD', eye: '#4CAF50' },
  rabbit:   { body: '#E0C8A0', dark: '#C8A878', ear: '#F5E0C0', eye: '#E91E63' },
  smallpet: { body: '#D0B080', dark: '#B89060', ear: '#E8D0A8', eye: '#333' },
  bird:     { body: '#4FC3F7', dark: '#0288D1', ear: '#FF9800', eye: '#333' },
};

const ROLE_PALETTE = {
  caretaker:  { shirt: '#4CAF50', pants: '#795548', skin: '#FFCC80', hair: '#5D4037' },
  vet:        { shirt: '#FFFFFF', pants: '#90CAF9', skin: '#FFCC80', hair: '#333333' },
  trainer:    { shirt: '#FF9800', pants: '#616161', skin: '#FFCC80', hair: '#D84315' },
  matchmaker: { shirt: '#CE93D8', pants: '#424242', skin: '#FFCC80', hair: '#F9A825' },
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawAnimalFrame(ctx, x, y, palette, anim, frame) {
  const cx = x + ANIMAL_W / 2;
  const cy = y + ANIMAL_H / 2;

  // Body bob based on animation
  let bobY = 0;
  if (anim === 0) bobY = Math.sin(frame * 1.5) * 1; // idle: slight bob
  if (anim === 1) bobY = -2 + frame; // happy: bouncing
  if (anim === 2) bobY = 2; // sad: lowered
  if (anim === 3) bobY = frame % 2 === 0 ? -1 : 1; // eating: pecking

  const by = cy + bobY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ANIMAL_H - 4, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = palette.body;
  ctx.fillRect(cx - 8, by - 4, 16, 12);

  // Head
  ctx.fillStyle = palette.body;
  ctx.fillRect(cx - 6, by - 12, 12, 10);

  // Ears
  ctx.fillStyle = palette.ear;
  ctx.fillRect(cx - 6, by - 16, 4, 5);
  ctx.fillRect(cx + 2, by - 16, 4, 5);

  // Eyes
  ctx.fillStyle = palette.eye;
  ctx.fillRect(cx - 4, by - 9, 2, 2);
  ctx.fillRect(cx + 2, by - 9, 2, 2);

  // Nose
  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 1, by - 6, 2, 2);

  // Legs
  ctx.fillStyle = palette.dark;
  const legOffset = anim === 1 ? (frame % 2) * 2 : 0;
  ctx.fillRect(cx - 6, by + 8, 3, 5 + legOffset);
  ctx.fillRect(cx + 3, by + 8, 3, 5 - legOffset);

  // Tail (happy animation: wagging)
  if (anim === 1) {
    ctx.fillStyle = palette.body;
    const tailX = cx + 8 + Math.sin(frame * 2) * 3;
    ctx.fillRect(tailX, by - 2, 4, 3);
  }
}

export function createAnimalSpriteSheet(speciesKey) {
  const c = makeCanvas(ANIMAL_W * ANIMAL_FRAMES, ANIMAL_H * ANIMAL_ANIMS);
  const ctx = c.getContext('2d');
  const palette = SPECIES_PALETTE[speciesKey] || SPECIES_PALETTE.dog;

  for (let anim = 0; anim < ANIMAL_ANIMS; anim++) {
    for (let frame = 0; frame < ANIMAL_FRAMES; frame++) {
      drawAnimalFrame(ctx, frame * ANIMAL_W, anim * ANIMAL_H, palette, anim, frame);
    }
  }
  return c;
}

function drawStaffFrame(ctx, x, y, palette, anim, frame) {
  const cx = x + STAFF_W / 2;
  const footY = y + STAFF_H - 4;

  let bobY = 0;
  let legAnim = 0;
  if (anim === 1) { bobY = Math.sin(frame * 1.2) * 1; legAnim = frame; } // walk
  if (anim === 2) { bobY = frame % 2 === 0 ? -1 : 0; } // work

  const headY = y + 4 + bobY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, footY + 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = palette.pants;
  const lStep = Math.sin(legAnim * 1.5) * 3;
  ctx.fillRect(cx - 5, footY - 14, 4, 14 + lStep);
  ctx.fillRect(cx + 1, footY - 14, 4, 14 - lStep);

  // Shoes
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(cx - 6, footY, 5, 3);
  ctx.fillRect(cx + 1, footY, 5, 3);

  // Body/shirt
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(cx - 7, headY + 14, 14, 16);

  // Arms
  const armSwing = anim === 2 ? Math.sin(frame * 2) * 4 : 0;
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(cx - 10, headY + 16 + armSwing, 4, 12);
  ctx.fillRect(cx + 6, headY + 16 - armSwing, 4, 12);

  // Hands
  ctx.fillStyle = palette.skin;
  ctx.fillRect(cx - 10, headY + 26 + armSwing, 4, 3);
  ctx.fillRect(cx + 6, headY + 26 - armSwing, 4, 3);

  // Head
  ctx.fillStyle = palette.skin;
  ctx.fillRect(cx - 5, headY + 2, 10, 12);

  // Hair
  ctx.fillStyle = palette.hair;
  ctx.fillRect(cx - 6, headY, 12, 5);

  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(cx - 3, headY + 6, 2, 2);
  ctx.fillRect(cx + 1, headY + 6, 2, 2);

  // Mouth
  ctx.fillStyle = '#C49155';
  ctx.fillRect(cx - 1, headY + 10, 2, 1);
}

export function createStaffSpriteSheet(roleKey) {
  const c = makeCanvas(STAFF_W * STAFF_FRAMES, STAFF_H * STAFF_ANIMS);
  const ctx = c.getContext('2d');
  const palette = ROLE_PALETTE[roleKey] || ROLE_PALETTE.caretaker;

  for (let anim = 0; anim < STAFF_ANIMS; anim++) {
    for (let frame = 0; frame < STAFF_FRAMES; frame++) {
      drawStaffFrame(ctx, frame * STAFF_W, anim * STAFF_H, palette, anim, frame);
    }
  }
  return c;
}

export const ANIMAL_SPRITE = { W: ANIMAL_W, H: ANIMAL_H, FRAMES: ANIMAL_FRAMES, ANIMS: ANIMAL_ANIMS };
export const STAFF_SPRITE = { W: STAFF_W, H: STAFF_H, FRAMES: STAFF_FRAMES, ANIMS: STAFF_ANIMS };
```

- [ ] **Step 5: Run tests — expect pass**

- [ ] **Step 6: Commit**

```bash
git add js/sprite-factory.js tests/sprite-factory.test.js test.html
git commit -m "feat: add procedural sprite factory for animals and staff with animations"
```

---

### Task 6: Animation Controller

**Files:**
- Create: `js/sprites.js`

- [ ] **Step 1: Implement js/sprites.js**

```js
// js/sprites.js
import { ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';

/**
 * Manages animation state for a single entity.
 * Call update() each frame, then use getFrame() to know which sprite-sheet rect to draw.
 */
export function createAnimState(spriteInfo) {
  let anim = 0;
  let frame = 0;
  let timer = 0;
  const frameMs = 200; // ms per frame

  return {
    setAnim(newAnim) {
      if (anim !== newAnim) {
        anim = newAnim;
        frame = 0;
        timer = 0;
      }
    },

    update(dt) {
      timer += dt;
      if (timer >= frameMs) {
        timer -= frameMs;
        frame = (frame + 1) % spriteInfo.FRAMES;
      }
    },

    getFrame() {
      return {
        sx: frame * spriteInfo.W,
        sy: anim * spriteInfo.H,
        sw: spriteInfo.W,
        sh: spriteInfo.H,
      };
    },

    get currentAnim() { return anim; },
    get currentFrame() { return frame; },
  };
}

/**
 * Determine which animation row to use for an animal based on its stats.
 * 0=idle, 1=happy, 2=sad, 3=eating
 */
export function animalAnimFromStats(animal) {
  if (animal._eating) return 3;
  if (animal.stats.happiness > 0.7) return 1;
  if (animal.stats.happiness < 0.3) return 2;
  return 0;
}

/**
 * Determine which animation row to use for staff.
 * 0=idle, 1=walk, 2=work
 */
export function staffAnimFromState(staff) {
  if (staff._working) return 2;
  if (staff.assignedAnimalId !== null) return 1;
  return 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/sprites.js
git commit -m "feat: add animation controller for sprite frame timing and state selection"
```

---

### Task 7: Isometric Renderer Rewrite

**Files:**
- Rewrite: `js/renderer.js`
- Rewrite: `tests/renderer.test.js`

- [ ] **Step 1: Rewrite renderer tests**

```js
// tests/renderer.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { worldToScreen, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from '../js/iso.js';

describe('Isometric renderer math', () => {
  it('map pixel dimensions are consistent', () => {
    // The rightmost point is at col=MAP_COLS-1, row=0
    const right = worldToScreen(MAP_COLS - 1, 0, TILE_W, TILE_H);
    // The leftmost point is at col=0, row=MAP_ROWS-1
    const left = worldToScreen(0, MAP_ROWS - 1, TILE_W, TILE_H);
    // World width = right.x - left.x + TILE_W
    const worldW = right.x - left.x + TILE_W;
    expect(worldW).toBeGreaterThan(640);
  });

  it('bottom of map is below canvas height', () => {
    const bottom = worldToScreen(MAP_COLS - 1, MAP_ROWS - 1, TILE_W, TILE_H);
    expect(bottom.y + TILE_H).toBeGreaterThan(480);
  });
});
```

- [ ] **Step 2: Rewrite js/renderer.js**

```js
// js/renderer.js
import { worldToScreen, depthKey, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from './iso.js';
import { createTileCache } from './tile-factory.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';
import { createAnimState, animalAnimFromStats, staffAnimFromState } from './sprites.js';
import { SPECIES } from './data.js';

export function createRenderer(canvas, tileMap) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Pre-generate all tile graphics
  const tileCache = createTileCache();

  // Pre-generate sprite sheets for each species and role
  const animalSheets = {};
  for (const key of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
    animalSheets[key] = createAnimalSpriteSheet(key);
  }
  const staffSheets = {};
  for (const key of ['caretaker', 'vet', 'trainer', 'matchmaker']) {
    staffSheets[key] = createStaffSpriteSheet(key);
  }

  // Animation states keyed by entity id
  const animalAnims = new Map();
  const staffAnims = new Map();

  // Map offset: shift so that (0,0) tile top-center is visible
  // The leftmost screen point is at (col=0, row=MAP_ROWS-1)
  const topLeft = worldToScreen(0, 0, TILE_W, TILE_H);
  const leftMost = worldToScreen(0, MAP_ROWS - 1, TILE_W, TILE_H);
  const mapOffsetX = -leftMost.x + TILE_W / 2;
  const mapOffsetY = 0;

  // Calculate world pixel dimensions for camera bounds
  const rightMost = worldToScreen(MAP_COLS - 1, 0, TILE_W, TILE_H);
  const bottomMost = worldToScreen(MAP_COLS - 1, MAP_ROWS - 1, TILE_W, TILE_H);
  const worldPixelW = (rightMost.x - leftMost.x) + TILE_W + mapOffsetX;
  const worldPixelH = bottomMost.y + TILE_H * 2;

  function getWorldSize() {
    return { w: worldPixelW, h: worldPixelH };
  }

  function render(state, camera, dt) {
    // Sky gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B3E5FC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Collect all renderables and sort by depth
    const renderables = [];

    // Ground tiles
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileType = tileMap.getTile(col, row);
        if (!tileType) continue;
        const screen = worldToScreen(col, row, TILE_W, TILE_H);
        const sx = screen.x + mapOffsetX - camera.x;
        const sy = screen.y + mapOffsetY - camera.y;

        // Frustum culling
        if (sx + TILE_W < 0 || sx > W || sy + 64 < 0 || sy > H) continue;

        let tileCanvas = tileCache[tileType];
        // Grass variation
        if (tileType === 'grass') {
          const variant = (col * 7 + row * 13) % 3;
          tileCanvas = variant === 0 ? tileCache.grass : variant === 1 ? tileCache.grass2 : tileCache.grass3;
        }
        if (!tileCanvas) tileCanvas = tileCache.grass;

        const heightOffset = tileCanvas.height - TILE_H;
        renderables.push({
          depth: depthKey(col, row, 0),
          draw() {
            ctx.drawImage(tileCanvas, sx, sy - heightOffset);
          }
        });
      }
    }

    // Animals
    for (const animal of state.animals) {
      // Determine which zone/tile the animal is on
      const pos = getAnimalPosition(animal, tileMap);
      const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
      const sx = screen.x + mapOffsetX - camera.x + TILE_W / 2 - ANIMAL_SPRITE.W / 2;
      const sy = screen.y + mapOffsetY - camera.y - ANIMAL_SPRITE.H + TILE_H / 2;

      if (sx + ANIMAL_SPRITE.W < 0 || sx > W || sy + ANIMAL_SPRITE.H < 0 || sy > H) continue;

      // Animation
      if (!animalAnims.has(animal.id)) {
        animalAnims.set(animal.id, createAnimState(ANIMAL_SPRITE));
      }
      const animState = animalAnims.get(animal.id);
      animState.setAnim(animalAnimFromStats(animal));
      animState.update(dt);
      const frame = animState.getFrame();

      const sheet = animalSheets[animal.species] || animalSheets.dog;

      renderables.push({
        depth: depthKey(pos.col, pos.row, 1),
        draw() {
          ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, sx, sy, ANIMAL_SPRITE.W, ANIMAL_SPRITE.H);
          // Name label
          ctx.fillStyle = '#4E342E';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(animal.name, sx + ANIMAL_SPRITE.W / 2, sy + ANIMAL_SPRITE.H + 8);
        }
      });
    }

    // Staff
    for (const staff of state.staff) {
      const pos = getStaffPosition(staff, state, tileMap);
      const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
      const sx = screen.x + mapOffsetX - camera.x + TILE_W / 2 - STAFF_SPRITE.W / 2;
      const sy = screen.y + mapOffsetY - camera.y - STAFF_SPRITE.H + TILE_H / 2;

      if (sx + STAFF_SPRITE.W < 0 || sx > W || sy + STAFF_SPRITE.H < 0 || sy > H) continue;

      if (!staffAnims.has(staff.id)) {
        staffAnims.set(staff.id, createAnimState(STAFF_SPRITE));
      }
      const animState = staffAnims.get(staff.id);
      animState.setAnim(staffAnimFromState(staff));
      animState.update(dt);
      const frame = animState.getFrame();

      const sheet = staffSheets[staff.role] || staffSheets.caretaker;

      renderables.push({
        depth: depthKey(pos.col, pos.row, 1),
        draw() {
          ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, sx, sy, STAFF_SPRITE.W, STAFF_SPRITE.H);
        }
      });
    }

    // Sort by depth and draw
    renderables.sort((a, b) => a.depth - b.depth);
    for (const r of renderables) {
      r.draw();
    }
  }

  return { render, getWorldSize };
}

/**
 * Simple position assignment for animals based on their species and index.
 * Places animals in the appropriate zone based on species.
 */
function getAnimalPosition(animal, tileMap) {
  // Use animal.id to get a stable position within the zone
  const zone = getZoneForSpecies(animal.species);
  if (!zone) return { col: 6, row: 20 }; // fallback: entrance

  // Distribute within zone interior (skip fence edges)
  const innerCols = zone.maxCol - zone.minCol - 1;
  const innerRows = zone.maxRow - zone.minRow - 1;
  const idx = animal.id;
  const col = zone.minCol + 1 + (idx % Math.max(1, innerCols));
  const row = zone.minRow + 1 + Math.floor(idx / Math.max(1, innerCols)) % Math.max(1, innerRows);
  return { col, row };
}

function getZoneForSpecies(species) {
  const { ZONES } = require_zones();
  switch (species) {
    case 'dog': return ZONES.dogRun;
    case 'cat': return ZONES.catEnclosure;
    case 'rabbit':
    case 'smallpet': return ZONES.smallPetArea;
    case 'bird': return ZONES.birdAviary;
    default: return ZONES.building;
  }
}

// Lazy import to avoid circular deps
let _zones = null;
function require_zones() {
  if (!_zones) {
    // Import from tilemap at module level won't work here due to circular potential
    // Instead, use the ZONES constant directly
    _zones = { ZONES: null };
    import('./tilemap.js').then(m => { _zones.ZONES = m.ZONES; });
  }
  return _zones;
}

function getStaffPosition(staff, state, tileMap) {
  if (staff.assignedAnimalId !== null) {
    const animal = state.animals.find(a => a.id === staff.assignedAnimalId);
    if (animal) {
      const animalPos = getAnimalPosition(animal, tileMap);
      // Staff stands next to the animal
      return { col: animalPos.col + 1, row: animalPos.row };
    }
  }
  // Idle: stand in reception area
  return { col: 6 + (staff.id % 3), row: 17 };
}
```

Wait — the lazy import pattern above is fragile. Let me fix: pass ZONES as a parameter from the renderer constructor, since tilemap is already passed in.

- [ ] **Step 2 (revised): Rewrite js/renderer.js**

Replace the `getZoneForSpecies` and `require_zones` functions with a simpler approach that uses the tileMap parameter:

```js
// js/renderer.js
import { worldToScreen, depthKey, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from './iso.js';
import { createTileCache } from './tile-factory.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';
import { createAnimState, animalAnimFromStats, staffAnimFromState } from './sprites.js';
import { ZONES } from './tilemap.js';

const SPECIES_ZONE_MAP = {
  dog: 'dogRun',
  cat: 'catEnclosure',
  rabbit: 'smallPetArea',
  smallpet: 'smallPetArea',
  bird: 'birdAviary',
};

export function createRenderer(canvas, tileMap) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const tileCache = createTileCache();

  const animalSheets = {};
  for (const key of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
    animalSheets[key] = createAnimalSpriteSheet(key);
  }
  const staffSheets = {};
  for (const key of ['caretaker', 'vet', 'trainer', 'matchmaker']) {
    staffSheets[key] = createStaffSpriteSheet(key);
  }

  const animalAnims = new Map();
  const staffAnims = new Map();

  const leftMost = worldToScreen(0, MAP_ROWS - 1, TILE_W, TILE_H);
  const rightMost = worldToScreen(MAP_COLS - 1, 0, TILE_W, TILE_H);
  const bottomMost = worldToScreen(MAP_COLS - 1, MAP_ROWS - 1, TILE_W, TILE_H);
  const mapOffsetX = -leftMost.x + TILE_W / 2;
  const mapOffsetY = 0;
  const worldPixelW = rightMost.x - leftMost.x + TILE_W + mapOffsetX;
  const worldPixelH = bottomMost.y + TILE_H * 3;

  function getWorldSize() {
    return { w: worldPixelW, h: worldPixelH };
  }

  function getAnimalPosition(animal) {
    const zoneName = SPECIES_ZONE_MAP[animal.species] || 'building';
    const zone = ZONES[zoneName];
    if (!zone) return { col: 6, row: 20 };
    const innerCols = Math.max(1, zone.maxCol - zone.minCol - 1);
    const innerRows = Math.max(1, zone.maxRow - zone.minRow - 1);
    const idx = animal.id;
    const col = zone.minCol + 1 + (idx % innerCols);
    const row = zone.minRow + 1 + Math.floor(idx / innerCols) % innerRows;
    return { col, row };
  }

  function getStaffPosition(staff, state) {
    if (staff.assignedAnimalId !== null) {
      const animal = state.animals.find(a => a.id === staff.assignedAnimalId);
      if (animal) {
        const pos = getAnimalPosition(animal);
        return { col: pos.col + 1, row: pos.row };
      }
    }
    return { col: 6 + (staff.id % 3), row: 17 };
  }

  function render(state, camera, dt) {
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B3E5FC');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    const renderables = [];

    // Ground tiles
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileType = tileMap.getTile(col, row);
        if (!tileType) continue;
        const screen = worldToScreen(col, row, TILE_W, TILE_H);
        const sx = screen.x + mapOffsetX - camera.x;
        const sy = screen.y + mapOffsetY - camera.y;
        if (sx + TILE_W < 0 || sx > W || sy + 64 < 0 || sy > H) continue;

        let tileCanvas = tileCache[tileType];
        if (tileType === 'grass') {
          const v = (col * 7 + row * 13) % 3;
          tileCanvas = v === 0 ? tileCache.grass : v === 1 ? tileCache.grass2 : tileCache.grass3;
        }
        if (!tileCanvas) tileCanvas = tileCache.grass;

        const heightOffset = tileCanvas.height - TILE_H;
        renderables.push({
          depth: depthKey(col, row, 0),
          draw() { ctx.drawImage(tileCanvas, sx, sy - heightOffset); }
        });
      }
    }

    // Animals
    for (const animal of state.animals) {
      const pos = getAnimalPosition(animal);
      const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
      const sx = screen.x + mapOffsetX - camera.x + TILE_W / 2 - ANIMAL_SPRITE.W / 2;
      const sy = screen.y + mapOffsetY - camera.y - ANIMAL_SPRITE.H + TILE_H / 2;
      if (sx + ANIMAL_SPRITE.W < 0 || sx > W || sy + ANIMAL_SPRITE.H < 0 || sy > H) continue;

      if (!animalAnims.has(animal.id)) animalAnims.set(animal.id, createAnimState(ANIMAL_SPRITE));
      const as = animalAnims.get(animal.id);
      as.setAnim(animalAnimFromStats(animal));
      as.update(dt);
      const f = as.getFrame();
      const sheet = animalSheets[animal.species] || animalSheets.dog;

      renderables.push({
        depth: depthKey(pos.col, pos.row, 1),
        draw() {
          ctx.drawImage(sheet, f.sx, f.sy, f.sw, f.sh, sx, sy, ANIMAL_SPRITE.W, ANIMAL_SPRITE.H);
          ctx.fillStyle = '#4E342E';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(animal.name, sx + ANIMAL_SPRITE.W / 2, sy + ANIMAL_SPRITE.H + 8);
        }
      });
    }

    // Staff
    for (const staff of state.staff) {
      const pos = getStaffPosition(staff, state);
      const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
      const sx = screen.x + mapOffsetX - camera.x + TILE_W / 2 - STAFF_SPRITE.W / 2;
      const sy = screen.y + mapOffsetY - camera.y - STAFF_SPRITE.H + TILE_H / 2;
      if (sx + STAFF_SPRITE.W < 0 || sx > W || sy + STAFF_SPRITE.H < 0 || sy > H) continue;

      if (!staffAnims.has(staff.id)) staffAnims.set(staff.id, createAnimState(STAFF_SPRITE));
      const as = staffAnims.get(staff.id);
      as.setAnim(staffAnimFromState(staff));
      as.update(dt);
      const f = as.getFrame();
      const sheet = staffSheets[staff.role] || staffSheets.caretaker;

      renderables.push({
        depth: depthKey(pos.col, pos.row, 1),
        draw() {
          ctx.drawImage(sheet, f.sx, f.sy, f.sw, f.sh, sx, sy, STAFF_SPRITE.W, STAFF_SPRITE.H);
        }
      });
    }

    renderables.sort((a, b) => a.depth - b.depth);
    for (const r of renderables) r.draw();
  }

  return { render, getWorldSize };
}
```

- [ ] **Step 3: Run tests — expect pass**

- [ ] **Step 4: Commit**

```bash
git add js/renderer.js tests/renderer.test.js
git commit -m "feat: rewrite renderer for isometric tile-based rendering with depth sorting"
```

---

### Task 8: CSS Redesign (Wood/Parchment Theme)

**Files:**
- Rewrite: `css/style.css`

- [ ] **Step 1: Rewrite css/style.css**

```css
/* Reset */
* { margin: 0; padding: 0; box-sizing: border-box; }

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

body {
  background: #5D4037;
  color: #4E342E;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

/* Game container */
#game-container {
  width: 900px;
  background: #8B4513;
  border: 4px solid #4E342E;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

/* Stats bar - wood texture */
#stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: linear-gradient(180deg, #D7A86E 0%, #C49155 50%, #B8834A 100%);
  border-bottom: 3px solid #8B4513;
  color: #4E342E;
  font-size: 9px;
}

#stats-bar span {
  background: rgba(255,248,225,0.6);
  padding: 3px 8px;
  border-radius: 3px;
  border: 1px solid #C49155;
}

/* Speed controls */
#speed-controls {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.speed-btn {
  background: linear-gradient(180deg, #A0724A, #8B4513);
  color: #FFF8E1;
  border: 2px solid #5D4037;
  padding: 3px 8px;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
  border-radius: 3px;
}

.speed-btn:hover {
  background: linear-gradient(180deg, #C49155, #A0724A);
}

.speed-btn.active {
  background: linear-gradient(180deg, #F9A825, #F57F17);
  color: #4E342E;
  border-color: #F9A825;
  box-shadow: 0 0 6px rgba(249,168,37,0.5);
}

/* Main area */
#main-area {
  display: flex;
}

#shelter-canvas {
  display: block;
  width: 640px;
  height: 480px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  cursor: grab;
}

#shelter-canvas:active {
  cursor: grabbing;
}

/* Side panel - parchment */
#side-panel {
  width: 260px;
  padding: 10px;
  background: linear-gradient(180deg, #FFF8E1 0%, #FFECB3 100%);
  border-left: 3px solid #8B4513;
  font-size: 9px;
  overflow-y: auto;
  max-height: 480px;
  color: #4E342E;
}

.panel-section {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #C49155;
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section h3 {
  color: #8B4513;
  font-size: 9px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Action buttons - leather look */
.action-btn {
  display: block;
  width: 100%;
  padding: 7px 8px;
  margin-bottom: 4px;
  background: linear-gradient(180deg, #A0724A, #8B4513);
  color: #FFF8E1;
  border: 2px solid #5D4037;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
  border-radius: 4px;
  text-align: left;
}

.action-btn:hover {
  background: linear-gradient(180deg, #C49155, #A0724A);
  border-color: #F9A825;
  color: #FFF8E1;
}

/* Event ticker - wood plank */
#event-ticker {
  padding: 6px 14px;
  background: linear-gradient(180deg, #C49155, #A0724A);
  border-top: 3px solid #8B4513;
  font-size: 8px;
  color: #FFF8E1;
  min-height: 28px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dialog - parchment with wood frame */
#dialog-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

#dialog-overlay.hidden { display: none; }

#dialog-box {
  background: linear-gradient(180deg, #FFF8E1, #FFECB3);
  border: 4px solid #8B4513;
  border-radius: 8px;
  padding: 18px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
}

#dialog-title {
  color: #8B4513;
  margin-bottom: 10px;
  font-size: 11px;
}

#dialog-content {
  margin-bottom: 14px;
  font-size: 9px;
  line-height: 1.8;
}

#dialog-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

#dialog-buttons button {
  padding: 7px 18px;
  background: linear-gradient(180deg, #A0724A, #8B4513);
  color: #FFF8E1;
  border: 2px solid #5D4037;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
  border-radius: 4px;
}

#dialog-buttons button:hover {
  background: linear-gradient(180deg, #F9A825, #F57F17);
  border-color: #F9A825;
  color: #4E342E;
}

/* Utility */
.hidden { display: none !important; }

/* Staff/applicant entries */
.staff-entry, .applicant-entry {
  padding: 3px 0;
  border-bottom: 1px dotted #D7A86E;
  font-size: 8px;
  line-height: 1.6;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat: redesign CSS with warm wood/parchment theme and pixel font"
```

---

### Task 9: HTML + Main.js Updates (Camera, Asset Loading, Layout)

**Files:**
- Modify: `index.html`
- Rewrite: `js/main.js`

- [ ] **Step 1: Update index.html**

Change the canvas dimensions and game-container width:

In `index.html`, change:
```html
<canvas id="shelter-canvas" width="480" height="320"></canvas>
```
to:
```html
<canvas id="shelter-canvas" width="640" height="480"></canvas>
```

- [ ] **Step 2: Rewrite js/main.js with camera and new renderer**

```js
// js/main.js
import { createEngine } from './engine.js';
import { createNewState, loadState, saveState } from './state.js';
import { createRenderer } from './renderer.js';
import { createTileMap } from './tilemap.js';
import { createCamera } from './camera.js';
import { createUI } from './ui.js';
import { simulateTick } from './simulation.js';
import { createAnimal } from './animals.js';
import { createStaff, assignStaff, unassignStaff } from './staff.js';
import { calculateMatchScore, executeAdoption, createOwner } from './matching.js';
import { enableEndless, calculateFinalScore } from './progression.js';
import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';
import { worldToScreen, TILE_W, TILE_H } from './iso.js';

// Initialize
const canvas = document.getElementById('shelter-canvas');
const tileMap = createTileMap();
const renderer = createRenderer(canvas, tileMap);
const worldSize = renderer.getWorldSize();
const camera = createCamera(canvas.width, canvas.height, worldSize.w, worldSize.h);

// Center camera on the building area initially
const buildingCenter = worldToScreen(7, 13, TILE_W, TILE_H);
camera.centerOn(buildingCenter.x + worldSize.w / 4, buildingCenter.y);

const engine = createEngine();
engine.setMsPerTick(BALANCING.msPerTick);

let state = loadState() || createNewState();
let autoSaveCounter = 0;

const ui = createUI(state, {
  onSetSpeed(speed) { engine.setSpeed(speed); },
  onAction(action) {
    switch (action) {
      case 'intake': showIntakeDialog(); break;
      case 'adopt':  showAdoptDialog();  break;
      case 'shop':   showShopDialog();   break;
      case 'staff':  showStaffDialog();  break;
    }
  },
});

// Camera controls: WASD + mouse drag
const keys = {};
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

let dragging = false;
let dragStartX = 0, dragStartY = 0;
canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dx = dragStartX - e.clientX;
  const dy = dragStartY - e.clientY;
  camera.move(dx, dy);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
});
document.addEventListener('mouseup', () => { dragging = false; });

// Engine callbacks
engine.onTick = (ticks) => {
  // Keyboard camera scroll
  const scrollSpeed = 4;
  if (keys['w'] || keys['arrowup']) camera.move(0, -scrollSpeed);
  if (keys['s'] || keys['arrowdown']) camera.move(0, scrollSpeed);
  if (keys['a'] || keys['arrowleft']) camera.move(-scrollSpeed, 0);
  if (keys['d'] || keys['arrowright']) camera.move(scrollSpeed, 0);

  for (let i = 0; i < ticks; i++) {
    simulateTick(state);
  }
  autoSaveCounter += ticks;
  if (autoSaveCounter > BALANCING.ticksPerDay * 7) {
    saveState(state);
    autoSaveCounter = 0;
  }
  if (state.gameOver && !state.endless) {
    engine.setSpeed(0);
    showGameOverDialog();
  }
};

engine.onRender = (dt) => {
  renderer.render(state, camera, dt);
  ui.update(state);
};

// --- Dialog functions (same as before) ---

function showIntakeDialog() {
  if (state.animals.length >= state.maxAnimals) {
    ui.showDialog('Kein Platz', 'Das Tierheim ist voll! Vermittle erst Tiere oder erweitere.', [
      { label: 'OK', onClick() {} }
    ]);
    return;
  }
  const available = state.unlockedSpecies;
  const content = available.map(key => {
    const sp = SPECIES[key];
    return `<button class="action-btn" data-species="${key}">${sp.name} (Kosten: $${Math.floor(sp.baseAdoptionFee * 0.3)})</button>`;
  }).join('');
  ui.showDialog('Tier aufnehmen', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-species]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.species;
      const cost = Math.floor(SPECIES[key].baseAdoptionFee * 0.3);
      if (state.money < cost) {
        ui.showDialog('Zu teuer', 'Nicht genug Geld.', [{ label: 'OK', onClick() {} }]);
        return;
      }
      state.money -= cost;
      const animal = createAnimal(key, state.nextId++);
      state.animals.push(animal);
      state.tickerMessages.push(`${animal.name} (${SPECIES[key].name}) aufgenommen!`);
      ui.hideDialog();
    });
  });
}

function showAdoptDialog() {
  if (state.owners.length === 0) {
    ui.showDialog('Keine Bewerber', 'Aktuell keine Adoptionsbewerber. Steigere deine Reputation!', [{ label: 'OK', onClick() {} }]);
    return;
  }
  if (state.animals.length === 0) {
    ui.showDialog('Keine Tiere', 'Keine Tiere im Tierheim.', [{ label: 'OK', onClick() {} }]);
    return;
  }
  let content = '<div style="margin-bottom:8px"><b>Bewerber w\u00e4hlen:</b></div>';
  for (const owner of state.owners) {
    content += `<button class="action-btn" data-owner="${owner.id}">${owner.name} (${owner.profile.housing}, ${owner.profile.experience})</button>`;
  }
  ui.showDialog('Vermittlung', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-owner]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ownerId = parseInt(btn.dataset.owner);
      const owner = state.owners.find(o => o.id === ownerId);
      if (!owner) return;
      ui.hideDialog();
      showAnimalSelectDialog(owner);
    });
  });
}

function showAnimalSelectDialog(owner) {
  const matchmakerBonus = state.staff.filter(s => s.role === 'matchmaker').reduce((max, s) => Math.max(max, 0.3 + s.level * 0.1), 0);
  let content = `<div style="margin-bottom:8px"><b>${owner.name}</b> sucht ein Tier:</div>`;
  for (const animal of state.animals) {
    const score = calculateMatchScore(animal, owner, matchmakerBonus);
    const color = score >= 85 ? '#43A047' : score >= 60 ? '#F9A825' : '#E53935';
    content += `<button class="action-btn" data-animal="${animal.id}">${animal.name} (${SPECIES[animal.species].name}) \u2014 <span style="color:${color}">Match: ${Math.floor(score)}%</span></button>`;
  }
  ui.showDialog('Tier w\u00e4hlen', content, [{ label: 'Abbrechen', onClick() {} }]);
  document.querySelectorAll('[data-animal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const animalId = parseInt(btn.dataset.animal);
      const animal = state.animals.find(a => a.id === animalId);
      if (!animal) return;
      const score = calculateMatchScore(animal, owner, matchmakerBonus);
      const result = executeAdoption(state, animal, owner, score);
      state.tickerMessages.push(`${animal.name} vermittelt an ${owner.name}! Match: ${Math.floor(score)}%, Geb\u00fchr: $${result.fee}`);
      ui.hideDialog();
    });
  });
}

function showShopDialog() {
  const content = `
    <button class="action-btn" data-buy="food">Futter-Vorrat ($${BALANCING.dailyFoodCost * 7})</button>
    <button class="action-btn" data-buy="medicine">Medizin-Vorrat ($${BALANCING.dailyMedicineCost * 7})</button>
  `;
  ui.showDialog('Einkaufen', content, [{ label: 'Schlie\u00dfen', onClick() {} }]);
  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.buy;
      const cost = item === 'food' ? BALANCING.dailyFoodCost * 7 : BALANCING.dailyMedicineCost * 7;
      if (state.money < cost) return;
      state.money -= cost;
      const need = item === 'food' ? 'food' : 'medicine';
      for (const animal of state.animals) animal.needs[need] = Math.min(1, animal.needs[need] + 0.3);
      state.tickerMessages.push(`${item === 'food' ? 'Futter' : 'Medizin'} eingekauft!`);
    });
  });
}

function showStaffDialog() {
  let content = '<div style="margin-bottom:8px"><b>Personal verwalten:</b></div>';
  content += '<div style="margin-bottom:8px"><u>Einstellen:</u></div>';
  for (const roleKey of state.unlockedRoles) {
    const role = STAFF_ROLES[roleKey];
    content += `<button class="action-btn" data-hire="${roleKey}">${role.name} einstellen ($${role.salary}/Wo)</button>`;
  }
  if (state.staff.length > 0 && state.animals.length > 0) {
    content += '<div style="margin-top:8px; margin-bottom:8px"><u>Zuweisen:</u></div>';
    for (const staff of state.staff) {
      const role = STAFF_ROLES[staff.role];
      content += `<div style="margin-bottom:4px"><b>${role.name} ${staff.name}</b> \u2192 `;
      content += `<select data-assign="${staff.id}" style="font-family:inherit;font-size:9px;padding:2px;">`;
      content += `<option value="">Niemand</option>`;
      for (const animal of state.animals) {
        const selected = staff.assignedAnimalId === animal.id ? 'selected' : '';
        content += `<option value="${animal.id}" ${selected}>${animal.name}</option>`;
      }
      content += `</select></div>`;
    }
  }
  ui.showDialog('Personal', content, [{ label: 'Schlie\u00dfen', onClick() {} }]);
  document.querySelectorAll('[data-hire]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roleKey = btn.dataset.hire;
      const staff = createStaff(roleKey, state.nextId++);
      state.staff.push(staff);
      state.tickerMessages.push(`${STAFF_ROLES[roleKey].name} ${staff.name} eingestellt!`);
      ui.hideDialog();
      showStaffDialog();
    });
  });
  document.querySelectorAll('[data-assign]').forEach(select => {
    select.addEventListener('change', () => {
      const staffId = parseInt(select.dataset.assign);
      const staff = state.staff.find(s => s.id === staffId);
      if (!staff) return;
      const animalId = select.value ? parseInt(select.value) : null;
      if (animalId) assignStaff(staff, animalId); else unassignStaff(staff);
    });
  });
}

function showGameOverDialog() {
  const score = calculateFinalScore(state);
  const content = `
    <div style="text-align:center; line-height:2.2;">
      <div>Adoptionen: <b>${score.totalAdoptions}</b></div>
      <div>R\u00fcckgaben: <b>${score.totalReturns}</b></div>
      <div>Reputation: <b>${score.reputation}</b></div>
      <div>Geld: <b>$${score.money.toLocaleString('de-DE')}</b></div>
      <div style="margin-top:8px; font-size:12px; color:#F9A825;">Punktzahl: <b>${score.score}</b></div>
    </div>
  `;
  ui.showDialog('20 Jahre vorbei!', content, [
    { label: 'Endlos-Modus', onClick() { enableEndless(state); engine.setSpeed(1); } },
    { label: 'Neues Spiel', onClick() { state = createNewState(); saveState(state); } },
  ]);
}

// New game setup
if (state.animals.length === 0 && state.staff.length === 0) {
  state.animals.push(createAnimal('dog', state.nextId++));
  state.animals.push(createAnimal('cat', state.nextId++));
  state.staff.push(createStaff('caretaker', state.nextId++));
  state.tickerMessages.push('Willkommen bei JujuPets! Dein Tierheim-Abenteuer beginnt.');
}

engine.start();
```

- [ ] **Step 3: Commit**

```bash
git add index.html js/main.js
git commit -m "feat: wire isometric renderer, camera controls, and updated layout into main"
```

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add new modules to CLAUDE.md architecture section**

Add after the existing architecture list:

```markdown
- `js/iso.js` — isometric coordinate transforms (worldToScreen, screenToWorld, depthKey)
- `js/camera.js` — camera viewport with WASD/drag scrolling and bounds clamping
- `js/tilemap.js` — 24x24 tile map with zone definitions (dogRun, building, catEnclosure, etc.)
- `js/tile-factory.js` — procedural tile graphics drawn into offscreen canvases
- `js/sprite-factory.js` — procedural animal and staff sprite sheets with animation frames
- `js/sprites.js` — animation state controller for frame timing and animation selection
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with isometric rendering modules"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 64x32 tiles, 24x24 map → Task 1 (iso.js), Task 3 (tilemap.js)
- [x] Camera scrolling (WASD + drag) → Task 2 (camera.js), Task 9 (main.js)
- [x] 9 tile types (grass variants, path, floor, walls, fence, water) → Task 4 (tile-factory.js)
- [x] Depth sorting by row+col+height → Task 1 (iso.js depthKey), Task 7 (renderer.js)
- [x] Cutaway building with interior rooms → Task 3 (tilemap.js zones)
- [x] Outdoor zones (dogRun, catEnclosure, smallPetArea, birdAviary) → Task 3
- [x] Animal sprites with 4 animations (idle, happy, sad, eating) → Task 5 (sprite-factory.js)
- [x] Staff sprites with 3 animations (idle, walk, work) → Task 5
- [x] Animation controller with frame timing → Task 6 (sprites.js)
- [x] Warm wood/parchment UI theme → Task 8 (style.css)
- [x] Pixel font → Task 8 (Google Fonts Press Start 2P)
- [x] 640x480 canvas → Task 9 (index.html + main.js)
- [x] Frustum culling → Task 7 (renderer.js)
- [x] Sky gradient background → Task 7 (renderer.js)
- [x] Game logic unchanged → No changes to data/state/engine/animals/staff/matching/events/progression/simulation

**Placeholder scan:** No TBD/TODO. All code blocks complete.

**Type consistency:**
- `worldToScreen(col, row, tileW, tileH)` → consistent in iso.js, renderer.js, main.js
- `createCamera(viewW, viewH, worldW, worldH)` → consistent in camera.js, main.js
- `createTileMap()` → consistent in tilemap.js, renderer.js, main.js
- `createRenderer(canvas, tileMap)` → new signature (added tileMap param), consistent in renderer.js, main.js
- `render(state, camera, dt)` → new signature (added camera, dt params), consistent in renderer.js, main.js
- `ANIMAL_SPRITE.W/H/FRAMES/ANIMS` → consistent across sprite-factory.js, sprites.js, renderer.js
- `STAFF_SPRITE.W/H/FRAMES/ANIMS` → consistent across sprite-factory.js, sprites.js, renderer.js
