import { describe, it, expect } from '../js/test-runner.js';
import { calculateLayout } from '../js/renderer.js';

describe('calculateLayout', () => {
  it('returns correct number of enclosures for maxAnimals 6', () => {
    const layout = calculateLayout(480, 320, 6);
    expect(layout.enclosures.length).toBe(6);
  });

  it('arranges in 3 columns and 2 rows', () => {
    const layout = calculateLayout(480, 320, 6);
    expect(layout.enclosures[0].col).toBe(0);
    expect(layout.enclosures[1].col).toBe(1);
    expect(layout.enclosures[2].col).toBe(2);
    expect(layout.enclosures[3].col).toBe(0);
    expect(layout.enclosures[3].row).toBe(1);
  });

  it('enclosures have positive width and height', () => {
    const layout = calculateLayout(480, 320, 6);
    for (const enc of layout.enclosures) {
      expect(enc.w).toBeGreaterThan(0);
      expect(enc.h).toBeGreaterThan(0);
    }
  });

  it('enclosures do not exceed canvas bounds', () => {
    const layout = calculateLayout(480, 320, 6);
    for (const enc of layout.enclosures) {
      expect(enc.x + enc.w <= 480).toBeTruthy();
      expect(enc.y + enc.h <= 320).toBeTruthy();
    }
  });

  it('staff area starts below enclosures', () => {
    const layout = calculateLayout(480, 320, 6);
    const lastEncBottom = Math.max(...layout.enclosures.map(e => e.y + e.h));
    expect(layout.staffAreaY).toBeGreaterThan(lastEncBottom - 1);
  });

  it('caps at 6 enclosures even if maxAnimals is higher', () => {
    const layout = calculateLayout(480, 320, 10);
    expect(layout.enclosures.length).toBe(6);
  });
});
