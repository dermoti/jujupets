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
  const worldPixelW = rightMost.x - leftMost.x + TILE_W;
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

  // Cache sky gradient once
  const skyGradient = ctx.createLinearGradient(0, 0, 0, H);
  skyGradient.addColorStop(0, '#87CEEB');
  skyGradient.addColorStop(1, '#B3E5FC');

  // Water animation timer (accumulated from dt, pauseable)
  let waterTime = 0;

  function render(state, camera, dt) {
    waterTime += dt;
    ctx.fillStyle = skyGradient;
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
