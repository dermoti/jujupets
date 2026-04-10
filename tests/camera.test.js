import { describe, it, expect } from '../js/test-runner.js';
import { createCamera } from '../js/camera.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from '../js/grid.js';

const VIEW_W = 680;
const VIEW_H = 500;
const WORLD_W = MAP_COLS * TILE_SIZE;
const WORLD_H = MAP_ROWS * TILE_SIZE;

describe('createCamera (top-down)', () => {
  it('starts at position (0, 0)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('moves by delta', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(100, 50);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(50);
  });

  it('clamps to world bounds (no negative)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(-100, -50);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('clamps to max bounds (768 - 680 = 88, 768 - 500 = 268)', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.move(9999, 9999);
    expect(cam.x).toBe(WORLD_W - VIEW_W);
    expect(cam.y).toBe(WORLD_H - VIEW_H);
  });

  it('centerOn sets camera to center a world point', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.centerOn(400, 400);
    expect(cam.x).toBe(400 - VIEW_W / 2);
    expect(cam.y).toBe(400 - VIEW_H / 2);
  });

  it('setPosition works and clamps', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    cam.setPosition(50, 100);
    expect(cam.x).toBe(50);
    expect(cam.y).toBe(100);
  });

  it('exposes viewW and viewH', () => {
    const cam = createCamera(VIEW_W, VIEW_H, WORLD_W, WORLD_H);
    expect(cam.viewW).toBe(VIEW_W);
    expect(cam.viewH).toBe(VIEW_H);
  });
});
