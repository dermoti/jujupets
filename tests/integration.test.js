import { describe, it, expect } from '../js/test-runner.js';
import { createNewState } from '../js/state.js';
import { createAnimal } from '../js/animals.js';
import { createStaff, assignStaff } from '../js/staff.js';
import { simulateTick } from '../js/simulation.js';
import { createOwner, calculateMatchScore, executeAdoption } from '../js/matching.js';

describe('Integration: full game loop', () => {
  it('animal needs decrease over multiple ticks', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 1.0;
    state.animals.push(animal);
    for (let i = 0; i < 10; i++) simulateTick(state);
    expect(state.animals[0].needs.food).toBeLessThan(1.0);
  });

  it('assigned caretaker restores animal needs', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 0.2;
    state.animals.push(animal);
    const staff = createStaff('caretaker', state.nextId++);
    assignStaff(staff, animal.id);
    state.staff.push(staff);
    for (let i = 0; i < 5; i++) simulateTick(state);
    expect(state.animals[0].needs.food).toBeGreaterThan(0.2);
  });

  it('adoption removes animal and adds money', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.stats = { health: 1, happiness: 1, training: 1, social: 1 };
    state.animals.push(animal);
    const owner = createOwner(state.nextId++);
    owner.preferences = { ...animal.personality };
    state.owners.push(owner);
    const score = calculateMatchScore(animal, owner, 0);
    const moneyBefore = state.money;
    executeAdoption(state, animal, owner, score);
    expect(state.animals.length).toBe(0);
    expect(state.money).toBeGreaterThan(moneyBefore);
  });

  it('time advances correctly over many ticks', () => {
    const state = createNewState();
    const ticksPerMonth = 24 * 7 * 4;
    for (let i = 0; i < ticksPerMonth; i++) simulateTick(state);
    expect(state.time.month).toBeGreaterThan(1);
  });

  it('money decreases from food costs with animals', () => {
    const state = createNewState();
    state.animals.push(createAnimal('dog', state.nextId++));
    const moneyBefore = state.money;
    for (let i = 0; i < 24; i++) simulateTick(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });
});
