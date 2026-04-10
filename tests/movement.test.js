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

describe('initAnimal', () => {
  it('places animal within dogRun zone interior', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    const pos = ms.getPosition(0);
    expect(pos.col).toBeGreaterThan(ZONES.dogRun.minCol);
    expect(pos.col).toBeLessThan(ZONES.dogRun.maxCol);
    expect(pos.row).toBeGreaterThan(ZONES.dogRun.minRow);
    expect(pos.row).toBeLessThan(ZONES.dogRun.maxRow);
  });

  it('places cat within catEnclosure zone interior', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 1, species: 'cat' });
    const pos = ms.getPosition(1);
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

describe('initStaff', () => {
  it('places staff in reception area', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initStaff({ id: 10, role: 'caretaker', assignedAnimalId: null });
    const pos = ms.getPosition(10);
    expect(pos.row).toBe(17);
    expect(pos.col >= 5 && pos.col <= 8).toBe(true);
  });

  it('isMoving returns false for idle staff', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initStaff({ id: 10, role: 'caretaker', assignedAnimalId: null });
    expect(ms.isMoving(10)).toBe(false);
  });
});

describe('Animal random walk', () => {
  it('animal starts not moving (in pause phase)', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    expect(ms.isMoving(0)).toBe(false);
  });

  it('after pause expires, animal picks a target and starts moving', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    ms.update(5000, { animals: [{ id: 0, species: 'dog' }], staff: [] });
    expect(ms.isMoving(0)).toBe(true);
  });

  it('animal stays within zone during movement', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    for (let i = 0; i < 100; i++) ms.update(200, { animals: [animal], staff: [] });
    const pos = ms.getPosition(0);
    expect(pos.col).toBeGreaterThan(ZONES.dogRun.minCol);
    expect(pos.col).toBeLessThan(ZONES.dogRun.maxCol);
    expect(pos.row).toBeGreaterThan(ZONES.dogRun.minRow);
    expect(pos.row).toBeLessThan(ZONES.dogRun.maxRow);
  });
});

describe('Staff waypoint navigation', () => {
  it('staff moves toward assigned animal when update is called', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    const staff = { id: 10, role: 'caretaker', assignedAnimalId: 0 };
    ms.initAnimal(animal);
    ms.initStaff(staff);
    const startPos = ms.getPosition(10);
    for (let i = 0; i < 50; i++) ms.update(200, { animals: [animal], staff: [staff] });
    const endPos = ms.getPosition(10);
    const animalPos = ms.getPosition(0);
    const startDist = Math.abs(startPos.col - animalPos.col) + Math.abs(startPos.row - animalPos.row);
    const endDist = Math.abs(endPos.col - animalPos.col) + Math.abs(endPos.row - animalPos.row);
    expect(endDist).toBeLessThan(startDist);
  });

  it('staff returns to reception when unassigned', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initStaff({ id: 10, role: 'caretaker', assignedAnimalId: null });
    for (let i = 0; i < 10; i++) ms.update(200, { animals: [], staff: [{ id: 10, assignedAnimalId: null }] });
    const endPos = ms.getPosition(10);
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
    ms.update(200, { animals: [animal], staff: [staff] });
    expect(ms.isMoving(10)).toBe(true);
  });
});

describe('removeEntity', () => {
  it('removes entity so getPosition returns null', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 5, species: 'rabbit' });
    expect(ms.getPosition(5)).toBeTruthy();
    ms.removeEntity(5);
    expect(ms.getPosition(5)).toBe(null);
  });

  it('isMoving returns false for removed entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 5, species: 'rabbit' });
    ms.removeEntity(5);
    expect(ms.isMoving(5)).toBe(false);
  });
});

describe('Entity direction tracking', () => {
  it('getDirection returns 0 for idle entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    ms.initAnimal({ id: 0, species: 'dog' });
    expect(ms.getDirection(0)).toBe(0);
  });

  it('getDirection returns 0-3 for moving entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    const animal = { id: 0, species: 'dog' };
    ms.initAnimal(animal);
    ms.update(5000, { animals: [animal], staff: [] });
    const dir = ms.getDirection(0);
    expect(dir >= 0 && dir <= 3).toBe(true);
  });

  it('getDirection returns null for unknown entity', () => {
    const tileMap = createTileMap();
    const ms = createMovementSystem(tileMap);
    expect(ms.getDirection(999)).toBe(null);
  });
});
