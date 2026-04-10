import { describe, it, expect } from '../js/test-runner.js';
import { createDecoSpriteSheet } from '../js/sprite-factory.js';

describe('createDecoSpriteSheet (PA style)', () => {
  it('returns sprites for all 12 deco types', () => {
    const sheet = createDecoSpriteSheet();
    const types = ['tree_oak', 'tree_pine', 'bush', 'bench', 'flower_bed', 'cage', 'treatment_table', 'counter', 'shelf', 'food_bowl', 'water_bowl', 'climbing_tree'];
    for (const type of types) expect(sheet[type] !== undefined).toBe(true);
  });

  it('each sprite has canvas, w, h', () => {
    const sheet = createDecoSpriteSheet();
    for (const key of Object.keys(sheet)) {
      expect(sheet[key].canvas instanceof HTMLCanvasElement).toBe(true);
      expect(typeof sheet[key].w).toBe('number');
      expect(sheet[key].w).toBeGreaterThan(0);
    }
  });

  it('tree sprites fit within 32x48 (PA smaller scale)', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.tree_oak.w <= 32).toBe(true);
    expect(sheet.tree_oak.h <= 48).toBe(true);
  });

  it('bowl sprites are small', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.food_bowl.w <= 16).toBe(true);
    expect(sheet.food_bowl.h <= 16).toBe(true);
  });

  it('cached -- calling twice returns same reference', () => {
    const s1 = createDecoSpriteSheet();
    const s2 = createDecoSpriteSheet();
    expect(s1 === s2).toBe(true);
  });
});
