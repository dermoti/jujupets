import { toScreen, TILE_SIZE, MAP_COLS, MAP_ROWS } from './grid.js';
import { createTileCache } from './tile-factory.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet, createDecoSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';
import { createAnimState, animalAnimFromStats, staffAnimFromState } from './sprites.js';
import { ZONES } from './tilemap.js';

const SPECIES_ZONE_MAP = {
  dog: 'dogRun',
  cat: 'catEnclosure',
  rabbit: 'smallPetArea',
  smallpet: 'smallPetArea',
  bird: 'birdAviary',
};

export function createRenderer(canvas, tileMap, movementSystem, particleSystem) {
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

  const decoSheets = createDecoSpriteSheet();
  const decoMap = tileMap.getDecoMap();

  const animalAnims = new Map();
  const staffAnims = new Map();

  // Water animation timer
  let waterTime = 0;

  function getWorldSize() {
    return { w: MAP_COLS * TILE_SIZE, h: MAP_ROWS * TILE_SIZE };
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
    waterTime += dt;

    // 1. Fill background
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, 0, W, H);

    // 2. Draw tiles (with frustum culling)
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileType = tileMap.getTile(col, row);
        if (!tileType) continue;

        const sx = col * TILE_SIZE - camera.x;
        const sy = row * TILE_SIZE - camera.y;
        if (sx + TILE_SIZE < 0 || sx > W || sy + TILE_SIZE < 0 || sy > H) continue;

        let tileCanvas;
        if (tileType === 'water') {
          const waterFrame = Math.floor(waterTime / 500) % 3;
          tileCanvas = tileCache.water[waterFrame];
        } else if (tileType === 'grass') {
          const v = (col * 7 + row * 13) % 3;
          tileCanvas = v === 0 ? tileCache.grass : v === 1 ? tileCache.grass2 : tileCache.grass3;
        } else {
          tileCanvas = tileCache[tileType];
        }
        if (!tileCanvas) tileCanvas = tileCache.grass;

        ctx.drawImage(tileCanvas, sx, sy);
      }
    }

    // 3. Draw deco
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const decoId = decoMap[row][col];
        if (!decoId) continue;
        const sprite = decoSheets[decoId];
        if (!sprite) continue;

        const sx = col * TILE_SIZE - camera.x + TILE_SIZE / 2 - sprite.w / 2;
        const sy = row * TILE_SIZE - camera.y + TILE_SIZE / 2 - sprite.h / 2;
        if (sx + sprite.w < 0 || sx > W || sy + sprite.h < 0 || sy > H) continue;

        ctx.drawImage(sprite.canvas, sx, sy);
      }
    }

    // 4. Draw animals
    for (const animal of state.animals) {
      const pos = (movementSystem && movementSystem.getPosition(animal.id)) || getAnimalPosition(animal);
      const sx = pos.col * TILE_SIZE - camera.x + TILE_SIZE / 2 - ANIMAL_SPRITE.W / 2;
      const sy = pos.row * TILE_SIZE - camera.y + TILE_SIZE / 2 - ANIMAL_SPRITE.H / 2;
      if (sx + ANIMAL_SPRITE.W < 0 || sx > W || sy + ANIMAL_SPRITE.H < 0 || sy > H) continue;

      if (!animalAnims.has(animal.id)) animalAnims.set(animal.id, createAnimState(ANIMAL_SPRITE));
      const animState = animalAnims.get(animal.id);
      animState.setAnim(animalAnimFromStats(animal));
      const dir = (movementSystem && movementSystem.getDirection(animal.id)) || 0;
      animState.setDir(dir);
      animState.update(dt);
      const f = animState.getFrame();
      const sheet = animalSheets[animal.species] || animalSheets.dog;

      ctx.drawImage(sheet, f.sx, f.sy, f.sw, f.sh, sx, sy, ANIMAL_SPRITE.W, ANIMAL_SPRITE.H);
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(animal.name, sx + ANIMAL_SPRITE.W / 2, sy + ANIMAL_SPRITE.H + 7);
    }

    // 5. Draw staff
    for (const staff of state.staff) {
      const pos = (movementSystem && movementSystem.getPosition(staff.id)) || getStaffPosition(staff, state);
      const sx = pos.col * TILE_SIZE - camera.x + TILE_SIZE / 2 - STAFF_SPRITE.W / 2;
      const sy = pos.row * TILE_SIZE - camera.y + TILE_SIZE / 2 - STAFF_SPRITE.H / 2;
      if (sx + STAFF_SPRITE.W < 0 || sx > W || sy + STAFF_SPRITE.H < 0 || sy > H) continue;

      if (!staffAnims.has(staff.id)) staffAnims.set(staff.id, createAnimState(STAFF_SPRITE));
      const animState = staffAnims.get(staff.id);
      animState.setAnim(staffAnimFromState(staff));
      const dir = (movementSystem && movementSystem.getDirection(staff.id)) || 0;
      animState.setDir(dir);
      animState.update(dt);
      const f = animState.getFrame();
      const sheet = staffSheets[staff.role] || staffSheets.caretaker;

      ctx.drawImage(sheet, f.sx, f.sy, f.sw, f.sh, sx, sy, STAFF_SPRITE.W, STAFF_SPRITE.H);
    }

    // 6. Draw particles
    if (particleSystem) {
      particleSystem.update(dt);
      particleSystem.render(ctx);
    }
  }

  return { render, getWorldSize };
}
