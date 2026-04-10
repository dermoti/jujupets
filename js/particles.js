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

  function renderHeart(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#E91E63';
    const s = size / 2;
    ctx.beginPath();
    ctx.arc(x - s / 2, y - s / 2, s, 0, Math.PI * 2);
    ctx.arc(x + s / 2, y - s / 2, s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y + s * 1.5);
    ctx.lineTo(x + s, y);
    ctx.fill();
  }

  function renderStar(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#F9A825';
    ctx.fillRect(x - size / 2, y - 1, size, 2);
    ctx.fillRect(x - 1, y - size / 2, 2, size);
    ctx.fillRect(x - size / 3, y - size / 3, size * 0.66, size * 0.66);
  }

  function renderNote(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#7E57C2';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + size / 2 - 1, y - size, 2, size);
    ctx.fillRect(x + size / 2 - 1, y - size, 4, 2);
  }

  function renderSparkle(ctx, x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  const renderers = { heart: renderHeart, star: renderStar, note: renderNote, sparkle: renderSparkle };

  function render(ctx) {
    ctx.save();
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const fn = renderers[p.type];
      if (fn) fn(ctx, p.x, p.y, p.size, alpha);
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
