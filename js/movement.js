import { ZONES } from './tilemap.js';
import { directionFromVelocity } from './sprites.js';

const SPECIES_ZONE_MAP = {
  dog: 'dogRun',
  cat: 'catEnclosure',
  rabbit: 'smallPetArea',
  smallpet: 'smallPetArea',
  bird: 'birdAviary',
};

export function createMovementSystem(tileMap) {
  const entities = new Map();
  const RECEPTION = { col: 6, row: 17 };

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
      direction: 0,
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
      _lastAssignment: staff.assignedAnimalId,
      direction: 0,
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

  function getDirection(id) {
    const ent = entities.get(id);
    if (!ent) return null;
    return ent.direction;
  }

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
    ent.direction = directionFromVelocity(dx, dy);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.05) {
      ent.worldPos.col = ent.targetTile.col;
      ent.worldPos.row = ent.targetTile.row;
      return true;
    }
    const step = Math.min(ent.speed * dtSec, dist);
    ent.worldPos.col += (dx / dist) * step;
    ent.worldPos.row += (dy / dist) * step;
    return false;
  }

  function findPathTileNeighbor(col, row) {
    const dirs = [{dc: 0, dr: -1}, {dc: 1, dr: 0}, {dc: 0, dr: 1}, {dc: -1, dr: 0}];
    for (const d of dirs) {
      const nc = Math.round(col) + d.dc;
      const nr = Math.round(row) + d.dr;
      if (tileMap.getTile(nc, nr) === 'path') return { col: nc, row: nr };
    }
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
    const startPath = findPathTileNeighbor(fromCol, fromRow);
    if (!startPath) return [{ col: toCol, row: toRow }];
    waypoints.push(startPath);

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
        if (dist < bestDist) { bestDist = dist; best = { col: nc, row: nr }; }
      }
      if (!best) break;
      waypoints.push(best);
      visited.add(`${best.col},${best.row}`);
      current = best;
      steps++;
      if (Math.abs(current.col - toCol) + Math.abs(current.row - toRow) <= 2) break;
    }

    waypoints.push({ col: toCol, row: toRow });
    return waypoints;
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

      if (ent.type === 'staff') {
        const staff = state.staff.find(s => s.id === id);
        if (!staff) continue;

        // Detect assignment changes
        if (ent._lastAssignment !== staff.assignedAnimalId) {
          ent._lastAssignment = staff.assignedAnimalId;
          ent.waypoints = [];
          ent.arrivedAtTarget = false;
          ent.moving = false;
          if (staff.assignedAnimalId === null) staff._working = false;
        }

        const animalId = staff.assignedAnimalId;
        if (animalId !== null) {
          const animalEnt = entities.get(animalId);
          if (animalEnt && ent.waypoints.length === 0 && !ent.arrivedAtTarget) {
            const destCol = Math.round(animalEnt.worldPos.col) + 1;
            const destRow = Math.round(animalEnt.worldPos.row);
            ent.waypoints = buildWaypoints(
              Math.round(ent.worldPos.col), Math.round(ent.worldPos.row),
              destCol, destRow
            );
          }
        } else if (!ent.arrivedAtTarget) {
          const dist = Math.abs(ent.worldPos.col - RECEPTION.col) + Math.abs(ent.worldPos.row - RECEPTION.row);
          if (dist > 0.5 && ent.waypoints.length === 0) {
            ent.waypoints = buildWaypoints(
              Math.round(ent.worldPos.col), Math.round(ent.worldPos.row),
              RECEPTION.col, RECEPTION.row
            );
          }
        }

        if (ent.waypoints.length > 0) {
          ent.moving = true;
          ent.targetTile = ent.waypoints[0];
          const arrived = moveToward(ent, dtSec);
          if (arrived) {
            ent.waypoints.shift();
            if (ent.waypoints.length === 0) {
              ent.moving = false;
              ent.arrivedAtTarget = true;
              if (staff.assignedAnimalId !== null) staff._working = true;
            }
          }
        }
      }
    }
  }

  return { initAnimal, initStaff, removeEntity, update, getPosition, isMoving, getDirection };
}
