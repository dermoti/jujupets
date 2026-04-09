import { describe, it, expect } from '../js/test-runner.js';
import { createOwner, calculateMatchScore, executeAdoption } from '../js/matching.js';
import { createAnimal } from '../js/animals.js';
import { createNewState } from '../js/state.js';
import { BALANCING } from '../js/data.js';

describe('createOwner', () => {
  it('creates an owner with personality preferences', () => {
    const owner = createOwner(1);
    expect(typeof owner.preferences.energy).toBe('number');
    expect(typeof owner.preferences.confidence).toBe('number');
    expect(typeof owner.preferences.playfulness).toBe('number');
    expect(typeof owner.preferences.obedience).toBe('number');
  });

  it('has a profile with housing, experience, household', () => {
    const owner = createOwner(2);
    expect(typeof owner.profile.housing).toBe('string');
    expect(typeof owner.profile.experience).toBe('string');
    expect(typeof owner.profile.household).toBe('string');
  });

  it('has a patience value in days', () => {
    const owner = createOwner(3);
    expect(owner.patienceDays).toBeGreaterThan(0);
  });
});

describe('calculateMatchScore', () => {
  it('returns a score between 0 and 100', () => {
    const animal = createAnimal('dog', 1);
    const owner = createOwner(1);
    const score = calculateMatchScore(animal, owner, 0);
    expect(score >= 0).toBeTruthy();
    expect(score <= 100).toBeTruthy();
  });

  it('higher score when personality matches', () => {
    const animal = createAnimal('dog', 1);
    animal.personality = { energy: 0.8, confidence: 0.7, playfulness: 0.9, obedience: 0.6 };
    const matchingOwner = createOwner(1);
    matchingOwner.preferences = { energy: 0.8, confidence: 0.7, playfulness: 0.9, obedience: 0.6 };
    const mismatchOwner = createOwner(2);
    mismatchOwner.preferences = { energy: 0.1, confidence: 0.2, playfulness: 0.1, obedience: 0.9 };

    const goodScore = calculateMatchScore(animal, matchingOwner, 0);
    const badScore = calculateMatchScore(animal, mismatchOwner, 0);
    expect(goodScore).toBeGreaterThan(badScore);
  });

  it('trained animals score higher', () => {
    const trained = createAnimal('dog', 1);
    trained.stats.training = 1.0;
    trained.stats.health = 1.0;
    trained.stats.happiness = 1.0;
    const untrained = createAnimal('dog', 2);
    untrained.stats.training = 0.0;
    untrained.stats.health = 1.0;
    untrained.stats.happiness = 1.0;
    untrained.personality = { ...trained.personality };

    const owner = createOwner(1);
    owner.preferences = { ...trained.personality };
    const scoreTrained = calculateMatchScore(trained, owner, 0);
    const scoreUntrained = calculateMatchScore(untrained, owner, 0);
    expect(scoreTrained).toBeGreaterThan(scoreUntrained);
  });
});

describe('executeAdoption', () => {
  it('removes animal from state and adds money for good match', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    animal.stats = { health: 1, happiness: 1, training: 1, social: 1 };
    const owner = createOwner(1);
    owner.preferences = { ...animal.personality };
    const moneyBefore = state.money;

    executeAdoption(state, animal, owner, 80);

    expect(state.animals.length).toBe(0);
    expect(state.money).toBeGreaterThan(moneyBefore);
    expect(state.totalAdoptions).toBe(1);
  });

  it('penalizes reputation for bad match', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    const owner = createOwner(1);
    const repBefore = state.reputation;

    executeAdoption(state, animal, owner, 40);

    expect(state.reputation).toBeLessThan(repBefore);
  });
});
