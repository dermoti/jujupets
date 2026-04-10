const PARTICLE_TYPES = {
  heart:   { color: '#E91E63', size: 5, maxLife: 2000, vy: -15, vxRange: 3, swing: true },
  star:    { color: '#F9A825', size: 7, maxLife: 1500, vy: -40, vxRange: 20, swing: false },
  note:    { color: '#7E57C2', size: 5, maxLife: 2500, vy: -12, vxRange: 8, swing: true },
  sparkle: { color: '#FFFFFF', size: 3, maxLife: 800,  vy: -30, vxRange: 5, swing: false },
};

const MAX_PARTICLES = 50;

export function createParticleSystem() {
  const particles = [];

  function emit(type, x, y, count) {
    const config = PARTICLE_TYPES[type];
    if (!config) return;
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) {
        particles.shift(); // remove oldest
      }
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * config.vxRange,
        vy: config.vy + (Math.random() - 0.5) * 10,
        life: config.maxLife,
        maxLife: config.maxLife,
        type,
        size: config.size,
        color: config.color,
        swing: config.swing,
      });
    }
  }

  function update(dt) {
    const dtSec = dt / 1000;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      if (p.swing) {
        p.x += Math.sin(p.life * 0.005) * 0.5;
      }
    }
  }

  const UNICODE_MAP = {
    heart:   { char: '\u2665', color: '#E91E63' },
    star:    { char: '\u2605', color: '#F9A825' },
    note:    { char: '\u266A', color: '#7E57C2' },
    sparkle: { char: '\u2726', color: '#FFFFFF' },
  };

  function render(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const cfg = UNICODE_MAP[p.type];
      if (!cfg) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = cfg.color;
      ctx.font = `${p.size * 2}px sans-serif`;
      ctx.fillText(cfg.char, p.x, p.y);
    }
    ctx.restore();
  }

  return {
    emit,
    update,
    render,
    get count() { return particles.length; },
  };
}
