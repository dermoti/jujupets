import { describe, it, expect } from '../js/test-runner.js';
import { createNewState, saveState, loadState, clearSave } from '../js/state.js';
import { BALANCING } from '../js/data.js';

describe('createNewState', () => {
  it('creates state with starting money', () => {
    const state = createNewState();
    expect(state.money).toBe(BALANCING.startingMoney);
  });

  it('creates state with starting reputation', () => {
    const state = createNewState();
    expect(state.reputation).toBe(BALANCING.startingReputation);
  });

  it('starts at year 1, month 1, week 1, day 1', () => {
    const state = createNewState();
    expect(state.time.year).toBe(1);
    expect(state.time.month).toBe(1);
    expect(state.time.week).toBe(1);
    expect(state.time.day).toBe(1);
  });

  it('starts with empty animals and staff arrays', () => {
    const state = createNewState();
    expect(state.animals.length).toBe(0);
    expect(state.staff.length).toBe(0);
  });

  it('starts with dog and cat unlocked', () => {
    const state = createNewState();
    expect(state.unlockedSpecies).toContain('dog');
    expect(state.unlockedSpecies).toContain('cat');
  });
});

describe('saveState / loadState', () => {
  it('round-trips state through localStorage', () => {
    clearSave();
    const state = createNewState();
    state.money = 9999;
    saveState(state);
    const loaded = loadState();
    expect(loaded.money).toBe(9999);
    clearSave();
  });

  it('returns null when no save exists', () => {
    clearSave();
    const loaded = loadState();
    expect(loaded).toBe(null);
  });
});
