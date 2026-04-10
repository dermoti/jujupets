# Prison Architect Style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace isometric rendering with top-down Prison Architect style: thick outlines, blob characters, dark functional UI, muted institutional colors.

**Architecture:** The isometric projection (`iso.js`) is renamed to a simple grid module (`grid.js`) with `TILE_SIZE = 32` square tiles. The renderer drops depth-sorting entirely and draws in fixed layer order: ground, deco, entities, particles, UI overlays. Tiles become flat filled rectangles with PA-style outlines. Sprites become round-headed blob figures with 4 directional facings. The UI shifts from wood/parchment to a dark functional theme. All game logic, audio, state, and data modules remain completely untouched.

**Tech Stack:** Vanilla HTML5 Canvas, ES modules, Web Audio API (unchanged)

**Import chain affected by iso.js -> grid.js rename:**
- `js/tilemap.js` -- imports `MAP_COLS, MAP_ROWS`
- `js/tile-factory.js` -- imports `TILE_W, TILE_H` (becomes `TILE_SIZE`)
- `js/renderer.js` -- imports `worldToScreen, depthKey, TILE_W, TILE_H, MAP_COLS, MAP_ROWS`
- `js/main.js` -- imports `worldToScreen, TILE_W, TILE_H`
- `tests/iso.test.js` -- becomes `tests/grid.test.js`
- `tests/tilemap.test.js` -- imports `MAP_COLS, MAP_ROWS`
- `tests/renderer.test.js` -- imports `worldToScreen, TILE_W, TILE_H, MAP_COLS, MAP_ROWS`
- `tests/wall-fix.test.js` -- imports `TILE_W, TILE_H`
- `tests/deco.test.js` -- imports `MAP_COLS, MAP_ROWS`

---

## Task 1: Grid Module (iso.js -> grid.js)

Replace the isometric projection module with a simple top-down grid module. This is the foundation for everything else -- every module importing from `iso.js` must be updated. The new module exports `TILE_SIZE = 32`, `MAP_COLS = 24`, `MAP_ROWS = 24`, `toScreen(col, row)`, and `toGrid(sx, sy)`. No more `worldToScreen`, `screenToWorld`, `depthKey`, `TILE_W`, or `TILE_H`.

### Step 1.1 -- Test: grid module exports and projection math

- [ ] **Test file:** `tests/grid.test.js` (new, replaces `tests/iso.test.js`)

```js
import { describe, it, expect } from '../js/test-runner.js';
import { toScreen, toGrid, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('grid constants', () => {
  it('TILE_SIZE is 32', () => {
    expect(TILE_SIZE).toBe(32);
  });

  it('MAP_COLS is 24', () => {
    expect(MAP_COLS).toBe(24);
  });

  it('MAP_ROWS is 24', () => {
    expect(MAP_ROWS).toBe(24);
  });
});

describe('toScreen', () => {
  it('converts origin (0,0) to pixel (0,0)', () => {
    const s = toScreen(0, 0);
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
  });

  it('converts (1,0) to (32,0)', () => {
    const s = toScreen(1, 0);
    expect(s.x).toBe(32);
    expect(s.y).toBe(0);
  });

  it('converts (0,1) to (0,32)', () => {
    const s = toScreen(0, 1);
    expect(s.x).toBe(0);
    expect(s.y).toBe(32);
  });

  it('converts (3,5) to (96,160)', () => {
    const s = toScreen(3, 5);
    expect(s.x).toBe(96);
    expect(s.y).toBe(160);
  });

  it('handles fractional grid coords', () => {
    const s = toScreen(1.5, 2.5);
    expect(s.x).toBe(48);
    expect(s.y).toBe(80);
  });
});

describe('toGrid', () => {
  it('inverts toScreen for (0,0)', () => {
    const g = toGrid(0, 0);
    expect(g.col).toBe(0);
    expect(g.row).toBe(0);
  });

  it('inverts toScreen for (32,0)', () => {
    const g = toGrid(32, 0);
    expect(g.col).toBe(1);
    expect(g.row).toBe(0);
  });

  it('inverts toScreen for (96,160)', () => {
    const g = toGrid(96, 160);
    expect(g.col).toBe(3);
    expect(g.row).toBe(5);
  });

  it('roundtrips with toScreen for arbitrary coords', () => {
    const s = toScreen(7, 13);
    const g = toGrid(s.x, s.y);
    expect(g.col).toBe(7);
    expect(g.row).toBe(13);
  });
});
```

- [ ] **Register in test.html:** Replace `import './tests/iso.test.js';` with `import './tests/grid.test.js';`
- [ ] **Verify:** Tests FAIL (file does not exist yet).

### Step 1.2 -- Implement: create grid.js, delete iso.js

- [ ] **Delete** `js/iso.js`
- [ ] **Create** `js/grid.js`:

```js
export const TILE_SIZE = 32;
export const MAP_COLS = 24;
export const MAP_ROWS = 24;

export function toScreen(col, row) {
  return {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
  };
}

export function toGrid(sx, sy) {
  return {
    col: sx / TILE_SIZE,
    row: sy / TILE_SIZE,
  };
}
```

- [ ] **Verify:** `tests/grid.test.js` passes. Other tests will break -- that is expected and fixed in Task 2.

### Step 1.3 -- Update all imports across the codebase

- [ ] **`js/tilemap.js` line 1:** Change `import { MAP_COLS, MAP_ROWS } from './iso.js';` to `import { MAP_COLS, MAP_ROWS } from './grid.js';`
- [ ] **`js/tile-factory.js` line 1:** Change `import { TILE_W, TILE_H } from './iso.js';` to `import { TILE_SIZE } from './grid.js';` -- replace all uses of `TILE_W` with `TILE_SIZE` and `TILE_H` with `TILE_SIZE`.
- [ ] **`js/renderer.js` line 1:** Change `import { worldToScreen, depthKey, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from './iso.js';` to `import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from './grid.js';`
- [ ] **`js/main.js` line 16:** Change `import { worldToScreen, TILE_W, TILE_H } from './iso.js';` to `import { toScreen, TILE_SIZE } from './grid.js';`
- [ ] **`tests/tilemap.test.js` line 3:** Change `import { MAP_COLS, MAP_ROWS } from '../js/iso.js';` to `import { MAP_COLS, MAP_ROWS } from '../js/grid.js';`
- [ ] **`tests/renderer.test.js` line 2:** Change `import { worldToScreen, TILE_W, TILE_H, MAP_COLS, MAP_ROWS } from '../js/iso.js';` to `import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';`
- [ ] **`tests/wall-fix.test.js` line 3:** Change `import { TILE_W, TILE_H } from '../js/iso.js';` to `import { TILE_SIZE } from '../js/grid.js';` -- update all references to use `TILE_SIZE`.
- [ ] **`tests/deco.test.js` line 3:** Change `import { MAP_COLS, MAP_ROWS } from '../js/iso.js';` to `import { MAP_COLS, MAP_ROWS } from '../js/grid.js';`
- [ ] **`test.html`:** Replace `import './tests/iso.test.js';` with `import './tests/grid.test.js';`
- [ ] **Verify:** `grid.test.js`, `tilemap.test.js`, and `deco.test.js` pass. Other tests may still fail due to tile-factory/renderer code -- those modules are rewritten in subsequent tasks.

---

## Task 2: Camera Simplification (camera.js)

The camera module's API stays the same (`move`, `centerOn`, `setPosition`, `x`, `y`, `viewW`, `viewH`), but the world dimensions it clamps against change because the world is now `768x768` (24 tiles * 32px) instead of the old isometric diamond dimensions. The canvas also changes from `640x480` to `680x500`.

### Step 2.1 -- Test: camera with new world dimensions

- [ ] **Test file:** Update `tests/camera.test.js` to use new world dimensions.

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createCamera } from '../js/camera.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

const VIEW_W = 680;
const VIEW_H = 500;
const WORLD_W = MAP_COLS * TILE_SIZE; // 768
const WORLD_H = MAP_ROWS * TILE_SIZE; // 768

describe('createCamera (top-down)', () => {
  it('starts at position (0, 0)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('moves by delta', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(100, 50);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(50);
  });

  it('clamps to world bounds (no negative)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(-100, -50);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('clamps to max bounds (768 - 680 = 88, 768 - 500 = 268)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(9999, 9999);
    expect(cam.x).toBe(WORLD_W - VIEW_W);
    expect(cam.y).toBe(WORLD_H - VIEW_H);
  });

  it('centerOn sets camera to center a world point', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.centerOn(400, 400);
    expect(cam.x).toBe(400 - VIEW_W / 2);
    expect(cam.y).toBe(400 - VIEW_H / 2);
  });

  it('setPosition works and clamps', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.setPosition(50, 100);
    expect(cam.x).toBe(50);
    expect(cam.y).toBe(100);
  });

  it('exposes viewW and viewH', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    expect(cam.viewW).toBe(VIEW_W);
    expect(cam.viewH).toBe(VIEW_H);
  });
});
```

- [ ] **Verify:** All 7 camera tests pass (camera.js API is unchanged -- only the test dimensions change).

### Step 2.2 -- Note: no code changes needed

The `camera.js` module requires zero code changes. The only change is the values fed into it by `main.js` (done in Task 12). The tests verify it works correctly with the new world dimensions.

---

## Task 3: Tilemap Wall Simplification (tilemap.js)

Simplify tile types: `wall_left`, `wall_right`, `wall_back` all become `wall`. The tilemap function `computeTileType` is updated. All tests referencing old wall types are updated.

### Step 3.1 -- Test: unified wall type

- [ ] **Test file:** Update `tests/tilemap.test.js`

```js
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

describe('tile type coverage (PA unified walls)', () => {
  it('returns wall for building top row', () => {
    const map = createTileMap();
    expect(map.getTile(5, 8)).toBe('wall');
  });

  it('returns wall for building left edge', () => {
    const map = createTileMap();
    expect(map.getTile(2, 12)).toBe('wall');
  });

  it('returns wall for building right edge', () => {
    const map = createTileMap();
    expect(map.getTile(11, 12)).toBe('wall');
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
```

- [ ] **Verify:** Tests FAIL (`wall_back` returned instead of `wall`).

### Step 3.2 -- Implement: unify wall types in tilemap.js

- [ ] **`js/tilemap.js`:** In `computeTileType()`, replace the three wall returns:

Change:
```js
if (row === ZONES.building.minRow) return 'wall_back';
if (col === ZONES.building.minCol) return 'wall_left';
if (col === ZONES.building.maxCol) return 'wall_right';
```

To:
```js
if (row === ZONES.building.minRow) return 'wall';
if (col === ZONES.building.minCol) return 'wall';
if (col === ZONES.building.maxCol) return 'wall';
```

- [ ] **Delete** `tests/wall-fix.test.js` (tests iso-specific wall pixel data that no longer applies).
- [ ] **Remove** `import './tests/wall-fix.test.js';` from `test.html`.
- [ ] **Verify:** `tilemap.test.js` passes. `tile-factory.test.js` may still fail (fixed in Task 4).

---

## Task 4: Tile Factory Rewrite (tile-factory.js)

Complete rewrite: diamond tiles become flat 32x32 rectangles with PA-style colors and thick outlines. Wall tiles are no longer taller than floor. Water keeps its 3-frame animation but as rectangles.

### Step 4.1 -- Test: new tile cache structure and dimensions

- [ ] **Test file:** Rewrite `tests/tile-factory.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_SIZE } from '../js/grid.js';

describe('createTileCache (PA style)', () => {
  it('returns an object with canvas for each tile type', () => {
    const cache = createTileCache();
    expect(cache.grass !== undefined).toBeTruthy();
    expect(cache.path !== undefined).toBeTruthy();
    expect(cache.floor !== undefined).toBeTruthy();
    expect(cache.wall !== undefined).toBeTruthy();
    expect(cache.fence !== undefined).toBeTruthy();
  });

  it('each cached tile is a canvas element', () => {
    const cache = createTileCache();
    expect(cache.grass instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.wall instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('grass tile has correct dimensions (32x32)', () => {
    const cache = createTileCache();
    expect(cache.grass.width).toBe(TILE_SIZE);
    expect(cache.grass.height).toBe(TILE_SIZE);
  });

  it('wall tile has same height as floor tile (32x32, no 3D extrusion)', () => {
    const cache = createTileCache();
    expect(cache.wall.height).toBe(cache.floor.height);
    expect(cache.wall.height).toBe(TILE_SIZE);
  });

  it('has no wall_back, wall_left, wall_right (unified wall)', () => {
    const cache = createTileCache();
    expect(cache.wall_back === undefined).toBeTruthy();
    expect(cache.wall_left === undefined).toBeTruthy();
    expect(cache.wall_right === undefined).toBeTruthy();
  });

  it('has grass variants and grass_flower', () => {
    const cache = createTileCache();
    expect(cache.grass2 instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.grass3 instanceof HTMLCanvasElement).toBeTruthy();
    expect(cache.grass_flower instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('water is an array of 3 canvas frames', () => {
    const cache = createTileCache();
    expect(Array.isArray(cache.water)).toBeTruthy();
    expect(cache.water.length).toBe(3);
    for (const frame of cache.water) {
      expect(frame instanceof HTMLCanvasElement).toBeTruthy();
      expect(frame.width).toBe(TILE_SIZE);
      expect(frame.height).toBe(TILE_SIZE);
    }
  });

  it('has 9 required tile types', () => {
    const cache = createTileCache();
    const canvasKeys = ['grass', 'grass2', 'grass3', 'grass_flower', 'path', 'floor', 'wall', 'fence'];
    for (const key of canvasKeys) {
      expect(cache[key] instanceof HTMLCanvasElement).toBeTruthy();
    }
    expect(Array.isArray(cache.water)).toBeTruthy();
  });
});

describe('PA tile colors', () => {
  it('grass tile center pixel is near PA green (#5a7a3a)', () => {
    const cache = createTileCache();
    const ctx = cache.grass.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #5a7a3a = rgb(90, 122, 58)
    expect(pixel[0]).toBe(90);
    expect(pixel[1]).toBe(122);
    expect(pixel[2]).toBe(58);
  });

  it('floor tile center pixel is near PA beige (#c8b8a0)', () => {
    const cache = createTileCache();
    const ctx = cache.floor.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #c8b8a0 = rgb(200, 184, 160)
    expect(pixel[0]).toBe(200);
    expect(pixel[1]).toBe(184);
    expect(pixel[2]).toBe(160);
  });

  it('path tile center pixel is near PA concrete (#a09080)', () => {
    const cache = createTileCache();
    const ctx = cache.path.getContext('2d');
    const pixel = ctx.getImageData(TILE_SIZE / 2, TILE_SIZE / 2, 1, 1).data;
    // #a09080 = rgb(160, 144, 128)
    expect(pixel[0]).toBe(160);
    expect(pixel[1]).toBe(144);
    expect(pixel[2]).toBe(128);
  });
});
```

- [ ] **Verify:** Tests FAIL (old tile-factory returns diamonds with wrong dimensions and colors).

### Step 4.2 -- Implement: rewrite tile-factory.js to PA rectangles

- [ ] **Rewrite** `js/tile-factory.js`:

```js
import { TILE_SIZE } from './grid.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawRect(ctx, w, h, fillColor, strokeColor, strokeWidth) {
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, w, h);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth || 1;
    ctx.strokeRect(0, 0, w, h);
  }
}

function drawGrass(variant) {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  const baseColors = ['#5a7a3a', '#527234', '#628240'];
  drawRect(ctx, TILE_SIZE, TILE_SIZE, baseColors[variant % 3]);
  // Subtle darker flecks
  ctx.fillStyle = '#4a6a2a';
  for (let i = 0; i < 4; i++) {
    const gx = 4 + Math.floor(Math.sin(i * 2.1 + variant) * 10);
    const gy = 4 + Math.floor(Math.cos(i * 1.7 + variant) * 10);
    ctx.fillRect(gx, gy, 2, 2);
  }
  return c;
}

function drawGrassFlower() {
  const c = drawGrass(1);
  const ctx = c.getContext('2d');
  const colors = ['#E91E63', '#FF9800', '#FFEB3B'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(8 + i * 8, 10 + (i % 2) * 6, 3, 3);
  }
  return c;
}

function drawPath() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#a09080');
  ctx.strokeStyle = '#908070';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  return c;
}

function drawFloor() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#c8b8a0');
  ctx.strokeStyle = '#b8a890';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  return c;
}

function drawWall() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#555555');
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
  return c;
}

function drawFence() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#5a7a3a');
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
  ctx.setLineDash([]);
  return c;
}

function drawWaterFrame(waveOffset) {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#5C9CD6');
  ctx.strokeStyle = '#4A8AC4';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  // Wave highlight
  ctx.strokeStyle = '#8CBEE8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(TILE_SIZE / 2 + waveOffset, TILE_SIZE / 2 - 4, 6, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(TILE_SIZE / 2 - waveOffset * 0.7, TILE_SIZE / 2 + 4, 5, 0, Math.PI);
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
    wall: drawWall(),
    fence: drawFence(),
    water: [drawWaterFrame(-4), drawWaterFrame(0), drawWaterFrame(4)],
  };
}
```

- [ ] **Update** `tests/water-anim.test.js`: Change all `64` width references to `TILE_SIZE` (32) and `32` height references to `TILE_SIZE` (32). Add `import { TILE_SIZE } from '../js/grid.js';` and use it.

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_SIZE } from '../js/grid.js';

describe('Water animation frames (PA style)', () => {
  it('water property is an array of 3 canvases', () => {
    const cache = createTileCache();
    expect(Array.isArray(cache.water)).toBe(true);
    expect(cache.water.length).toBe(3);
  });

  it('each water frame is a canvas element', () => {
    const cache = createTileCache();
    for (const frame of cache.water) {
      expect(frame instanceof HTMLCanvasElement).toBe(true);
    }
  });

  it('each water frame has PA tile dimensions (32x32)', () => {
    const cache = createTileCache();
    for (const frame of cache.water) {
      expect(frame.width).toBe(TILE_SIZE);
      expect(frame.height).toBe(TILE_SIZE);
    }
  });

  it('water frames differ in pixel content (wave moves)', () => {
    const cache = createTileCache();
    const ctx0 = cache.water[0].getContext('2d');
    const ctx1 = cache.water[1].getContext('2d');
    const data0 = ctx0.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
    const data1 = ctx1.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
    let diffCount = 0;
    for (let i = 0; i < data0.length; i++) {
      if (data0[i] !== data1[i]) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Verify:** `tile-factory.test.js` and `water-anim.test.js` pass.

---

## Task 5: Sprite Factory Rewrite -- PA Blob Animals (sprite-factory.js, part 1)

Rewrite animal sprite generation to PA-style: big round heads, thick black outlines, flat colors, 4 directions, 3 frames per animation. Sheet layout changes: 4 directions x 3 frames = 12 columns, 4 animations = 4 rows. New constant `ANIMAL_DIRS = 4`, `ANIMAL_FRAMES = 3`.

### Step 5.1 -- Test: PA animal sprite sheet dimensions and structure

- [ ] **Test file:** Rewrite `tests/sprite-factory.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from '../js/sprite-factory.js';

describe('createAnimalSpriteSheet (PA style)', () => {
  it('returns a canvas for dog', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('ANIMAL_SPRITE has 3 frames and 4 directions', () => {
    expect(ANIMAL_SPRITE.FRAMES).toBe(3);
    expect(ANIMAL_SPRITE.DIRS).toBe(4);
  });

  it('has correct width for 4 dirs x 3 frames = 12 columns', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.width).toBe(ANIMAL_SPRITE.W * ANIMAL_SPRITE.FRAMES * ANIMAL_SPRITE.DIRS);
  });

  it('has correct height for 4 animation rows', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.height).toBe(ANIMAL_SPRITE.H * ANIMAL_SPRITE.ANIMS);
  });

  it('creates sheets for all 5 species', () => {
    for (const species of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
      const sheet = createAnimalSpriteSheet(species);
      expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
    }
  });

  it('dog sprite dimensions match spec (16x18)', () => {
    expect(ANIMAL_SPRITE.W).toBe(16);
    expect(ANIMAL_SPRITE.H).toBe(18);
  });
});

describe('createStaffSpriteSheet (PA style)', () => {
  it('returns a canvas for caretaker', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('STAFF_SPRITE has 3 frames and 4 directions', () => {
    expect(STAFF_SPRITE.FRAMES).toBe(3);
    expect(STAFF_SPRITE.DIRS).toBe(4);
  });

  it('has correct width for 4 dirs x 3 frames = 12 columns', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.width).toBe(STAFF_SPRITE.W * STAFF_SPRITE.FRAMES * STAFF_SPRITE.DIRS);
  });

  it('staff sprite dimensions match spec (14x22)', () => {
    expect(STAFF_SPRITE.W).toBe(14);
    expect(STAFF_SPRITE.H).toBe(22);
  });

  it('has correct height for 3 animation rows', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.height).toBe(STAFF_SPRITE.H * STAFF_SPRITE.ANIMS);
  });
});
```

- [ ] **Verify:** Tests FAIL (old sprite factory exports don't match).

### Step 5.2 -- Implement: rewrite sprite-factory.js with PA blobs

- [ ] **Rewrite** `js/sprite-factory.js` with PA-style drawing:
  - `ANIMAL_W = 16`, `ANIMAL_H = 18`, `ANIMAL_FRAMES = 3`, `ANIMAL_ANIMS = 4`, `ANIMAL_DIRS = 4`
  - `STAFF_W = 14`, `STAFF_H = 22`, `STAFF_FRAMES = 3`, `STAFF_ANIMS = 3`, `STAFF_DIRS = 4`
  - Export `ANIMAL_SPRITE = { W, H, FRAMES, ANIMS, DIRS }` and `STAFF_SPRITE = { W, H, FRAMES, ANIMS, DIRS }`
  - Sheet layout: columns = `DIRS * FRAMES`, rows = `ANIMS`
  - For each direction: col offset = `dir * FRAMES`
  - Drawing: big round head (~1/3 height), thick black outlines (1.5-2px), flat colors, dot eyes, optional mouth
  - Direction differences: South = front view, North = back view (darker, no eyes), East/West = side view (one eye)
  - Species-specific features: dog gets floppy ears, cat gets pointed ears + green eyes, rabbit gets long ears, bird gets beak
  - Staff roles get color-coded shirts per spec palette

- [ ] **Rewrite deco sprites** in same file: convert all deco from iso-sized to PA-style (simpler shapes, thick outlines). Tree = dark circle + outline + trunk rectangle. All sizes smaller (match TILE_SIZE = 32).

- [ ] **Update** `tests/deco-sprites.test.js` to expect PA-size sprites (smaller dimensions than before).

- [ ] **Verify:** `sprite-factory.test.js` and `deco-sprites.test.js` pass.

---

## Task 6: Sprites Module -- Direction Support (sprites.js)

Add direction state (`direction`) to `createAnimState`. The frame lookup must account for 4 directions: `sx = (dir * FRAMES + frame) * W`. New function `directionFromVelocity(dx, dy)` returns 0-3 (south, west, north, east).

### Step 6.1 -- Test: direction state and velocity-to-direction

- [ ] **Test file:** Rewrite `tests/sprites.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createAnimState, animalAnimFromStats, staffAnimFromState, directionFromVelocity } from '../js/sprites.js';
import { ANIMAL_SPRITE, STAFF_SPRITE } from '../js/sprite-factory.js';

describe('createAnimState (PA with directions)', () => {
  it('starts at animation 0, frame 0, direction 0 (south)', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    expect(state.currentAnim).toBe(0);
    expect(state.currentFrame).toBe(0);
    expect(state.currentDir).toBe(0);
  });

  it('advances frame after enough dt', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.update(200);
    expect(state.currentFrame).toBe(1);
  });

  it('wraps frame back to 0 after all frames (3)', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    for (let i = 0; i < ANIMAL_SPRITE.FRAMES; i++) state.update(200);
    expect(state.currentFrame).toBe(0);
  });

  it('resets frame when changing animation', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.update(200);
    state.setAnim(2);
    expect(state.currentFrame).toBe(0);
    expect(state.currentAnim).toBe(2);
  });

  it('setDir changes direction', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.setDir(2);
    expect(state.currentDir).toBe(2);
  });

  it('getFrame includes direction offset in sx', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.setDir(1); // west
    state.update(200); // frame 1
    const f = state.getFrame();
    // sx = (dir * FRAMES + frame) * W = (1 * 3 + 1) * 16 = 64
    expect(f.sx).toBe((1 * ANIMAL_SPRITE.FRAMES + 1) * ANIMAL_SPRITE.W);
    expect(f.sy).toBe(0); // anim 0
    expect(f.sw).toBe(ANIMAL_SPRITE.W);
    expect(f.sh).toBe(ANIMAL_SPRITE.H);
  });
});

describe('directionFromVelocity', () => {
  it('returns 0 (south) for downward movement', () => {
    expect(directionFromVelocity(0, 1)).toBe(0);
  });

  it('returns 1 (west) for leftward movement', () => {
    expect(directionFromVelocity(-1, 0)).toBe(1);
  });

  it('returns 2 (north) for upward movement', () => {
    expect(directionFromVelocity(0, -1)).toBe(2);
  });

  it('returns 3 (east) for rightward movement', () => {
    expect(directionFromVelocity(1, 0)).toBe(3);
  });

  it('returns 0 (south) for zero velocity (default)', () => {
    expect(directionFromVelocity(0, 0)).toBe(0);
  });

  it('diagonal down-right returns south or east (dominant axis)', () => {
    const dir = directionFromVelocity(0.3, 0.7);
    expect(dir).toBe(0); // y dominant -> south
  });

  it('diagonal left-up returns west when x dominant', () => {
    const dir = directionFromVelocity(-0.8, -0.2);
    expect(dir).toBe(1); // x dominant, negative -> west
  });
});

describe('animalAnimFromStats', () => {
  it('returns 0 for idle (normal happiness)', () => {
    expect(animalAnimFromStats({ stats: { happiness: 0.5 } })).toBe(0);
  });

  it('returns 1 for happy (>0.7)', () => {
    expect(animalAnimFromStats({ stats: { happiness: 0.8 } })).toBe(1);
  });

  it('returns 2 for sad (<0.3)', () => {
    expect(animalAnimFromStats({ stats: { happiness: 0.1 } })).toBe(2);
  });

  it('returns 3 for eating', () => {
    expect(animalAnimFromStats({ _eating: true, stats: { happiness: 0.5 } })).toBe(3);
  });
});

describe('staffAnimFromState', () => {
  it('returns 0 for idle', () => {
    expect(staffAnimFromState({ assignedAnimalId: null })).toBe(0);
  });

  it('returns 1 for walk (assigned)', () => {
    expect(staffAnimFromState({ assignedAnimalId: 5 })).toBe(1);
  });

  it('returns 2 for work', () => {
    expect(staffAnimFromState({ _working: true, assignedAnimalId: 5 })).toBe(2);
  });
});
```

- [ ] **Verify:** Tests FAIL (no `directionFromVelocity`, no `currentDir`, no `setDir`).

### Step 6.2 -- Implement: add direction support to sprites.js

- [ ] **`js/sprites.js`:** Add `direction` state variable (default 0), `setDir(d)`, `currentDir` getter, and update `getFrame()` to compute `sx = (direction * spriteInfo.FRAMES + frame) * spriteInfo.W`.

- [ ] **`js/sprites.js`:** Add and export `directionFromVelocity(dx, dy)`:

```js
export function directionFromVelocity(dx, dy) {
  if (dx === 0 && dy === 0) return 0; // south default
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 1 : 3; // west : east
  }
  return dy < 0 ? 2 : 0; // north : south
}
```

- [ ] **Verify:** All `sprites.test.js` tests pass.

---

## Task 7: Movement -- Direction Calculation (movement.js)

Extend the movement system to track and expose the direction each entity is facing, based on its movement vector. The renderer will read this to pick the correct sprite direction.

### Step 7.1 -- Test: movement exposes direction

- [ ] **Test file:** Add direction tests to `tests/movement.test.js`

Add this new describe block at the end of the existing test file:

```js
describe('Entity direction tracking', () => {
  it('getDirection returns 0 (south) for idle entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    expect(ms.getDirection(0)).toBe(0);
  });

  it('getDirection returns a valid direction (0-3) for moving entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    ms.update(5000, { animals: [{ id: 0, species: 'dog' }], staff: [] });
    const dir = ms.getDirection(0);
    expect(dir >= 0 && dir <= 3).toBe(true);
  });

  it('getDirection returns null for unknown entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    expect(ms.getDirection(999)).toBe(null);
  });
});
```

- [ ] **Verify:** Tests FAIL (`getDirection` does not exist).

### Step 7.2 -- Implement: add direction tracking to movement.js

- [ ] **`js/movement.js`:** Add `import { directionFromVelocity } from './sprites.js';`

- [ ] **`js/movement.js`:** Add `direction: 0` to entity state in `initAnimal` and `initStaff`.

- [ ] **`js/movement.js`:** In `moveToward()`, after computing `dx, dy`, set `ent.direction = directionFromVelocity(dx, dy)`.

- [ ] **`js/movement.js`:** Add `getDirection(id)` to the returned API:
```js
function getDirection(id) {
  const ent = entities.get(id);
  if (!ent) return null;
  return ent.direction;
}
```

- [ ] **`js/movement.js`:** Add `getDirection` to the return statement.

- [ ] **Verify:** All `movement.test.js` tests pass (including new direction tests).

---

## Task 8: Particles -- Unicode Rendering (particles.js)

Simplify particle rendering from procedural Canvas shapes to Unicode `fillText`. Hearts become `\u2665`, stars `\u2605`, notes `\u266A`, sparkle `\u2726`.

### Step 8.1 -- Test: particle system unchanged API, unicode rendering

- [ ] **Test file:** Update `tests/particles.test.js` -- existing tests remain valid (API unchanged). Add one new test:

```js
describe('PA unicode rendering', () => {
  it('renders all particle types without throwing', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 50, 50, 2);
    ps.emit('star', 60, 60, 1);
    ps.emit('note', 70, 70, 1);
    ps.emit('sparkle', 80, 80, 1);
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    let threw = false;
    try { ps.render(ctx); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Existing tests still pass.

### Step 8.2 -- Implement: replace Canvas shape rendering with fillText

- [ ] **`js/particles.js`:** Replace the four render functions (`renderHeart`, `renderStar`, `renderNote`, `renderSparkle`) with a single unicode-based renderer:

```js
const UNICODE_MAP = {
  heart:   { char: '\u2665', color: '#E91E63' },
  star:    { char: '\u2605', color: '#F9A825' },
  note:    { char: '\u266A', color: '#7E57C2' },
  sparkle: { char: '\u2726', color: '#FFFFFF' },
};

function render(ctx) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    const cfg = UNICODE_MAP[p.type];
    if (!cfg) continue;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = cfg.color;
    ctx.font = `${p.size * 2}px sans-serif`;
    ctx.fillText(cfg.char, p.x, p.y);
  }
  ctx.restore();
}
```

- [ ] Remove the old `renderHeart`, `renderStar`, `renderNote`, `renderSparkle` functions and `renderers` map.
- [ ] **Verify:** All `particles.test.js` tests pass.

---

## Task 9: Renderer Rewrite -- Top-Down (renderer.js)

Complete rewrite. No more isometric projection, no depth sorting. Layer-based draw order: ground tiles, deco, entities, particles, UI overlays. Uses `toScreen()` from grid.js. Wall rendering as thick outlines on tile edges.

### Step 9.1 -- Test: renderer creates and renders without error

- [ ] **Test file:** Rewrite `tests/renderer.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

describe('Top-down renderer math', () => {
  it('world pixel dimensions are 768x768', () => {
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;
    expect(worldW).toBe(768);
    expect(worldH).toBe(768);
  });

  it('toScreen produces correct screen coords for projection', () => {
    const s = toScreen(5, 10);
    expect(s.x).toBe(160);
    expect(s.y).toBe(320);
  });

  it('bottom-right tile screen position is (23*32, 23*32) = (736,736)', () => {
    const s = toScreen(MAP_COLS - 1, MAP_ROWS - 1);
    expect(s.x).toBe(736);
    expect(s.y).toBe(736);
  });
});

describe('Renderer getWorldSize', () => {
  it('returns 768x768 for PA top-down', () => {
    // This test requires importing createRenderer; use a minimal mock if needed
    // For now we test the math directly
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;
    expect(worldW).toBe(768);
    expect(worldH).toBe(768);
  });
});
```

- [ ] **Verify:** Tests pass (they test grid math, not the old renderer).

### Step 9.2 -- Implement: rewrite renderer.js for top-down

- [ ] **Rewrite** `js/renderer.js`:
  - Import from `'./grid.js'` instead of `'./iso.js'`: `toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS`
  - Remove all `worldToScreen`, `depthKey`, `TILE_W`, `TILE_H` references
  - Remove `mapOffsetX`, `mapOffsetY` calculation (not needed in top-down)
  - Remove `renderables` array and depth sort -- draw in fixed layer order
  - `getWorldSize()` returns `{ w: MAP_COLS * TILE_SIZE, h: MAP_ROWS * TILE_SIZE }` (768x768)
  - Background: solid dark green `#3a5a2a` instead of sky gradient
  - Tile rendering: `ctx.drawImage(tileCanvas, col * TILE_SIZE - camera.x, row * TILE_SIZE - camera.y)`
  - Entity rendering: use `movementSystem.getDirection(id)` to set sprite direction
  - Animal names: draw below each animal sprite in `#e0e0e0` on dark background
  - Particle rendering: pass camera offset to `particleSystem.render(ctx)`

- [ ] **Verify:** `renderer.test.js` passes. Visual check deferred to Task 12.

---

## Task 10: UI Dark Theme (css/style.css, index.html, ui.js)

Rewrite CSS from wood/parchment to PA dark functional theme. Update canvas size in HTML. Add mini-portrait support and animated ticker.

### Step 10.1 -- Test: UI format functions unchanged, canvas dimensions

- [ ] **Test file:** `tests/ui.test.js` -- existing format tests remain unchanged (pure logic). Add canvas size test:

```js
describe('PA canvas dimensions', () => {
  it('canvas element has 680x500 dimensions', () => {
    const canvas = document.getElementById('shelter-canvas');
    // In test environment canvas may not exist; skip if so
    if (!canvas) return;
    expect(canvas.width).toBe(680);
    expect(canvas.height).toBe(500);
  });
});
```

- [ ] **Verify:** Format tests pass. Canvas test may skip in test environment.

### Step 10.2 -- Implement: dark theme CSS rewrite

- [ ] **`index.html`:** Change canvas dimensions from `width="640" height="480"` to `width="680" height="500"`.
- [ ] **`css/style.css`:** Complete rewrite to dark functional theme per spec:
  - Body background: `#1a1a1a`
  - Game container: `#222`, border `#444`
  - Stats bar: `#1a1a1a` bg, `#e0e0e0` text, 1px border bottom `#333`
  - Side panel: `#222` bg, border-left `#333`, text `#e0e0e0`
  - Panel headers: `#888` uppercase labels
  - Action buttons: `#333` bg, `#555` border, `#e0e0e0` text
  - Button hover: `#444` bg, `#888` border
  - Speed btn active: `#555` bg, `#fff` text
  - Dialog: `#2a2a2a` bg, `#555` border
  - Ticker: `#1a1a1a` bg, `#888` text, add `@keyframes ticker-scroll` for marquee animation
  - Money color: `#4CAF50` (accent positive)
  - Reputation color: `#FFD54F` (accent warning)
  - Mini-portrait: `.mini-portrait { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid #555; display: inline-block; }`

- [ ] **`index.html`:** Update canvas CSS width/height to `680px`/`500px`.

- [ ] **Verify:** Page loads with dark theme. Format tests in `ui.test.js` still pass.

### Step 10.3 -- Implement: ticker animation and mini-portraits in ui.js

- [ ] **`js/ui.js`:** In `update()`, wrap ticker text in a `<span class="ticker-text">` for CSS animation.
- [ ] **`js/ui.js`:** In staff/applicant list rendering, prepend a `<span class="mini-portrait" style="background:COLOR"></span>` before each entry name, where COLOR is the role shirt color or species body color from the palettes.
- [ ] **Verify:** Visual check -- dark theme renders, ticker scrolls, mini-portraits show colored circles.

---

## Task 11: Deco Sprites PA Rewrite (sprite-factory.js deco section)

All decoration objects are redrawn as simple PA-style shapes with thick outlines, sized to fit 32x32 tiles. Trees are circles with outlines, furniture is simple rectangles.

### Step 11.1 -- Test: deco sprites have PA dimensions

- [ ] **Test file:** Update `tests/deco-sprites.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createDecoSpriteSheet } from '../js/sprite-factory.js';

describe('createDecoSpriteSheet (PA style)', () => {
  it('returns sprites for all 12 deco types', () => {
    const sheet = createDecoSpriteSheet();
    const types = ['tree_oak', 'tree_pine', 'bush', 'bench', 'flower_bed', 'cage', 'treatment_table', 'counter', 'shelf', 'food_bowl', 'water_bowl', 'climbing_tree'];
    for (const type of types) expect(sheet[type] !== undefined).toBe(true);
  });

  it('each sprite has canvas, w, h', () => {
    const sheet = createDecoSpriteSheet();
    for (const key of Object.keys(sheet)) {
      expect(sheet[key].canvas instanceof HTMLCanvasElement).toBe(true);
      expect(typeof sheet[key].w).toBe('number');
      expect(sheet[key].w).toBeGreaterThan(0);
    }
  });

  it('tree sprites fit within 32x48 (PA smaller scale)', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.tree_oak.w <= 32).toBe(true);
    expect(sheet.tree_oak.h <= 48).toBe(true);
  });

  it('bowl sprites are small circles fitting in tile', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.food_bowl.w <= 16).toBe(true);
    expect(sheet.food_bowl.h <= 16).toBe(true);
  });

  it('all deco sprites have thick outlines (visual check via non-zero pixels)', () => {
    const sheet = createDecoSpriteSheet();
    const ctx = sheet.tree_oak.canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, sheet.tree_oak.w, sheet.tree_oak.h).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) nonTransparent++;
    }
    expect(nonTransparent).toBeGreaterThan(0);
  });

  it('cached -- calling twice returns same reference', () => {
    // Reset cache first by using a fresh import or testing the function
    const s1 = createDecoSpriteSheet();
    const s2 = createDecoSpriteSheet();
    expect(s1 === s2).toBe(true);
  });
});
```

- [ ] **Verify:** Tests FAIL if old sprite sizes are used.

### Step 11.2 -- Implement: PA-style deco sprites

- [ ] **`js/sprite-factory.js`** (deco section): Rewrite all deco drawing functions:
  - Trees: 32x48 canvas, dark circle with 2px `#333` outline for canopy, small trunk rectangle
  - Bush: 16x16 small green circle with outline
  - Bench: 32x16 brown rectangle with outline
  - Flower bed: 32x16 brown rectangle + colored circle dots
  - Cage: 32x32 grey rectangle with vertical line bars, 2px `#333` outline
  - Treatment table: 32x32 light grey rectangle, 2px outline
  - Counter: 32x32 brown rectangle, 2px outline
  - Shelf: 32x32 brown rectangle + horizontal lines
  - Food bowl: 12x12 orange circle (#FF8A65) with outline
  - Water bowl: 12x12 blue circle (#64B5F6) with outline
  - Climbing tree: 16x48 brown post + horizontal platforms with outline

- [ ] **Clear deco cache** (`_decoCache = null`) in test setup or ensure cache returns PA-style sprites.
- [ ] **Verify:** `deco-sprites.test.js` passes.

---

## Task 12: Main.js Integration (main.js)

Update main.js to use grid.js imports, new canvas dimensions, new world size calculation, and top-down particle position calculation. This wires everything together.

### Step 12.1 -- Test: integration test still valid

- [ ] **Test file:** Review `tests/integration.test.js` -- update any references to `worldToScreen`, `TILE_W`, `TILE_H` to use `toScreen`, `TILE_SIZE`.

- [ ] **Verify:** Integration tests pass after import updates.

### Step 12.2 -- Implement: update main.js

- [ ] **`js/main.js` line 16:** Already changed in Task 1.3 to `import { toScreen, TILE_SIZE } from './grid.js';`

- [ ] **`js/main.js`:** Change camera initialization:
  ```js
  const worldSize = renderer.getWorldSize(); // now { w: 768, h: 768 }
  const camera = createCamera(canvas.width, canvas.height, worldSize.w, worldSize.h);
  // Center on building
  const buildingCenter = toScreen(7, 13);
  camera.centerOn(buildingCenter.x, buildingCenter.y);
  ```

- [ ] **`js/main.js`:** Update particle emission positions (remove `mapOffsetX` references):
  ```js
  // Replace all worldToScreen calls for particle positions:
  const screen = toScreen(pos.col, pos.row);
  const sx = screen.x - camera.x + TILE_SIZE / 2;
  const sy = screen.y - camera.y;
  ```

- [ ] **`js/main.js`:** Update adoption dialog particle emission similarly.

- [ ] **`js/main.js`:** Update shop dialog particle emission similarly.

- [ ] **Verify:** Game loads, camera shows shelter, entities render, particles appear at correct positions.

---

## Task 13: Test Cleanup and Full Suite Green

Final task: ensure all tests pass, clean up obsolete test files, and do a full verification pass.

### Step 13.1 -- Remove obsolete test files

- [ ] **Delete** `tests/wall-fix.test.js` (already done in Task 3 if not done earlier)
- [ ] **Remove** its import from `test.html`
- [ ] **Review** `tests/integration.test.js` for any remaining iso.js references and fix them

### Step 13.2 -- Update test.html imports

- [ ] **`test.html`:** Verify final import list:
  ```js
  import './tests/data.test.js';
  import './tests/engine.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import './tests/matching.test.js';
  import './tests/events.test.js';
  import './tests/progression.test.js';
  import './tests/simulation.test.js';
  import './tests/renderer.test.js';
  import './tests/ui.test.js';
  import './tests/integration.test.js';
  import './tests/grid.test.js';
  import './tests/camera.test.js';
  import './tests/tilemap.test.js';
  import './tests/tile-factory.test.js';
  import './tests/sprite-factory.test.js';
  import './tests/sprites.test.js';
  import './tests/water-anim.test.js';
  import './tests/movement.test.js';
  import './tests/deco.test.js';
  import './tests/deco-sprites.test.js';
  import './tests/particles.test.js';
  import './tests/audio.test.js';
  ```
  Note: `iso.test.js` replaced by `grid.test.js`, `wall-fix.test.js` removed.

### Step 13.3 -- Full verification

- [ ] **Run** all tests at `http://localhost:8080/test.html` -- all green.
- [ ] **Visual check:** Game loads with:
  - Top-down view (flat rectangular tiles, no isometric diamonds)
  - PA muted color palette (dark greens, greys, beiges)
  - Blob-style animal and staff sprites with thick outlines
  - 4-directional sprite facing during movement
  - Dark functional UI (dark panels, grey text, no wood textures)
  - Animated ticker scrolling
  - Mini-portraits in side panel
  - Unicode particle effects
  - Camera scrolling via WASD and mouse drag

---

## Summary: Task Dependency Graph

```
Task 1 (grid.js)
  |
  +---> Task 2 (camera.js) -- no code changes, just test update
  |
  +---> Task 3 (tilemap.js wall unification)
  |       |
  |       +---> Task 4 (tile-factory.js PA rectangles)
  |
  +---> Task 5 (sprite-factory.js PA blobs)
  |       |
  |       +---> Task 6 (sprites.js direction support)
  |               |
  |               +---> Task 7 (movement.js direction tracking)
  |
  +---> Task 8 (particles.js unicode)
  |
  +---> Task 9 (renderer.js top-down rewrite)
  |       |
  |       +---> Task 12 (main.js integration)
  |
  +---> Task 10 (UI dark theme)
  |
  +---> Task 11 (deco sprites PA rewrite)
  |
  +---> Task 13 (test cleanup + full green)
```

Tasks 2-8 can be partially parallelized after Task 1 is complete. Task 9 depends on Tasks 4-7 being done. Task 12 depends on Task 9. Task 13 depends on all others.

## File Change Summary

| File | Action | Task |
|------|--------|------|
| `js/iso.js` | DELETE | 1 |
| `js/grid.js` | CREATE | 1 |
| `js/camera.js` | NO CHANGE | 2 |
| `js/tilemap.js` | MODIFY (import + wall unification) | 1, 3 |
| `js/tile-factory.js` | REWRITE | 1, 4 |
| `js/sprite-factory.js` | REWRITE | 5, 11 |
| `js/sprites.js` | MODIFY (add direction) | 6 |
| `js/movement.js` | MODIFY (add direction tracking) | 7 |
| `js/particles.js` | MODIFY (unicode render) | 8 |
| `js/renderer.js` | REWRITE | 1, 9 |
| `js/main.js` | MODIFY (imports + positions) | 1, 12 |
| `js/ui.js` | MODIFY (mini-portraits, ticker) | 10 |
| `css/style.css` | REWRITE | 10 |
| `index.html` | MODIFY (canvas size) | 10 |
| `test.html` | MODIFY (imports) | 1, 13 |
| `tests/iso.test.js` | DELETE (replaced by grid.test.js) | 1 |
| `tests/grid.test.js` | CREATE | 1 |
| `tests/camera.test.js` | MODIFY (dimensions) | 2 |
| `tests/tilemap.test.js` | MODIFY (import + wall tests) | 1, 3 |
| `tests/tile-factory.test.js` | REWRITE | 4 |
| `tests/sprite-factory.test.js` | REWRITE | 5 |
| `tests/sprites.test.js` | REWRITE | 6 |
| `tests/movement.test.js` | MODIFY (direction tests) | 7 |
| `tests/particles.test.js` | MODIFY (unicode test) | 8 |
| `tests/renderer.test.js` | REWRITE | 9 |
| `tests/wall-fix.test.js` | DELETE | 3 |
| `tests/water-anim.test.js` | MODIFY (dimensions) | 4 |
| `tests/deco.test.js` | MODIFY (import) | 1 |
| `tests/deco-sprites.test.js` | MODIFY (PA sizes) | 11 |
| `tests/ui.test.js` | MODIFY (canvas test) | 10 |
| `tests/integration.test.js` | MODIFY (imports) | 12, 13 |
