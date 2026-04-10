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
