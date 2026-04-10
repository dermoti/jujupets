import { describe, it, expect } from '../js/test-runner.js';
import { createCamera } from '../js/camera.js';

describe('createCamera', () => {
  it('starts at position (0, 0)', () => {
    const cam = createCamera(640, 480, 1536, 768);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('moves by delta', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(100, 50);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(50);
  });

  it('clamps to world bounds (no negative)', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(-100, -50);
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('clamps to max bounds', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.move(9999, 9999);
    expect(cam.x).toBe(1536 - 640);
    expect(cam.y).toBe(768 - 480);
  });

  it('centerOn sets camera to center a world point', () => {
    const cam = createCamera(640, 480, 1536, 768);
    cam.centerOn(400, 300);
    expect(cam.x).toBe(400 - 320);
    expect(cam.y).toBe(300 - 240);
  });
});
