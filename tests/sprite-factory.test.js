import { describe, it, expect } from '../js/test-runner.js';
import { createAnimalSpriteSheet, createStaffSpriteSheet, ANIMAL_SPRITE, STAFF_SPRITE } from '../js/sprite-factory.js';

describe('createAnimalSpriteSheet (PA style)', () => {
  it('returns a canvas for dog', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('ANIMAL_SPRITE has 3 frames and 4 directions', () => {
    expect(ANIMAL_SPRITE.FRAMES).toBe(3);
    expect(ANIMAL_SPRITE.DIRS).toBe(4);
  });

  it('has correct width for 4 dirs x 3 frames = 12 columns', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.width).toBe(ANIMAL_SPRITE.W * ANIMAL_SPRITE.FRAMES * ANIMAL_SPRITE.DIRS);
  });

  it('has correct height for 4 animation rows', () => {
    const sheet = createAnimalSpriteSheet('dog');
    expect(sheet.height).toBe(ANIMAL_SPRITE.H * ANIMAL_SPRITE.ANIMS);
  });

  it('creates sheets for all 5 species', () => {
    for (const species of ['dog', 'cat', 'rabbit', 'smallpet', 'bird']) {
      const sheet = createAnimalSpriteSheet(species);
      expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
    }
  });

  it('dog sprite dimensions match spec (16x18)', () => {
    expect(ANIMAL_SPRITE.W).toBe(16);
    expect(ANIMAL_SPRITE.H).toBe(18);
  });
});

describe('createStaffSpriteSheet (PA style)', () => {
  it('returns a canvas for caretaker', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet instanceof HTMLCanvasElement).toBeTruthy();
  });

  it('STAFF_SPRITE has 3 frames and 4 directions', () => {
    expect(STAFF_SPRITE.FRAMES).toBe(3);
    expect(STAFF_SPRITE.DIRS).toBe(4);
  });

  it('has correct width for 4 dirs x 3 frames = 12 columns', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.width).toBe(STAFF_SPRITE.W * STAFF_SPRITE.FRAMES * STAFF_SPRITE.DIRS);
  });

  it('staff sprite dimensions match spec (14x22)', () => {
    expect(STAFF_SPRITE.W).toBe(14);
    expect(STAFF_SPRITE.H).toBe(22);
  });

  it('has correct height for 3 animation rows', () => {
    const sheet = createStaffSpriteSheet('caretaker');
    expect(sheet.height).toBe(STAFF_SPRITE.H * STAFF_SPRITE.ANIMS);
  });
});
