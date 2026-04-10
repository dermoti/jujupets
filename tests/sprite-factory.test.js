import { describe, it, expect } from '../js/test-runner.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet } from '../js/sprite-factory.js';

describe('createAnimalSpriteSheet', () => {
  it('returns a canvas for dog', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('has correct width for 4 frames', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.width).toBe(32 * 4);
  });

  it('has correct height for 4 animation rows', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.height).toBe(32 * 4);
  });

  it('creates sheets for all 5 species', () => {
    for (const species of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
      const sheet = createAnimalSpriteSheet(species);
      expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
    }
  });
});

describe('createStaffSpriteSheet', () => {
  it('returns a canvas for caretaker', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('has correct width for 6 frames', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.width).toBe(32 * 6);
  });

  it('has correct height for 3 animation rows', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.height).toBe(48 * 3);
  });
});
