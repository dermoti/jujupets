import { describe, it, expect } from '../js/test-runner.js';
import { worldToScreen, screenToWorld, depthKey } from '../js/iso.js';

const TILE_W = 64;
const TILE_H = 32;

describe('worldToScreen', () => {
  it('converts origin (0,0) to screen center offset', () => {
    const s = worldToScreen(0, 0, TILE_W, TILE_H);
    expect(s.x).toBe(0);
    expect(s.y).toBe(0);
  });

  it('moves right along col axis (down-right on screen)', () => {
    const s = worldToScreen(1, 0, TILE_W, TILE_H);
    expect(s.x).toBe(32);
    expect(s.y).toBe(16);
  });

  it('moves down along row axis (down-left on screen)', () => {
    const s = worldToScreen(0, 1, TILE_W, TILE_H);
    expect(s.x).toBe(-32);
    expect(s.y).toBe(16);
  });

  it('col=1,row=1 moves straight down', () => {
    const s = worldToScreen(1, 1, TILE_W, TILE_H);
    expect(s.x).toBe(0);
    expect(s.y).toBe(32);
  });
});

describe('screenToWorld', () => {
  it('inverts worldToScreen for (1,0)', () => {
    const w = screenToWorld(32, 16, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(1);
    expect(Math.round(w.row)).toBe(0);
  });

  it('inverts worldToScreen for (0,1)', () => {
    const w = screenToWorld(-32, 16, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(0);
    expect(Math.round(w.row)).toBe(1);
  });

  it('inverts worldToScreen for (3,5)', () => {
    const s = worldToScreen(3, 5, TILE_W, TILE_H);
    const w = screenToWorld(s.x, s.y, TILE_W, TILE_H);
    expect(Math.round(w.col)).toBe(3);
    expect(Math.round(w.row)).toBe(5);
  });
});

describe('depthKey', () => {
  it('returns higher values for tiles further down-screen', () => {
    expect(depthKey(0, 0, 0)).toBeLessThan(depthKey(1, 1, 0));
  });

  it('uses height as tiebreaker', () => {
    expect(depthKey(1, 1, 0)).toBeLessThan(depthKey(1, 1, 1));
  });

  it('row+col dominates over height', () => {
    expect(depthKey(2, 2, 0)).toBeGreaterThan(depthKey(1, 1, 10));
  });
});
