// Pure function — testable without rAF
export function computeTicks(dt, speed, msPerTick, accumulator) {
  if (speed === 0) {
    return { ticks: 0, accumulator: 0 };
  }
  accumulator += dt * speed;
  let ticks = 0;
  while (accumulator >= msPerTick) {
    accumulator -= msPerTick;
    ticks++;
  }
  return { ticks, accumulator };
}

export function createEngine() {
  let running = false;
  let speed = 1;
  let rafId = null;
  let lastTime = 0;
  let tickAccumulator = 0;
  let onTick = null;
  let onRender = null;
  let msPerTick = 250;

  function setMsPerTick(ms) {
    msPerTick = ms;
  }

  function setSpeed(s) {
    speed = Math.max(0, Math.min(3, s));
  }

  function getSpeed() {
    return speed;
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (speed > 0 && onTick) {
      const result = computeTicks(dt, speed, msPerTick, tickAccumulator);
      tickAccumulator = result.accumulator;
      if (result.ticks > 0) {
        onTick(result.ticks);
      }
    }

    if (onRender) {
      onRender(dt);
    }

    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    tickAccumulator = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    start,
    stop,
    setSpeed,
    getSpeed,
    setMsPerTick,
    set onTick(fn) { onTick = fn; },
    set onRender(fn) { onRender = fn; },
    get running() { return running; },
  };
}
