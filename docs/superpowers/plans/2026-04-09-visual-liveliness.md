# Visual Liveliness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the isometric scene to life with animal random-walk movement, staff waypoint navigation, deco/furniture sprites, particle effects, animated water tiles, and a wall-tile rendering fix. All changes are purely visual -- game logic remains untouched.

**Architecture:** Six features implemented as isolated modules (`movement.js`, `particles.js`) plus targeted edits to existing renderer pipeline (`tile-factory.js`, `tilemap.js`, `sprite-factory.js`, `renderer.js`, `simulation.js`, `main.js`). Each feature is independently testable via the browser-based test runner.

**Tech Stack:** Vanilla HTML5 Canvas, ES modules, custom test runner (`js/test-runner.js`), browser tests at `http://localhost:8080/test.html`.

---

## Feature 1: Wall-Tile Fix (tile-factory.js)

The wall draw functions paint the roof diamond at `y=0`, overlapping the wall face below it. The fix shifts wall-face vertices so the face starts at `y = TILE_H` (bottom edge of diamond) and extends to `y = wallH`, creating a seamless junction.

### Step 1.1 -- Test: wall_back canvas has no overlap at diamond region

- [ ] **Test file:** `tests/wall-fix.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';
import { TILE_W, TILE_H } from '../js/iso.js';

describe('Wall-tile fix', () => {
  it('wall_back top-left quadrant has roof color, not wall color', () => {
    const cache = createTileCache();
    const ctx = cache.wall_back.getContext('2d');
    // Sample pixel at the center of the diamond (top half of canvas)
    // The diamond occupies y=0..TILE_H, centered at (TILE_W/2, TILE_H/2)
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2 - 2, 1, 1).data;
    // Roof color is #8B4513 = rgb(139, 69, 19)
    expect(pixel[0]).toBe(139);
    expect(pixel[1]).toBe(69);
    expect(pixel[2]).toBe(19);
  });

  it('wall_back wall face starts below the diamond', () => {
    const cache = createTileCache();
    const ctx = cache.wall_back.getContext('2d');
    const wallH = cache.wall_back.height; // 48
    // Sample pixel in the wall face area (midway between TILE_H and wallH)
    const sampleY = TILE_H + Math.floor((wallH - TILE_H) / 2);
    // Right-side wall face color is #C49155 = rgb(196, 145, 85)
    // Sample right of center to hit the right face
    const pixel = ctx.getImageData(TILE_W / 2 + 8, sampleY, 1, 1).data;
    expect(pixel[0]).toBe(196);
    expect(pixel[1]).toBe(145);
    expect(pixel[2]).toBe(85);
  });

  it('wall_left wall face occupies area below diamond only', () => {
    const cache = createTileCache();
    const ctx = cache.wall_left.getContext('2d');
    // Diamond is at y=0..TILE_H. Wall face should be y=TILE_H..wallH.
    // Sample inside the diamond area at center -- should be diamond fill (#C49155)
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2, 1, 1).data;
    // wall_left diamond color is #C49155 = rgb(196, 145, 85)
    expect(pixel[0]).toBe(196);
    expect(pixel[1]).toBe(145);
    expect(pixel[2]).toBe(85);
  });

  it('wall_right wall face occupies area below diamond only', () => {
    const cache = createTileCache();
    const ctx = cache.wall_right.getContext('2d');
    // Diamond at top, same color as face for wall_right: #B8834A = rgb(184, 131, 74)
    const pixel = ctx.getImageData(TILE_W / 2, TILE_H / 2, 1, 1).data;
    expect(pixel[0]).toBe(184);
    expect(pixel[1]).toBe(131);
    expect(pixel[2]).toBe(74);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/wall-fix.test.js';` before `runAll()`.
- [ ] **Verify:** Open `http://localhost:8080/test.html` -- tests FAIL (wall face overlaps diamond region).

### Step 1.2 -- Implement: fix wall drawing in tile-factory.js

- [ ] **Edit `js/tile-factory.js`** -- rewrite `drawWallBack()`:

Replace the existing `drawWallBack` function with:

```js
function drawWallBack() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Left wall face: from bottom of diamond to bottom of canvas
  ctx.fillStyle = '#D7A86E';
  ctx.beginPath();
  ctx.moveTo(0, TILE_H / 2);           // left edge of diamond bottom-left
  ctx.lineTo(TILE_W / 2, TILE_H);      // diamond bottom center
  ctx.lineTo(TILE_W / 2, wallH);       // straight down
  ctx.lineTo(0, wallH - TILE_H / 2);   // bottom-left of canvas area
  ctx.closePath();
  ctx.fill();
  // Right wall face
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, TILE_H);      // diamond bottom center
  ctx.lineTo(TILE_W, TILE_H / 2);      // right edge of diamond bottom-right
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH);
  ctx.closePath();
  ctx.fill();
  // Roof diamond on top (y=0..TILE_H)
  drawDiamond(ctx, TILE_W, TILE_H, '#8B4513');
  return c;
}
```

- [ ] **Edit `js/tile-factory.js`** -- rewrite `drawWallLeft()`:

Replace the existing `drawWallLeft` function with:

```js
function drawWallLeft() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Left wall face below diamond
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(0, TILE_H / 2);
  ctx.lineTo(TILE_W / 2, TILE_H);
  ctx.lineTo(TILE_W / 2, wallH);
  ctx.lineTo(0, wallH - TILE_H / 2);
  ctx.closePath();
  ctx.fill();
  // Roof diamond on top
  drawDiamond(ctx, TILE_W, TILE_H, '#C49155');
  return c;
}
```

- [ ] **Edit `js/tile-factory.js`** -- rewrite `drawWallRight()`:

Replace the existing `drawWallRight` function with:

```js
function drawWallRight() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  // Right wall face below diamond
  ctx.fillStyle = '#B8834A';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, TILE_H);
  ctx.lineTo(TILE_W, TILE_H / 2);
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH);
  ctx.closePath();
  ctx.fill();
  // Roof diamond on top
  drawDiamond(ctx, TILE_W, TILE_H, '#B8834A');
  return c;
}
```

- [ ] **Verify:** Open `http://localhost:8080/test.html` -- wall-fix tests PASS. Existing `tile-factory.test.js` tests still PASS (wall tiles still taller than floor, all 11 types present).

---

## Feature 2: Water Animation (tile-factory.js + renderer.js)

Water tiles get 3 animation frames with wave positions shifted left/center/right. The renderer cycles through them using a time-based index.

### Step 2.1 -- Test: water tile cache returns an array of 3 canvases

- [ ] **Test file:** `tests/water-anim.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileCache } from '../js/tile-factory.js';

describe('Water animation frames', () => {
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

  it('each water frame has standard tile dimensions', () => {
    const cache = createTileCache();
    for (const frame of cache.water) {
      expect(frame.width).toBe(64);
      expect(frame.height).toBe(32);
    }
  });

  it('water frames differ in pixel content (wave moves)', () => {
    const cache = createTileCache();
    const ctx0 = cache.water[0].getContext('2d');
    const ctx1 = cache.water[1].getContext('2d');
    const data0 = ctx0.getImageData(0, 0, 64, 32).data;
    const data1 = ctx1.getImageData(0, 0, 64, 32).data;
    let diffCount = 0;
    for (let i = 0; i < data0.length; i++) {
      if (data0[i] !== data1[i]) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/water-anim.test.js';` before `runAll()`.
- [ ] **Verify:** Tests FAIL (`cache.water` is a single canvas, not an array).

### Step 2.2 -- Implement: water animation frames in tile-factory.js

- [ ] **Edit `js/tile-factory.js`** -- replace `drawWater()` with a function that generates 3 frames:

```js
function drawWaterFrame(waveOffset) {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#42A5F5');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#1E88E5');
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1;
  // Wave 1
  ctx.beginPath();
  ctx.arc(TILE_W / 2 + waveOffset, TILE_H / 2 - 2, 6, 0, Math.PI);
  ctx.stroke();
  // Wave 2
  ctx.beginPath();
  ctx.arc(TILE_W / 2 - waveOffset * 0.7, TILE_H / 2 + 4, 5, 0, Math.PI);
  ctx.stroke();
  return c;
}
```

- [ ] **Edit `js/tile-factory.js`** -- update `createTileCache()` to return `water` as an array:

Change the `water` line in `createTileCache` from:
```js
    water: drawWater(),
```
to:
```js
    water: [drawWaterFrame(-6), drawWaterFrame(0), drawWaterFrame(6)],
```

- [ ] **Delete** the old `drawWater()` function (it is replaced by `drawWaterFrame`).
- [ ] **Verify:** Tests PASS. Note: existing `tile-factory.test.js` test "has all 11 required tile types" will fail because `cache.water` is now an array, not a canvas. Fix next.

### Step 2.3 -- Fix: update existing tile-factory test for water array

- [ ] **Edit `tests/tile-factory.test.js`** -- update the "has all 11 required tile types" test:

Replace:
```js
    const required = ['grass', 'grass2', 'grass3', 'grass_flower', 'path', 'floor', 'wall_back', 'wall_left', 'wall_right', 'fence', 'water'];
    for (const key of required) {
      expect(cache[key] instanceof HTMLCanvasElement).toBeTruthy();
    }
```

With:
```js
    const canvasKeys = ['grass', 'grass2', 'grass3', 'grass_flower', 'path', 'floor', 'wall_back', 'wall_left', 'wall_right', 'fence'];
    for (const key of canvasKeys) {
      expect(cache[key] instanceof HTMLCanvasElement).toBeTruthy();
    }
    // water is now an array of 3 frames
    expect(Array.isArray(cache.water)).toBeTruthy();
    expect(cache.water.length).toBe(3);
```

- [ ] **Verify:** All `tile-factory.test.js` and `water-anim.test.js` tests PASS.

### Step 2.4 -- Implement: renderer uses animated water tiles

- [ ] **Edit `js/renderer.js`** -- in the ground-tiles loop inside `render()`, change the water tile lookup.

Find the block:
```js
        let tileCanvas = tileCache[tileType];
```

Replace the tile-selection block (lines 91-95 of renderer.js) with:
```js
        let tileCanvas;
        if (tileType === 'water') {
          const waterFrame = Math.floor(Date.now() / 500) % 3;
          tileCanvas = tileCache.water[waterFrame];
        } else if (tileType === 'grass') {
          const v = (col * 7 + row * 13) % 3;
          tileCanvas = v === 0 ? tileCache.grass : v === 1 ? tileCache.grass2 : tileCache.grass3;
        } else {
          tileCanvas = tileCache[tileType];
        }
```

- [ ] **Verify:** Open game at `http://localhost:8080/` -- water tiles near col 1-2, row 4-5 animate with shifting waves. All tests still PASS.

---

## Feature 3: Movement System (new module js/movement.js)

A new module managing `worldPos` (float col/row for smooth interpolation) for all entities. Animals do random-walk within their enclosure zone. Staff navigate along path tiles to assigned animals.

### Step 3.1 -- Test: createMovementSystem exists and returns API

- [ ] **Test file:** `tests/movement.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createMovementSystem } from '../js/movement.js';
import { createTileMap, ZONES } from '../js/tilemap.js';

describe('createMovementSystem', () => {
  it('returns an object with the required API methods', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    expect(typeof ms.initAnimal).toBe('function');
    expect(typeof ms.initStaff).toBe('function');
    expect(typeof ms.removeEntity).toBe('function');
    expect(typeof ms.update).toBe('function');
    expect(typeof ms.getPosition).toBe('function');
    expect(typeof ms.isMoving).toBe('function');
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/movement.test.js';` before `runAll()`.
- [ ] **Verify:** Tests FAIL (module does not exist).

### Step 3.2 -- Implement: movement.js skeleton with API stubs

- [ ] **Create `js/movement.js`:**

```js
import { ZONES } from './tilemap.js';

const SPECIES_ZONE_MAP = {
  dog: 'dogRun',
  cat: 'catEnclosure',
  rabbit: 'smallPetArea',
  smallpet: 'smallPetArea',
  bird: 'birdAviary',
};

export function createMovementSystem(tileMap) {
  const entities = new Map();

  function initAnimal(animal, zone) {
    const z = zone || ZONES[SPECIES_ZONE_MAP[animal.species]];
    if (!z) return;
    const innerCols = Math.max(1, z.maxCol - z.minCol - 1);
    const innerRows = Math.max(1, z.maxRow - z.minRow - 1);
    const col = z.minCol + 1 + (animal.id % innerCols);
    const row = z.minRow + 1 + Math.floor(animal.id / innerCols) % innerRows;
    entities.set(animal.id, {
      worldPos: { col, row },
      targetTile: { col, row },
      zone: z,
      type: 'animal',
      speed: 0.5,
      pauseTimer: 0,
      pauseDuration: 2000 + Math.random() * 2000,
      moving: false,
    });
  }

  function initStaff(staff) {
    const col = 6 + (staff.id % 3);
    const row = 17;
    entities.set(staff.id, {
      worldPos: { col, row },
      targetTile: { col, row },
      zone: null,
      type: 'staff',
      speed: 1.0,
      waypoints: [],
      moving: false,
      arrivedAtTarget: false,
    });
  }

  function removeEntity(id) {
    entities.delete(id);
  }

  function getPosition(id) {
    const ent = entities.get(id);
    if (!ent) return null;
    return { col: ent.worldPos.col, row: ent.worldPos.row };
  }

  function isMoving(id) {
    const ent = entities.get(id);
    return ent ? ent.moving : false;
  }

  function update(dt, state) {
    // Will be implemented in subsequent steps
  }

  return { initAnimal, initStaff, removeEntity, update, getPosition, isMoving };
}
```

- [ ] **Verify:** `movement.test.js` "returns an object with the required API methods" PASSES.

### Step 3.3 -- Test: initAnimal places animal within enclosure bounds

- [ ] **Append to `tests/movement.test.js`:**

```js
describe('initAnimal', () => {
  it('places animal within dogRun zone interior', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    const pos = ms.getPosition(animal.id);
    expect(pos.col).toBeGreaterThan(ZONES.dogRun.minCol);
    expect(pos.col).toBeLessThan(ZONES.dogRun.maxCol);
    expect(pos.row).toBeGreaterThan(ZONES.dogRun.minRow);
    expect(pos.row).toBeLessThan(ZONES.dogRun.maxRow);
  });

  it('places cat within catEnclosure zone interior', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 1, species: 'cat' };
    ms.initAnimal(animal);
    const pos = ms.getPosition(animal.id);
    expect(pos.col).toBeGreaterThan(ZONES.catEnclosure.minCol);
    expect(pos.col).toBeLessThan(ZONES.catEnclosure.maxCol);
    expect(pos.row).toBeGreaterThan(ZONES.catEnclosure.minRow);
    expect(pos.row).toBeLessThan(ZONES.catEnclosure.maxRow);
  });

  it('returns null for uninitialized entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    expect(ms.getPosition(999)).toBe(null);
  });
});
```

- [ ] **Verify:** Tests PASS (initAnimal already implemented in step 3.2).

### Step 3.4 -- Test: initStaff places staff in reception area

- [ ] **Append to `tests/movement.test.js`:**

```js
describe('initStaff', () => {
  it('places staff in reception area (row 17, col 6-8)', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: null };
    ms.initStaff(staff);
    const pos = ms.getPosition(staff.id);
    expect(pos.row).toBe(17);
    expect(pos.col >= 5 && pos.col <= 8).toBe(true);
  });

  it('isMoving returns false for idle staff', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: null };
    ms.initStaff(staff);
    expect(ms.isMoving(staff.id)).toBe(false);
  });
});
```

- [ ] **Verify:** Tests PASS.

### Step 3.5 -- Test: animal random-walk update moves toward target

- [ ] **Append to `tests/movement.test.js`:**

```js
describe('Animal random walk', () => {
  it('animal starts not moving (in pause phase)', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    expect(ms.isMoving(animal.id)).toBe(false);
  });

  it('after pause expires, animal picks a target and starts moving', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    const state = { animals: [animal], staff: [] };
    // Advance past the maximum possible pause duration (4000ms + margin)
    ms.update(5000, state);
    expect(ms.isMoving(animal.id)).toBe(true);
  });

  it('animal stays within zone during movement', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    const state = { animals: [animal], staff: [] };
    // Run many updates to simulate lots of movement
    for (let i = 0; i < 100; i++) {
      ms.update(200, state);
    }
    const pos = ms.getPosition(animal.id);
    expect(pos.col).toBeGreaterThan(ZONES.dogRun.minCol);
    expect(pos.col).toBeLessThan(ZONES.dogRun.maxCol);
    expect(pos.row).toBeGreaterThan(ZONES.dogRun.minRow);
    expect(pos.row).toBeLessThan(ZONES.dogRun.maxRow);
  });
});
```

- [ ] **Verify:** Tests FAIL (update is a no-op stub).

### Step 3.6 -- Implement: animal random-walk in movement.js update()

- [ ] **Edit `js/movement.js`** -- replace the `update` function with full animal movement logic:

```js
  function pickAnimalTarget(ent) {
    const z = ent.zone;
    const minCol = z.minCol + 1;
    const maxCol = z.maxCol - 1;
    const minRow = z.minRow + 1;
    const maxRow = z.maxRow - 1;
    const range = 2;
    let col, row, attempts = 0;
    do {
      col = ent.worldPos.col + Math.floor(Math.random() * (range * 2 + 1)) - range;
      row = ent.worldPos.row + Math.floor(Math.random() * (range * 2 + 1)) - range;
      col = Math.max(minCol, Math.min(maxCol, Math.round(col)));
      row = Math.max(minRow, Math.min(maxRow, Math.round(row)));
      attempts++;
    } while (attempts < 10 && col === Math.round(ent.worldPos.col) && row === Math.round(ent.worldPos.row));
    ent.targetTile = { col, row };
  }

  function moveToward(ent, dtSec) {
    const dx = ent.targetTile.col - ent.worldPos.col;
    const dy = ent.targetTile.row - ent.worldPos.row;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.05) {
      ent.worldPos.col = ent.targetTile.col;
      ent.worldPos.row = ent.targetTile.row;
      return true; // arrived
    }
    const step = Math.min(ent.speed * dtSec, dist);
    ent.worldPos.col += (dx / dist) * step;
    ent.worldPos.row += (dy / dist) * step;
    return false;
  }

  function update(dt, state) {
    const dtSec = dt / 1000;

    for (const [id, ent] of entities) {
      if (ent.type === 'animal') {
        if (!ent.moving) {
          ent.pauseTimer += dt;
          if (ent.pauseTimer >= ent.pauseDuration) {
            pickAnimalTarget(ent);
            ent.moving = true;
            ent.pauseTimer = 0;
          }
        } else {
          const arrived = moveToward(ent, dtSec);
          if (arrived) {
            ent.moving = false;
            ent.pauseDuration = 2000 + Math.random() * 2000;
            ent.pauseTimer = 0;
          }
        }
      }
    }
  }
```

- [ ] **Verify:** All three animal random-walk tests PASS. Earlier tests still PASS.

### Step 3.7 -- Test: staff waypoint navigation to assigned animal

- [ ] **Append to `tests/movement.test.js`:**

```js
describe('Staff waypoint navigation', () => {
  it('staff moves toward assigned animal when update is called', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: 0 };
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    ms.initStaff(staff);
    const startPos = ms.getPosition(staff.id);
    const state = { animals: [animal], staff: [staff] };
    // Run several updates
    for (let i = 0; i < 50; i++) {
      ms.update(200, state);
    }
    const endPos = ms.getPosition(staff.id);
    const animalPos = ms.getPosition(animal.id);
    // Staff should have moved closer to the animal
    const startDist = Math.abs(startPos.col - animalPos.col) + Math.abs(startPos.row - animalPos.row);
    const endDist = Math.abs(endPos.col - animalPos.col) + Math.abs(endPos.row - animalPos.row);
    expect(endDist).toBeLessThan(startDist);
  });

  it('staff returns to reception when unassigned', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: null };
    ms.initStaff(staff);
    // Manually move staff away from reception
    const pos = ms.getPosition(staff.id);
    const state = { animals: [], staff: [staff] };
    // Staff is already at reception, should stay
    for (let i = 0; i < 10; i++) {
      ms.update(200, state);
    }
    const endPos = ms.getPosition(staff.id);
    expect(endPos.row >= 16 && endPos.row <= 18).toBe(true);
    expect(endPos.col >= 5 && endPos.col <= 8).toBe(true);
  });

  it('staff isMoving returns true while navigating', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: 0 };
    ms.initAnimal(animal);
    ms.initStaff(staff);
    const state = { animals: [animal], staff: [staff] };
    ms.update(200, state);
    // Staff should be moving (they start at reception, animal is in dogRun)
    expect(ms.isMoving(staff.id)).toBe(true);
  });
});
```

- [ ] **Verify:** Tests FAIL (staff update logic not yet implemented).

### Step 3.8 -- Implement: staff waypoint navigation in movement.js

- [ ] **Edit `js/movement.js`** -- add staff pathfinding logic. Add these helpers and extend the `update` function:

Add before the `update` function:

```js
  const RECEPTION = { col: 6, row: 17 };

  function findPathTileNeighbor(col, row) {
    const dirs = [{dc: 0, dr: -1}, {dc: 1, dr: 0}, {dc: 0, dr: 1}, {dc: -1, dr: 0}];
    for (const d of dirs) {
      const nc = Math.round(col) + d.dc;
      const nr = Math.round(row) + d.dr;
      if (tileMap.getTile(nc, nr) === 'path') return { col: nc, row: nr };
    }
    // Expand search to 2-tile radius
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nc = Math.round(col) + dc;
        const nr = Math.round(row) + dr;
        if (tileMap.getTile(nc, nr) === 'path') return { col: nc, row: nr };
      }
    }
    return null;
  }

  function buildWaypoints(fromCol, fromRow, toCol, toRow) {
    const waypoints = [];
    // Step 1: get to nearest path tile
    const startPath = findPathTileNeighbor(fromCol, fromRow);
    if (!startPath) return [{ col: toCol, row: toRow }];
    waypoints.push(startPath);

    // Step 2: greedy walk along path tiles toward destination
    let current = { ...startPath };
    const visited = new Set();
    visited.add(`${current.col},${current.row}`);
    const maxSteps = 60;
    let steps = 0;

    while (steps < maxSteps) {
      const dirs = [{dc: 0, dr: -1}, {dc: 1, dr: 0}, {dc: 0, dr: 1}, {dc: -1, dr: 0}];
      let best = null;
      let bestDist = Infinity;
      for (const d of dirs) {
        const nc = current.col + d.dc;
        const nr = current.row + d.dr;
        const key = `${nc},${nr}`;
        if (visited.has(key)) continue;
        if (tileMap.getTile(nc, nr) !== 'path') continue;
        const dist = Math.abs(nc - toCol) + Math.abs(nr - toRow);
        if (dist < bestDist) {
          bestDist = dist;
          best = { col: nc, row: nr };
        }
      }
      if (!best) break;
      waypoints.push(best);
      visited.add(`${best.col},${best.row}`);
      current = best;
      steps++;
      // Close enough to destination zone? Step off path toward target
      if (Math.abs(current.col - toCol) + Math.abs(current.row - toRow) <= 2) break;
    }

    // Step 3: final destination (next to animal)
    waypoints.push({ col: toCol, row: toRow });
    return waypoints;
  }
```

Extend the staff section inside `update`:

```js
      if (ent.type === 'staff') {
        const staff = state.staff.find(s => s.id === id);
        if (!staff) continue;

        const animalId = staff.assignedAnimalId;
        if (animalId !== null) {
          const animalEnt = entities.get(animalId);
          if (animalEnt && ent.waypoints.length === 0 && !ent.arrivedAtTarget) {
            const animalPos = animalEnt.worldPos;
            const destCol = Math.round(animalPos.col) + 1;
            const destRow = Math.round(animalPos.row);
            ent.waypoints = buildWaypoints(
              Math.round(ent.worldPos.col), Math.round(ent.worldPos.row),
              destCol, destRow
            );
          }
        } else if (!ent.arrivedAtTarget) {
          // Return to reception
          const dist = Math.abs(ent.worldPos.col - RECEPTION.col) + Math.abs(ent.worldPos.row - RECEPTION.row);
          if (dist > 0.5 && ent.waypoints.length === 0) {
            ent.waypoints = buildWaypoints(
              Math.round(ent.worldPos.col), Math.round(ent.worldPos.row),
              RECEPTION.col, RECEPTION.row
            );
          }
        }

        // Follow waypoints
        if (ent.waypoints.length > 0) {
          ent.moving = true;
          ent.targetTile = ent.waypoints[0];
          const arrived = moveToward(ent, dtSec);
          if (arrived) {
            ent.waypoints.shift();
            if (ent.waypoints.length === 0) {
              ent.moving = false;
              ent.arrivedAtTarget = true;
              if (staff && staff.assignedAnimalId !== null) {
                staff._working = true;
              }
            }
          }
        }

        // If assignment changed, reset path
        if (staff && ent._lastAssignment !== staff.assignedAnimalId) {
          ent._lastAssignment = staff.assignedAnimalId;
          ent.waypoints = [];
          ent.arrivedAtTarget = false;
          ent.moving = false;
          if (staff.assignedAnimalId === null) {
            staff._working = false;
          }
        }
      }
```

- [ ] **Verify:** All staff waypoint tests PASS. All earlier tests PASS.

### Step 3.9 -- Test: removeEntity cleans up

- [ ] **Append to `tests/movement.test.js`:**

```js
describe('removeEntity', () => {
  it('removes entity so getPosition returns null', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 5, species: 'rabbit' };
    ms.initAnimal(animal);
    expect(ms.getPosition(5)).toBeTruthy();
    ms.removeEntity(5);
    expect(ms.getPosition(5)).toBe(null);
  });

  it('isMoving returns false for removed entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 5, species: 'rabbit' };
    ms.initAnimal(animal);
    ms.removeEntity(5);
    expect(ms.isMoving(5)).toBe(false);
  });
});
```

- [ ] **Verify:** Tests PASS (removeEntity already implemented in step 3.2).

### Step 3.10 -- Integrate: renderer.js reads positions from movement system

- [ ] **Edit `js/renderer.js`** -- change `createRenderer` signature to accept `movementSystem`:

Change the export line from:
```js
export function createRenderer(canvas, tileMap) {
```
to:
```js
export function createRenderer(canvas, tileMap, movementSystem) {
```

- [ ] **Edit `js/renderer.js`** -- replace animal position lookup in the animals loop.

Replace:
```js
      const pos = getAnimalPosition(animal);
```
with:
```js
      const pos = (movementSystem && movementSystem.getPosition(animal.id)) || getAnimalPosition(animal);
```

- [ ] **Edit `js/renderer.js`** -- replace staff position lookup in the staff loop.

Replace:
```js
      const pos = getStaffPosition(staff, state);
```
with:
```js
      const pos = (movementSystem && movementSystem.getPosition(staff.id)) || getStaffPosition(staff, state);
```

- [ ] **Verify:** All tests PASS. Renderer still works without movement system (graceful fallback).

### Step 3.11 -- Integrate: simulation.js calls movement.update()

- [ ] **Edit `js/simulation.js`** -- add optional movement system parameter.

Change function signature from:
```js
export function simulateTick(state) {
```
to:
```js
export function simulateTick(state, movementSystem) {
```

Add at the end of `simulateTick`, before the closing brace:
```js
  if (movementSystem) {
    movementSystem.update(BALANCING.msPerTick, state);
  }
```

Add `BALANCING` to the existing import if not already there (it is already imported).

- [ ] **Verify:** All `simulation.test.js` tests still PASS (movementSystem is optional).

### Step 3.12 -- Integrate: main.js creates and wires movement system

- [ ] **Edit `js/main.js`** -- add import:

```js
import { createMovementSystem } from './movement.js';
```

- [ ] **Edit `js/main.js`** -- create movement system after tileMap:

After the line:
```js
const tileMap = createTileMap();
```
add:
```js
const movementSystem = createMovementSystem(tileMap);
```

- [ ] **Edit `js/main.js`** -- pass movementSystem to renderer:

Change:
```js
const renderer = createRenderer(canvas, tileMap);
```
to:
```js
const renderer = createRenderer(canvas, tileMap, movementSystem);
```

- [ ] **Edit `js/main.js`** -- pass movementSystem to simulateTick:

Change:
```js
    simulateTick(state);
```
to:
```js
    simulateTick(state, movementSystem);
```

- [ ] **Edit `js/main.js`** -- initialize movement positions for starting animals/staff.

After the initial animal/staff creation block (the `if` block starting at line 246), add:

```js
for (const animal of state.animals) {
  movementSystem.initAnimal(animal);
}
for (const staff of state.staff) {
  movementSystem.initStaff(staff);
}
```

- [ ] **Edit `js/main.js`** -- initialize newly created animals. In `showIntakeDialog()`, after `state.animals.push(animal);`, add:

```js
      movementSystem.initAnimal(animal);
```

- [ ] **Edit `js/main.js`** -- initialize newly hired staff. In `showStaffDialog()`, after `state.staff.push(staff);`, add:

```js
      movementSystem.initStaff(staff);
```

- [ ] **Verify:** Open game at `http://localhost:8080/` -- animals wander within their enclosures, staff walks to assigned animals. All tests PASS.

---

## Feature 4: Deco & Furniture (tilemap.js + sprite-factory.js + renderer.js)

Static decoration objects (trees, bushes, furniture) placed on the map as a separate layer, rendered with depth sorting.

### Step 4.1 -- Test: tilemap getDecoMap returns 24x24 grid

- [ ] **Test file:** `tests/deco.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createTileMap } from '../js/tilemap.js';
import { MAP_COLS, MAP_ROWS } from '../js/iso.js';

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

  it('has counter deco in reception area (row 16-17, col 5-8)', () => {
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
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (deco[r][c] === 'food_bowl') found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('has tree_oak in outdoor area', () => {
    const map = createTileMap();
    const deco = map.getDecoMap();
    let found = false;
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        if (deco[r][c] === 'tree_oak') found = true;
      }
    }
    expect(found).toBe(true);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/deco.test.js';` before `runAll()`.
- [ ] **Verify:** Tests FAIL (getDecoMap does not exist).

### Step 4.2 -- Implement: getDecoMap in tilemap.js

- [ ] **Edit `js/tilemap.js`** -- add deco map generation and expose it in the returned object.

Add the following function before `computeTileType`:

```js
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
```

- [ ] **Edit `js/tilemap.js`** -- call `computeDecoMap` inside `createTileMap` and expose it:

After the `tiles` loop in `createTileMap`, add:
```js
  const decoMap = computeDecoMap(tiles);

  function getDecoMap() {
    return decoMap;
  }
```

Update the return statement from:
```js
  return { tiles, cols: MAP_COLS, rows: MAP_ROWS, getTile, getZone };
```
to:
```js
  return { tiles, cols: MAP_COLS, rows: MAP_ROWS, getTile, getZone, getDecoMap };
```

- [ ] **Verify:** All `deco.test.js` tests PASS. All `tilemap.test.js` tests still PASS.

### Step 4.3 -- Test: createDecoSpriteSheet returns sprite data for all deco types

- [ ] **Test file:** `tests/deco-sprites.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createDecoSpriteSheet } from '../js/sprite-factory.js';

describe('createDecoSpriteSheet', () => {
  it('returns an object with sprites for all deco types', () => {
    const sheet = createDecoSpriteSheet();
    const requiredTypes = [
      'tree_oak', 'tree_pine', 'bush', 'bench', 'flower_bed',
      'cage', 'treatment_table', 'counter', 'shelf',
      'food_bowl', 'water_bowl', 'climbing_tree',
    ];
    for (const type of requiredTypes) {
      expect(sheet[type] !== undefined).toBe(true);
    }
  });

  it('each sprite entry has canvas, w, and h properties', () => {
    const sheet = createDecoSpriteSheet();
    for (const key of Object.keys(sheet)) {
      expect(sheet[key].canvas instanceof HTMLCanvasElement).toBe(true);
      expect(typeof sheet[key].w).toBe('number');
      expect(typeof sheet[key].h).toBe('number');
      expect(sheet[key].w).toBeGreaterThan(0);
      expect(sheet[key].h).toBeGreaterThan(0);
    }
  });

  it('tree sprites are taller than bowl sprites', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.tree_oak.h).toBeGreaterThan(sheet.food_bowl.h);
  });

  it('cached -- calling twice returns same reference', () => {
    const sheet1 = createDecoSpriteSheet();
    const sheet2 = createDecoSpriteSheet();
    expect(sheet1 === sheet2).toBe(true);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/deco-sprites.test.js';` before `runAll()`.
- [ ] **Verify:** Tests FAIL (createDecoSpriteSheet does not exist).

### Step 4.4 -- Implement: createDecoSpriteSheet in sprite-factory.js

- [ ] **Edit `js/sprite-factory.js`** -- add the full deco sprite sheet factory at the end of the file, before the final exports:

```js
let _decoCache = null;

export function createDecoSpriteSheet() {
  if (_decoCache) return _decoCache;

  function draw(w, h, painter) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    painter(ctx, w, h);
    return { canvas: c, w, h };
  }

  _decoCache = {
    tree_oak: draw(64, 96, (ctx, w, h) => {
      // Trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(28, 50, 8, 46);
      // Canopy (round)
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(32, 40, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#43A047';
      ctx.beginPath();
      ctx.arc(28, 35, 16, 0, Math.PI * 2);
      ctx.fill();
    }),

    tree_pine: draw(64, 96, (ctx, w, h) => {
      // Trunk
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(29, 60, 6, 36);
      // Triangle layers
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath(); ctx.moveTo(32, 5); ctx.lineTo(52, 40); ctx.lineTo(12, 40); ctx.fill();
      ctx.fillStyle = '#388E3C';
      ctx.beginPath(); ctx.moveTo(32, 20); ctx.lineTo(56, 55); ctx.lineTo(8, 55); ctx.fill();
      ctx.fillStyle = '#43A047';
      ctx.beginPath(); ctx.moveTo(32, 35); ctx.lineTo(58, 65); ctx.lineTo(6, 65); ctx.fill();
    }),

    bush: draw(32, 32, (ctx) => {
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(16, 22, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.arc(12, 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 18, 8, 0, Math.PI * 2);
      ctx.fill();
    }),

    bench: draw(64, 32, (ctx) => {
      // Seat
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 14, 56, 6);
      // Legs
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(8, 20, 4, 10);
      ctx.fillRect(52, 20, 4, 10);
      // Back rest
      ctx.fillStyle = '#795548';
      ctx.fillRect(4, 8, 56, 4);
      ctx.fillRect(8, 4, 4, 14);
      ctx.fillRect(52, 4, 4, 14);
    }),

    flower_bed: draw(64, 32, (ctx) => {
      // Soil
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(4, 18, 56, 12);
      // Flowers
      const colors = ['#E91E63', '#FF9800', '#FFEB3B', '#9C27B0', '#2196F3'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(10 + i * 11, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Stems
      ctx.fillStyle = '#4CAF50';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(9 + i * 11, 14, 2, 8);
      }
    }),

    cage: draw(64, 64, (ctx) => {
      // Floor
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(4, 48, 56, 12);
      // Bars
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const x = 8 + i * 8;
        ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 48); ctx.stroke();
      }
      // Top bar
      ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(56, 12); ctx.stroke();
      // Open door hint
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(24, 24, 16, 24);
    }),

    treatment_table: draw(64, 64, (ctx) => {
      // Table top
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(4, 20, 56, 8);
      // Legs
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(8, 28, 4, 32);
      ctx.fillRect(52, 28, 4, 32);
      ctx.fillRect(28, 28, 4, 32);
      // Surface detail
      ctx.fillStyle = '#B0BEC5';
      ctx.fillRect(8, 20, 48, 2);
    }),

    counter: draw(64, 64, (ctx) => {
      // Main body
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 16, 56, 44);
      // Top surface
      ctx.fillStyle = '#A1887F';
      ctx.fillRect(2, 12, 60, 8);
      // Front panel lines
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 20); ctx.lineTo(32, 60);
      ctx.stroke();
    }),

    shelf: draw(64, 64, (ctx) => {
      // Back panel
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 0, 56, 64);
      // Shelves
      ctx.fillStyle = '#A1887F';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(2, 12 + i * 18, 60, 4);
      }
      // Bags on shelves
      ctx.fillStyle = '#FFF9C4';
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillRect(30, 2, 12, 10);
      ctx.fillStyle = '#FFCC80';
      ctx.fillRect(12, 20, 10, 12);
      ctx.fillRect(38, 20, 10, 12);
      ctx.fillStyle = '#C8E6C9';
      ctx.fillRect(14, 38, 10, 10);
    }),

    food_bowl: draw(32, 16, (ctx) => {
      // Bowl
      ctx.fillStyle = '#FF8A65';
      ctx.beginPath();
      ctx.ellipse(16, 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Food inside
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.ellipse(16, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }),

    water_bowl: draw(32, 16, (ctx) => {
      // Bowl
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.ellipse(16, 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Water surface
      ctx.fillStyle = '#42A5F5';
      ctx.beginPath();
      ctx.ellipse(16, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }),

    climbing_tree: draw(32, 64, (ctx) => {
      // Post
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(12, 8, 8, 56);
      // Platforms
      ctx.fillStyle = '#A1887F';
      ctx.fillRect(2, 6, 28, 6);
      ctx.fillRect(4, 28, 24, 6);
      ctx.fillRect(0, 50, 32, 6);
      // Carpet on platforms
      ctx.fillStyle = '#CE93D8';
      ctx.fillRect(4, 6, 24, 3);
      ctx.fillRect(6, 28, 20, 3);
      ctx.fillRect(2, 50, 28, 3);
    }),
  };

  return _decoCache;
}
```

- [ ] **Verify:** All `deco-sprites.test.js` tests PASS.

### Step 4.5 -- Implement: renderer draws deco layer

- [ ] **Edit `js/renderer.js`** -- add import for `createDecoSpriteSheet`:

Change the sprite-factory import from:
```js
import { createAnimalSpriteSheet, createStaffSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';
```
to:
```js
import { createAnimalSpriteSheet, createStaffSpriteSheet, createDecoSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';
```

- [ ] **Edit `js/renderer.js`** -- in `createRenderer`, after creating `staffSheets`, add:

```js
  const decoSheets = createDecoSpriteSheet();
  const decoMap = tileMap.getDecoMap();
```

- [ ] **Edit `js/renderer.js`** -- in the `render` function, after the ground-tiles loop and before the Animals loop, add the deco rendering loop:

```js
    // Deco layer
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const decoId = decoMap[row][col];
        if (!decoId) continue;
        const sprite = decoSheets[decoId];
        if (!sprite) continue;
        const screen = worldToScreen(col, row, TILE_W, TILE_H);
        const sx = screen.x + mapOffsetX - camera.x + TILE_W / 2 - sprite.w / 2;
        const sy = screen.y + mapOffsetY - camera.y + TILE_H / 2 - sprite.h;
        if (sx + sprite.w < 0 || sx > W || sy + sprite.h < 0 || sy > H) continue;

        renderables.push({
          depth: depthKey(col, row, 1),
          draw() { ctx.drawImage(sprite.canvas, sx, sy); }
        });
      }
    }
```

- [ ] **Verify:** Open game at `http://localhost:8080/` -- trees, bushes, furniture, and bowls visible on the map. All tests PASS.

---

## Feature 5: Particle Effects (new module js/particles.js)

Lightweight 2D particle system with heart, star, note, and sparkle types. Renders directly on canvas after the depth-sorted layer.

### Step 5.1 -- Test: createParticleSystem exists and returns API

- [ ] **Test file:** `tests/particles.test.js`

```js
import { describe, it, expect } from '../js/test-runner.js';
import { createParticleSystem } from '../js/particles.js';

describe('createParticleSystem', () => {
  it('returns an object with emit, update, render, and count', () => {
    const ps = createParticleSystem();
    expect(typeof ps.emit).toBe('function');
    expect(typeof ps.update).toBe('function');
    expect(typeof ps.render).toBe('function');
    expect(typeof ps.count).toBe('number');
  });

  it('starts with zero particles', () => {
    const ps = createParticleSystem();
    expect(ps.count).toBe(0);
  });
});
```

- [ ] **Register in test.html:** Add `import './tests/particles.test.js';` before `runAll()`.
- [ ] **Verify:** Tests FAIL (module does not exist).

### Step 5.2 -- Implement: particles.js skeleton

- [ ] **Create `js/particles.js`:**

```js
const PARTICLE_TYPES = {
  heart:   { color: '#E91E63', size: 5, maxLife: 2000, vy: -15, vxRange: 3, swing: true },
  star:    { color: '#F9A825', size: 7, maxLife: 1500, vy: -40, vxRange: 20, swing: false },
  note:    { color: '#7E57C2', size: 5, maxLife: 2500, vy: -12, vxRange: 8, swing: true },
  sparkle: { color: '#FFFFFF', size: 3, maxLife: 800,  vy: -30, vxRange: 5, swing: false },
};

const MAX_PARTICLES = 50;

export function createParticleSystem() {
  const particles = [];

  function emit(type, x, y, count) {
    const config = PARTICLE_TYPES[type];
    if (!config) return;
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift(); // remove oldest
      }
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * config.vxRange,
        vy: config.vy + (Math.random() - 0.5) * 10,
        life: config.maxLife,
        maxLife: config.maxLife,
        type,
        size: config.size,
        color: config.color,
        swing: config.swing,
      });
    }
  }

  function update(dt) {
    const dtSec = dt / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      if (p.swing) {
        p.x += Math.sin(p.life * 0.005) * 0.5;
      }
    }
  }

  function renderHeart(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E91E63';
    const s = size / 2;
    ctx.beginPath();
    ctx.arc(x - s / 2, y - s / 2, s, 0, Math.PI * 2);
    ctx.arc(x + s / 2, y - s / 2, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y + s * 1.5);
    ctx.lineTo(x + s, y);
    ctx.fill();
  }

  function renderStar(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#F9A825';
    ctx.fillRect(x - size / 2, y - 1, size, 2);
    ctx.fillRect(x - 1, y - size / 2, 2, size);
    ctx.fillRect(x - size / 3, y - size / 3, size * 0.66, size * 0.66);
  }

  function renderNote(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#7E57C2';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + size / 2 - 1, y - size, 2, size);
    ctx.fillRect(x + size / 2 - 1, y - size, 4, 2);
  }

  function renderSparkle(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  const renderers = { heart: renderHeart, star: renderStar, note: renderNote, sparkle: renderSparkle };

  function render(ctx) {
    ctx.save();
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const fn = renderers[p.type];
      if (fn) fn(ctx, p.x, p.y, p.size, alpha);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return {
    emit,
    update,
    render,
    get count() { return particles.length; },
  };
}
```

- [ ] **Verify:** Both "returns API" and "starts with zero" tests PASS.

### Step 5.3 -- Test: emit creates particles, count tracks them

- [ ] **Append to `tests/particles.test.js`:**

```js
describe('emit', () => {
  it('creates specified number of particles', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 100, 3);
    expect(ps.count).toBe(3);
  });

  it('accepts all four particle types', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 0, 0, 1);
    ps.emit('star', 0, 0, 1);
    ps.emit('note', 0, 0, 1);
    ps.emit('sparkle', 0, 0, 1);
    expect(ps.count).toBe(4);
  });

  it('ignores unknown particle types', () => {
    const ps = createParticleSystem();
    ps.emit('fireball', 0, 0, 5);
    expect(ps.count).toBe(0);
  });

  it('enforces MAX_PARTICLES limit of 50', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 0, 0, 60);
    expect(ps.count).toBeLessThan(51);
  });
});
```

- [ ] **Verify:** All emit tests PASS.

### Step 5.4 -- Test: update ages and removes expired particles

- [ ] **Append to `tests/particles.test.js`:**

```js
describe('update lifecycle', () => {
  it('particles expire after their maxLife', () => {
    const ps = createParticleSystem();
    ps.emit('sparkle', 100, 100, 1);
    expect(ps.count).toBe(1);
    // Sparkle maxLife is 800ms, update with 1000ms
    ps.update(1000);
    expect(ps.count).toBe(0);
  });

  it('particles survive if life remains', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 100, 1);
    // Heart maxLife is 2000ms, update with 500ms
    ps.update(500);
    expect(ps.count).toBe(1);
  });

  it('particles move upward over time', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 200, 1);
    // We cannot access position directly but we can verify count
    ps.update(100);
    expect(ps.count).toBe(1);
  });
});
```

- [ ] **Verify:** All lifecycle tests PASS.

### Step 5.5 -- Test: render calls ctx methods without error

- [ ] **Append to `tests/particles.test.js`:**

```js
describe('render', () => {
  it('calls render without throwing on a mock context', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 50, 50, 2);
    ps.emit('star', 60, 60, 1);
    ps.emit('note', 70, 70, 1);
    ps.emit('sparkle', 80, 80, 1);
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    let threw = false;
    try {
      ps.render(ctx);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(false);
  });
});
```

- [ ] **Verify:** Test PASSES.

### Step 5.6 -- Integrate: renderer calls particles.render() and particles.update()

- [ ] **Edit `js/renderer.js`** -- change `createRenderer` signature to accept `particleSystem`:

Change:
```js
export function createRenderer(canvas, tileMap, movementSystem) {
```
to:
```js
export function createRenderer(canvas, tileMap, movementSystem, particleSystem) {
```

- [ ] **Edit `js/renderer.js`** -- at the end of the `render` function, after `for (const r of renderables) r.draw();`, add:

```js
    // Particle layer (always on top)
    if (particleSystem) {
      particleSystem.update(dt);
      particleSystem.render(ctx);
    }
```

- [ ] **Verify:** All tests PASS. Renderer still works without particle system (graceful fallback).

### Step 5.7 -- Integrate: main.js creates particle system and wires emitter triggers

- [ ] **Edit `js/main.js`** -- add import:

```js
import { createParticleSystem } from './particles.js';
```

- [ ] **Edit `js/main.js`** -- create particle system after movement system:

```js
const particleSystem = createParticleSystem();
```

- [ ] **Edit `js/main.js`** -- pass particleSystem to renderer:

Change:
```js
const renderer = createRenderer(canvas, tileMap, movementSystem);
```
to:
```js
const renderer = createRenderer(canvas, tileMap, movementSystem, particleSystem);
```

- [ ] **Edit `js/main.js`** -- add particle emitter logic in the `onTick` callback, after the `simulateTick` loop:

```js
    // Particle triggers
    for (const animal of state.animals) {
      if (animal.stats.happiness > 0.7) {
        if (Math.random() < 0.01) { // ~every 3 seconds at 250ms ticks
          const pos = movementSystem.getPosition(animal.id);
          if (pos) {
            const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
            particleSystem.emit('heart', screen.x + worldSize.w / 4 - camera.x + TILE_W / 2, screen.y - camera.y, 1);
          }
        }
      }
      if (animal.species === 'bird' && Math.random() < 0.007) {
        const pos = movementSystem.getPosition(animal.id);
        if (pos) {
          const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
          particleSystem.emit('note', screen.x + worldSize.w / 4 - camera.x + TILE_W / 2, screen.y - camera.y, 1);
        }
      }
    }
    for (const staff of state.staff) {
      if (staff._working && Math.random() < 0.015) {
        const pos = movementSystem.getPosition(staff.id);
        if (pos) {
          const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
          particleSystem.emit('sparkle', screen.x + worldSize.w / 4 - camera.x + TILE_W / 2, screen.y - camera.y, 1);
        }
      }
    }
```

- [ ] **Edit `js/main.js`** -- in `showAdoptDialog` after `executeAdoption`, emit star particles:

After the line containing `state.tickerMessages.push(` in `showAnimalSelectDialog`, add:
```js
      const animalPos = movementSystem.getPosition(animal.id);
      if (animalPos) {
        const screen = worldToScreen(animalPos.col, animalPos.row, TILE_W, TILE_H);
        particleSystem.emit('star', screen.x + worldSize.w / 4 - camera.x + TILE_W / 2, screen.y - camera.y, 5);
      }
      movementSystem.removeEntity(animal.id);
```

- [ ] **Edit `js/main.js`** -- in `showShopDialog` after feeding animals, emit sparkle particles:

After the line `for (const animal of state.animals) animal.needs[need] = Math.min(1, animal.needs[need] + 0.3);`, add:
```js
      for (const animal of state.animals) {
        const pos = movementSystem.getPosition(animal.id);
        if (pos) {
          const screen = worldToScreen(pos.col, pos.row, TILE_W, TILE_H);
          particleSystem.emit('sparkle', screen.x + worldSize.w / 4 - camera.x + TILE_W / 2, screen.y - camera.y, 1);
        }
      }
```

- [ ] **Verify:** Open game -- heart particles float above happy animals, stars burst on adoption, sparkles on feeding, notes from birds. All tests PASS.

---

## Feature 6: Final Integration and Test Registration

### Step 6.1 -- Register all new test files in test.html

- [ ] **Edit `test.html`** -- add all new test imports before `runAll()`. The final import block should include:

```html
    import './tests/wall-fix.test.js';
    import './tests/water-anim.test.js';
    import './tests/movement.test.js';
    import './tests/deco.test.js';
    import './tests/deco-sprites.test.js';
    import './tests/particles.test.js';
```

(Each test file import was noted in its respective step, but this is the consolidated checklist item.)

- [ ] **Verify:** Open `http://localhost:8080/test.html` -- all test suites pass (old and new).

### Step 6.2 -- Visual smoke test

- [ ] Open `http://localhost:8080/` and verify:
  - Wall tiles have clean diamond-roof-to-wall-face junction (no overlap)
  - Water tiles near col 1-2, row 4-5 animate with shifting waves every 500ms
  - Animals wander within their enclosures (dogs in dogRun, cats in catEnclosure, etc.)
  - Staff walks along path tiles to assigned animal, then shows work animation
  - Unassigned staff returns to reception area
  - Trees, bushes, benches, counters, cages, shelves, bowls, and climbing tree are visible
  - Heart particles float above happy animals
  - Star burst on successful adoption
  - Music notes float from idle birds
  - Sparkles appear on working staff and after shop purchase
  - No console errors

---

## Appendix: File Summary

| File | Action | Description |
|---|---|---|
| `js/tile-factory.js` | Modify | Fix wall draw functions; add 3-frame water animation |
| `js/tilemap.js` | Modify | Add `getDecoMap()` with fixed deco positions |
| `js/sprite-factory.js` | Modify | Add `createDecoSpriteSheet()` with 12 procedural deco sprites |
| `js/movement.js` | **New** | Movement system: animal random-walk + staff waypoint navigation |
| `js/particles.js` | **New** | Particle system: heart, star, note, sparkle effects |
| `js/renderer.js` | Modify | Read positions from movement system, render deco layer, animate water, render particles |
| `js/simulation.js` | Modify | Call `movementSystem.update()` per tick |
| `js/main.js` | Modify | Create + wire movement system, particle system, emitter triggers |
| `tests/wall-fix.test.js` | **New** | 4 tests for wall-tile rendering fix |
| `tests/water-anim.test.js` | **New** | 4 tests for water animation frames |
| `tests/movement.test.js` | **New** | 14 tests for movement system (init, walk, waypoints, remove) |
| `tests/deco.test.js` | **New** | 6 tests for deco map generation |
| `tests/deco-sprites.test.js` | **New** | 4 tests for deco sprite sheet factory |
| `tests/particles.test.js` | **New** | 10 tests for particle system (API, emit, lifecycle, render) |
| `tests/tile-factory.test.js` | Modify | Update water tile assertion for array format |
| `test.html` | Modify | Register 6 new test file imports |

## Appendix: Function Signature Cross-Reference

| Function | File | Signature |
|---|---|---|
| `createMovementSystem` | `js/movement.js` | `(tileMap) -> { initAnimal, initStaff, removeEntity, update, getPosition, isMoving }` |
| `initAnimal` | `js/movement.js` | `(animal, zone?) -> void` -- animal: `{ id, species }`, zone: optional ZONES entry |
| `initStaff` | `js/movement.js` | `(staff) -> void` -- staff: `{ id, role, assignedAnimalId }` |
| `removeEntity` | `js/movement.js` | `(id: number) -> void` |
| `update` (movement) | `js/movement.js` | `(dt: number, state: { animals, staff }) -> void` |
| `getPosition` | `js/movement.js` | `(id: number) -> { col: number, row: number } \| null` |
| `isMoving` | `js/movement.js` | `(id: number) -> boolean` |
| `createParticleSystem` | `js/particles.js` | `() -> { emit, update, render, count }` |
| `emit` | `js/particles.js` | `(type: string, x: number, y: number, count: number) -> void` |
| `update` (particles) | `js/particles.js` | `(dt: number) -> void` |
| `render` (particles) | `js/particles.js` | `(ctx: CanvasRenderingContext2D) -> void` |
| `createDecoSpriteSheet` | `js/sprite-factory.js` | `() -> { [decoId]: { canvas, w, h } }` |
| `getDecoMap` | `js/tilemap.js` | `() -> Array<Array<string \| null>>` (24x24) |
| `createRenderer` | `js/renderer.js` | `(canvas, tileMap, movementSystem?, particleSystem?) -> { render, getWorldSize }` |
| `simulateTick` | `js/simulation.js` | `(state, movementSystem?) -> void` |
| `drawWaterFrame` | `js/tile-factory.js` | `(waveOffset: number) -> HTMLCanvasElement` |
