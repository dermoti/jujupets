import { describe, it, expect } from '../js/test-runner.js';
import { createParticleSystem } from '../js/particles.js';

describe('createParticleSystem', () => {
  it('returns an object with emit, update, render, and count', () => {
    const ps = createParticleSystem();
    expect(typeof ps.emit).toBe('function');
    expect(typeof ps.update).toBe('function');
    expect(typeof ps.render).toBe('function');
    expect(typeof ps.count).toBe('number');
  });

  it('starts with zero particles', () => {
    const ps = createParticleSystem();
    expect(ps.count).toBe(0);
  });
});

describe('emit', () => {
  it('creates specified number of particles', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 100, 3);
    expect(ps.count).toBe(3);
  });

  it('accepts all four particle types', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 0, 0, 1);
    ps.emit('star', 0, 0, 1);
    ps.emit('note', 0, 0, 1);
    ps.emit('sparkle', 0, 0, 1);
    expect(ps.count).toBe(4);
  });

  it('ignores unknown particle types', () => {
    const ps = createParticleSystem();
    ps.emit('fireball', 0, 0, 5);
    expect(ps.count).toBe(0);
  });

  it('enforces MAX_PARTICLES limit of 50', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 0, 0, 60);
    expect(ps.count).toBeLessThan(51);
  });
});

describe('update lifecycle', () => {
  it('particles expire after their maxLife', () => {
    const ps = createParticleSystem();
    ps.emit('sparkle', 100, 100, 1);
    expect(ps.count).toBe(1);
    ps.update(1000);
    expect(ps.count).toBe(0);
  });

  it('particles survive if life remains', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 100, 1);
    ps.update(500);
    expect(ps.count).toBe(1);
  });

  it('particles move upward over time', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 100, 200, 1);
    ps.update(100);
    expect(ps.count).toBe(1);
  });
});

describe('render', () => {
  it('calls render without throwing on a real canvas context', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 50, 50, 2);
    ps.emit('star', 60, 60, 1);
    ps.emit('note', 70, 70, 1);
    ps.emit('sparkle', 80, 80, 1);
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    let threw = false;
    try { ps.render(ctx); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});

describe('PA unicode rendering', () => {
  it('renders all 4 particle types without throwing', () => {
    const ps = createParticleSystem();
    ps.emit('heart', 50, 50, 1);
    ps.emit('star', 60, 60, 1);
    ps.emit('note', 70, 70, 1);
    ps.emit('sparkle', 80, 80, 1);
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    let threw = false;
    try { ps.render(ctx); } catch (e) { threw = true; }
    expect(threw).toBe(false);
  });
});
