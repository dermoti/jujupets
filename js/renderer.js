import { SPECIES } from './data.js';

const SPECIES_COLORS = {
  dog: '#c8a070', cat: '#a0a0a0', rabbit: '#e0c8a0', smallpet: '#d0b080', bird: '#70b0d0',
};
const STAFF_COLOR = '#5070c0';
const ENCLOSURE_BG = '#3a3a5a';
const ENCLOSURE_BORDER = '#555';
const FLOOR_COLOR = '#2a2a4a';
const COLS = 3;
const ROWS = 2;
const PADDING = 8;

export function calculateLayout(canvasW, canvasH, maxAnimals) {
  const encW = Math.floor((canvasW - PADDING * (COLS + 1)) / COLS);
  const encH = Math.floor((canvasH - 60 - PADDING * (ROWS + 1)) / ROWS);
  const count = Math.min(maxAnimals, COLS * ROWS);
  const enclosures = [];
  for (let i = 0; i < count; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    enclosures.push({
      x: PADDING + col * (encW + PADDING),
      y: PADDING + row * (encH + PADDING),
      w: encW, h: encH, col, row,
    });
  }
  return { enclosures, staffAreaY: PADDING + (encH + PADDING) * ROWS };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  function render(state) {
    const layout = calculateLayout(W, H, state.maxAnimals);
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < layout.enclosures.length; i++) {
      const { x, y, w, h } = layout.enclosures[i];
      ctx.fillStyle = ENCLOSURE_BG;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = ENCLOSURE_BORDER;
      ctx.strokeRect(x, y, w, h);

      const animal = state.animals[i];
      if (animal) {
        drawAnimal(ctx, animal, x, y, w, h);
      } else {
        ctx.fillStyle = '#555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Leer', x + w / 2, y + h / 2);
      }
    }

    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, layout.staffAreaY, W, H - layout.staffAreaY);
    ctx.strokeStyle = ENCLOSURE_BORDER;
    ctx.beginPath();
    ctx.moveTo(0, layout.staffAreaY);
    ctx.lineTo(W, layout.staffAreaY);
    ctx.stroke();
    drawStaff(ctx, state.staff, layout.staffAreaY);
  }

  function drawAnimal(ctx, animal, x, y, w, h) {
    const color = SPECIES_COLORS[animal.species] || '#888';
    const cx = x + w / 2;
    const cy = y + h / 2 - 8;
    const size = 20;
    ctx.fillStyle = color;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 5, cy - 3, 3, 3);
    ctx.fillRect(cx + 2, cy - 3, 3, 3);
    ctx.fillRect(cx - 1, cy + 2, 2, 2);
    ctx.fillStyle = '#eee';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(animal.name, cx, cy + size / 2 + 12);
    const barY = cy + size / 2 + 16;
    const barW = w - 16;
    const barH = 4;
    const barX = x + 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = animal.stats.health > 0.5 ? '#4ade80' : animal.stats.health > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barW * animal.stats.health, barH);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + 6, barW, barH);
    ctx.fillStyle = animal.stats.happiness > 0.5 ? '#60a5fa' : '#f97316';
    ctx.fillRect(barX, barY + 6, barW * animal.stats.happiness, barH);
    ctx.fillStyle = '#888';
    ctx.font = '8px monospace';
    ctx.fillText(SPECIES[animal.species].name, cx, y + 12);
  }

  function drawStaff(ctx, staffList, startY) {
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PERSONAL:', 8, startY + 14);
    for (let i = 0; i < staffList.length; i++) {
      const staff = staffList[i];
      const sx = 8 + i * 120;
      const sy = startY + 24;
      ctx.fillStyle = STAFF_COLOR;
      ctx.fillRect(sx, sy, 10, 12);
      ctx.fillRect(sx + 2, sy - 6, 6, 6);
      ctx.fillStyle = '#eee';
      ctx.font = '8px monospace';
      ctx.fillText(`${staff.name} Lv.${staff.level}`, sx + 14, sy + 4);
      const energyPct = staff.energy / 100;
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + 14, sy + 8, 60, 3);
      ctx.fillStyle = energyPct > 0.5 ? '#4ade80' : '#fbbf24';
      ctx.fillRect(sx + 14, sy + 8, 60 * energyPct, 3);
    }
  }

  return { render };
}
