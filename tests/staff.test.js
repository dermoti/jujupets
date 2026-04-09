import { describe, it, expect } from '../js/test-runner.js';
import { createStaff, tickStaff, assignStaff, performWork } from '../js/staff.js';
import { createAnimal } from '../js/animals.js';
import { BALANCING } from '../js/data.js';

describe('createStaff', () => {
  it('creates a caretaker with correct role', () => {
    const staff = createStaff('caretaker', 1);
    expect(staff.role).toBe('caretaker');
    expect(staff.level).toBe(1);
    expect(staff.energy).toBe(BALANCING.maxEnergyBase);
  });

  it('has xp starting at 0', () => {
    const staff = createStaff('vet', 2);
    expect(staff.xp).toBe(0);
  });
});

describe('tickStaff', () => {
  it('regenerates energy over time', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = 50;
    tickStaff(staff);
    expect(staff.energy).toBeGreaterThan(50);
  });

  it('caps energy at max', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = BALANCING.maxEnergyBase;
    tickStaff(staff);
    expect(staff.energy).toBe(BALANCING.maxEnergyBase);
  });
});

describe('performWork', () => {
  it('drains energy when working', () => {
    const staff = createStaff('caretaker', 1);
    const animal = createAnimal('dog', 1);
    const before = staff.energy;
    performWork(staff, animal);
    expect(staff.energy).toBeLessThan(before);
  });

  it('does not work if energy too low', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = 0;
    const animal = createAnimal('dog', 1);
    animal.needs.food = 0.2;
    const before = animal.needs.food;
    const worked = performWork(staff, animal);
    expect(worked).toBeFalsy();
    expect(animal.needs.food).toBe(before);
  });

  it('gains xp when working', () => {
    const staff = createStaff('caretaker', 1);
    const animal = createAnimal('dog', 1);
    performWork(staff, animal);
    expect(staff.xp).toBeGreaterThan(0);
  });

  it('levels up when reaching xp threshold', () => {
    const staff = createStaff('caretaker', 1);
    staff.xp = BALANCING.xpPerLevel - 1;
    const animal = createAnimal('dog', 1);
    performWork(staff, animal);
    expect(staff.level).toBe(2);
  });
});
