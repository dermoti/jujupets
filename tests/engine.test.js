import { describe, it, expect } from '../js/test-runner.js';
import { createEngine, computeTicks } from '../js/engine.js';

describe('computeTicks', () => {
  it('returns 0 ticks when dt is less than msPerTick', () => {
    const result = computeTicks(100, 1, 250, 0);
    expect(result.ticks).toBe(0);
    expect(result.accumulator).toBe(100);
  });

  it('returns 1 tick when dt equals msPerTick', () => {
    const result = computeTicks(250, 1, 250, 0);
    expect(result.ticks).toBe(1);
    expect(result.accumulator).toBe(0);
  });

  it('returns 2 ticks when dt is double msPerTick', () => {
    const result = computeTicks(500, 1, 250, 0);
    expect(result.ticks).toBe(2);
    expect(result.accumulator).toBe(0);
  });

  it('accumulates remainder across calls', () => {
    const r1 = computeTicks(100, 1, 250, 0);
    expect(r1.ticks).toBe(0);
    expect(r1.accumulator).toBe(100);
    const r2 = computeTicks(200, 1, 250, r1.accumulator);
    expect(r2.ticks).toBe(1);
    expect(r2.accumulator).toBe(50);
  });

  it('multiplies dt by speed', () => {
    const result = computeTicks(125, 2, 250, 0);
    expect(result.ticks).toBe(1);
    expect(result.accumulator).toBe(0);
  });

  it('returns 0 ticks at speed 0', () => {
    const result = computeTicks(1000, 0, 250, 0);
    expect(result.ticks).toBe(0);
    expect(result.accumulator).toBe(0);
  });

  it('speed 3 triples effective dt', () => {
    const result = computeTicks(250, 3, 250, 0);
    expect(result.ticks).toBe(3);
    expect(result.accumulator).toBe(0);
  });
});

describe('createEngine', () => {
  it('starts with running false', () => {
    const engine = createEngine();
    expect(engine.running).toBe(false);
  });

  it('defaults to speed 1', () => {
    const engine = createEngine();
    expect(engine.getSpeed()).toBe(1);
  });

  it('clamps speed to 0-3', () => {
    const engine = createEngine();
    engine.setSpeed(-1);
    expect(engine.getSpeed()).toBe(0);
    engine.setSpeed(5);
    expect(engine.getSpeed()).toBe(3);
    engine.setSpeed(2);
    expect(engine.getSpeed()).toBe(2);
  });

  it('sets running to true after start', () => {
    const engine = createEngine();
    engine.start();
    expect(engine.running).toBe(true);
    engine.stop();
  });

  it('sets running to false after stop', () => {
    const engine = createEngine();
    engine.start();
    engine.stop();
    expect(engine.running).toBe(false);
  });
});
