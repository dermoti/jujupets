import { describe, it, expect } from '../js/test-runner.js';
import { simulateTick, simulateDay } from '../js/simulation.js';
import { createNewState } from '../js/state.js';
import { createAnimal } from '../js/animals.js';
import { createStaff, assignStaff } from '../js/staff.js';

describe('simulateTick', () => {
  it('advances time by one tick', () => {
    const state = createNewState();
    const tickBefore = state.time.tick;
    simulateTick(state);
    expect(state.time.tick).toBe(tickBefore + 1);
  });

  it('updates animal needs each tick', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 0.8;
    state.animals.push(animal);
    simulateTick(state);
    expect(state.animals[0].needs.food).toBeLessThan(0.8);
  });

  it('regenerates staff energy each tick', () => {
    const state = createNewState();
    const staff = createStaff('caretaker', state.nextId++);
    staff.energy = 50;
    state.staff.push(staff);
    simulateTick(state);
    expect(state.staff[0].energy).toBeGreaterThan(50);
  });
});

describe('simulateDay', () => {
  it('deducts daily food costs per animal', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    const moneyBefore = state.money;
    simulateDay(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });

  it('deducts staff salaries daily (fraction of weekly)', () => {
    const state = createNewState();
    const staff = createStaff('caretaker', state.nextId++);
    state.staff.push(staff);
    const moneyBefore = state.money;
    simulateDay(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });
});
