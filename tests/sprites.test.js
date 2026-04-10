import { describe, it, expect } from '../js/test-runner.js';
import { createAnimState, animalAnimFromStats, staffAnimFromState } from '../js/sprites.js';
import { ANIMAL_SPRITE, STAFF_SPRITE } from '../js/sprite-factory.js';

describe('createAnimState', () => {
  it('starts at animation 0, frame 0', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    expect(state.currentAnim).toBe(0);
    expect(state.currentFrame).toBe(0);
  });

  it('advances frame after enough dt', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.update(200); // 200ms = 1 frame
    expect(state.currentFrame).toBe(1);
  });

  it('wraps frame back to 0 after all frames', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    for (let i = 0; i < ANIMAL_SPRITE.FRAMES; i++) state.update(200);
    expect(state.currentFrame).toBe(0);
  });

  it('resets frame when changing animation', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.update(200);
    expect(state.currentFrame).toBe(1);
    state.setAnim(2);
    expect(state.currentFrame).toBe(0);
    expect(state.currentAnim).toBe(2);
  });

  it('getFrame returns correct source rect', () => {
    const state = createAnimState(ANIMAL_SPRITE);
    state.setAnim(1);
    state.update(200);
    const f = state.getFrame();
    expect(f.sx).toBe(ANIMAL_SPRITE.W); // frame 1
    expect(f.sy).toBe(ANIMAL_SPRITE.H); // anim 1
    expect(f.sw).toBe(ANIMAL_SPRITE.W);
    expect(f.sh).toBe(ANIMAL_SPRITE.H);
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

  it('eating takes priority over happy', () => {
    expect(animalAnimFromStats({ _eating: true, stats: { happiness: 0.9 } })).toBe(3);
  });
});

describe('staffAnimFromState', () => {
  it('returns 0 for idle (not assigned)', () => {
    expect(staffAnimFromState({ assignedAnimalId: null })).toBe(0);
  });

  it('returns 1 for walk (assigned)', () => {
    expect(staffAnimFromState({ assignedAnimalId: 5 })).toBe(1);
  });

  it('returns 2 for work', () => {
    expect(staffAnimFromState({ _working: true, assignedAnimalId: 5 })).toBe(2);
  });

  it('work takes priority over walk', () => {
    expect(staffAnimFromState({ _working: true, assignedAnimalId: 3 })).toBe(2);
  });
});
