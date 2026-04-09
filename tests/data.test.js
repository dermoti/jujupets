import { describe, it, expect } from '../js/test-runner.js';
import { SPECIES, PERSONALITY_AXES, STAFF_ROLES, NEEDS, BALANCING } from '../js/data.js';

describe('SPECIES', () => {
  it('has 5 species', () => {
    expect(Object.keys(SPECIES).length).toBe(5);
  });

  it('dog and cat are unlocked at year 0', () => {
    expect(SPECIES.dog.unlockYear).toBe(0);
    expect(SPECIES.cat.unlockYear).toBe(0);
  });

  it('each species has name, unlockYear, and needWeights', () => {
    for (const [key, species] of Object.entries(SPECIES)) {
      expect(typeof species.name).toBe('string');
      expect(typeof species.unlockYear).toBe('number');
      expect(typeof species.needWeights).toBe('object');
      expect(typeof species.needWeights.food).toBe('number');
      expect(typeof species.needWeights.medicine).toBe('number');
      expect(typeof species.needWeights.exercise).toBe('number');
      expect(typeof species.needWeights.attention).toBe('number');
    }
  });
});

describe('PERSONALITY_AXES', () => {
  it('has 4 axes', () => {
    expect(PERSONALITY_AXES.length).toBe(4);
  });

  it('each axis has id, labelLow, labelHigh', () => {
    for (const axis of PERSONALITY_AXES) {
      expect(typeof axis.id).toBe('string');
      expect(typeof axis.labelLow).toBe('string');
      expect(typeof axis.labelHigh).toBe('string');
    }
  });
});

describe('STAFF_ROLES', () => {
  it('has 4 roles', () => {
    expect(Object.keys(STAFF_ROLES).length).toBe(4);
  });

  it('caretaker is unlocked at year 0', () => {
    expect(STAFF_ROLES.caretaker.unlockYear).toBe(0);
  });

  it('each role has name, unlockYear, salary, skills', () => {
    for (const [key, role] of Object.entries(STAFF_ROLES)) {
      expect(typeof role.name).toBe('string');
      expect(typeof role.unlockYear).toBe('number');
      expect(typeof role.salary).toBe('number');
      expect(Array.isArray(role.skills)).toBeTruthy();
    }
  });
});

describe('BALANCING', () => {
  it('has tick and adoption config', () => {
    expect(typeof BALANCING.ticksPerDay).toBe('number');
    expect(typeof BALANCING.daysPerWeek).toBe('number');
    expect(typeof BALANCING.weeksPerMonth).toBe('number');
    expect(typeof BALANCING.monthsPerYear).toBe('number');
    expect(typeof BALANCING.startingMoney).toBe('number');
    expect(typeof BALANCING.adoptionFeeBase).toBe('number');
  });
});
