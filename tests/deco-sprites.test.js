import { describe, it, expect } from '../js/test-runner.js';
import { createDecoSpriteSheet } from '../js/sprite-factory.js';

describe('createDecoSpriteSheet', () => {
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
      expect(typeof sheet[key].h).toBe('number');
    }
  });

  it('tree sprites are taller than bowl sprites', () => {
    const sheet = createDecoSpriteSheet();
    expect(sheet.tree_oak.h).toBeGreaterThan(sheet.food_bowl.h);
  });

  it('cached — calling twice returns same reference', () => {
    const s1 = createDecoSpriteSheet();
    const s2 = createDecoSpriteSheet();
    expect(s1 === s2).toBe(true);
  });
});
