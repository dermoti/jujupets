import { describe, it, expect } from '../js/test-runner.js';
import { checkPlannedEvents, rollRandomEvent, applyEvent } from '../js/events.js';
import { createAnimal } from '../js/animals.js';
import { createNewState } from '../js/state.js';

describe('checkPlannedEvents', () => {
  it('fires adoption fest on first day of each month', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const fest = events.find(e => e.type === 'adoptionFest');
    expect(fest !== undefined).toBeTruthy();
  });

  it('fires inspection every 3 months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 3, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection !== undefined).toBeTruthy();
  });

  it('does not fire inspection on non-quarter months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection === undefined).toBeTruthy();
  });
});

describe('applyEvent', () => {
  it('stray animal adds an animal to state', () => {
    const state = createNewState();
    const before = state.animals.length;
    applyEvent(state, { type: 'strayAnimal' });
    expect(state.animals.length).toBe(before + 1);
  });

  it('donation adds money', () => {
    const state = createNewState();
    const before = state.money;
    applyEvent(state, { type: 'donation' });
    expect(state.money).toBeGreaterThan(before);
  });

  it('disease reduces health of animals', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.stats.health = 1.0;
    state.animals.push(animal);
    applyEvent(state, { type: 'disease' });
    expect(state.animals[0].stats.health).toBeLessThan(1.0);
  });
});
