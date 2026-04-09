import { describe, it, expect } from '../js/test-runner.js';
import { checkMilestones } from '../js/progression.js';
import { createNewState } from '../js/state.js';

describe('checkMilestones', () => {
  it('does not unlock anything in year 1', () => {
    const state = createNewState();
    state.time.year = 1;
    const unlocked = checkMilestones(state);
    expect(unlocked.length).toBe(0);
  });

  it('unlocks rabbit and vet at year 3', () => {
    const state = createNewState();
    state.time.year = 3;
    const unlocked = checkMilestones(state);
    const types = unlocked.map(u => u.id);
    expect(types).toContain('rabbit');
    expect(types).toContain('vet');
  });

  it('does not re-unlock already unlocked species', () => {
    const state = createNewState();
    state.time.year = 3;
    state.unlockedSpecies.push('rabbit');
    state.unlockedRoles.push('vet');
    const unlocked = checkMilestones(state);
    expect(unlocked.length).toBe(0);
  });

  it('unlocks expansion at year 9', () => {
    const state = createNewState();
    state.time.year = 9;
    state.unlockedSpecies = ['dog', 'cat', 'rabbit', 'smallpet'];
    state.unlockedRoles = ['caretaker', 'vet', 'trainer', 'matchmaker'];
    const unlocked = checkMilestones(state);
    const types = unlocked.map(u => u.id);
    expect(types).toContain('expansion1');
  });
});
