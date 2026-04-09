import { describe, it, expect } from '../js/test-runner.js';
import { createAnimal, tickAnimal } from '../js/animals.js';
import { BALANCING } from '../js/data.js';

describe('createAnimal', () => {
  it('creates a dog with all required fields', () => {
    const animal = createAnimal('dog', 1);
    expect(animal.species).toBe('dog');
    expect(animal.id).toBe(1);
    expect(typeof animal.name).toBe('string');
    expect(typeof animal.stats.health).toBe('number');
    expect(typeof animal.stats.happiness).toBe('number');
    expect(typeof animal.stats.training).toBe('number');
    expect(typeof animal.stats.social).toBe('number');
  });

  it('has needs between 0 and 1', () => {
    const animal = createAnimal('cat', 2);
    expect(animal.needs.food >= 0 && animal.needs.food <= 1).toBeTruthy();
    expect(animal.needs.medicine >= 0 && animal.needs.medicine <= 1).toBeTruthy();
    expect(animal.needs.exercise >= 0 && animal.needs.exercise <= 1).toBeTruthy();
    expect(animal.needs.attention >= 0 && animal.needs.attention <= 1).toBeTruthy();
  });

  it('has personality values between 0 and 1', () => {
    const animal = createAnimal('dog', 3);
    expect(typeof animal.personality.energy).toBe('number');
    expect(typeof animal.personality.confidence).toBe('number');
    expect(typeof animal.personality.playfulness).toBe('number');
    expect(typeof animal.personality.obedience).toBe('number');
    expect(animal.personality.energy >= 0 && animal.personality.energy <= 1).toBeTruthy();
  });
});

describe('tickAnimal', () => {
  it('decreases needs over time', () => {
    const animal = createAnimal('dog', 4);
    animal.needs.food = 0.8;
    const before = animal.needs.food;
    tickAnimal(animal);
    expect(animal.needs.food).toBeLessThan(before);
  });

  it('decreases happiness when needs are low', () => {
    const animal = createAnimal('dog', 5);
    animal.needs.food = 0.0;
    animal.needs.medicine = 0.0;
    animal.needs.exercise = 0.0;
    animal.needs.attention = 0.0;
    animal.stats.happiness = 0.5;
    tickAnimal(animal);
    expect(animal.stats.happiness).toBeLessThan(0.5);
  });

  it('clamps needs to 0 minimum', () => {
    const animal = createAnimal('dog', 6);
    animal.needs.food = 0.001;
    for (let i = 0; i < 100; i++) tickAnimal(animal);
    expect(animal.needs.food >= 0).toBeTruthy();
  });
});
