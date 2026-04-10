import { TILE_SIZE } from './grid.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawRect(ctx, w, h, fillColor, strokeColor, strokeWidth) {
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, w, h);
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth || 1;
    ctx.strokeRect(0, 0, w, h);
  }
}

function drawGrass(variant) {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  const baseColors = ['#5a7a3a', '#527234', '#628240'];
  drawRect(ctx, TILE_SIZE, TILE_SIZE, baseColors[variant % 3]);
  // Subtle darker flecks
  ctx.fillStyle = '#4a6a2a';
  for (let i = 0; i < 4; i++) {
    const gx = 4 + Math.floor(Math.sin(i * 2.1 + variant) * 10);
    const gy = 4 + Math.floor(Math.cos(i * 1.7 + variant) * 10);
    ctx.fillRect(gx, gy, 2, 2);
  }
  return c;
}

function drawGrassFlower() {
  const c = drawGrass(1);
  const ctx = c.getContext('2d');
  const colors = ['#E91E63', '#FF9800', '#FFEB3B'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(8 + i * 8, 10 + (i % 2) * 6, 3, 3);
  }
  return c;
}

function drawPath() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#a09080');
  ctx.strokeStyle = '#908070';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  return c;
}

function drawFloor() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#c8b8a0');
  ctx.strokeStyle = '#b8a890';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  return c;
}

function drawWall() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#555555');
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
  return c;
}

function drawFence() {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#5a7a3a');
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
  ctx.setLineDash([]);
  return c;
}

function drawWaterFrame(waveOffset) {
  const c = makeCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = c.getContext('2d');
  drawRect(ctx, TILE_SIZE, TILE_SIZE, '#5C9CD6');
  ctx.strokeStyle = '#4A8AC4';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  // Wave highlight
  ctx.strokeStyle = '#8CBEE8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(TILE_SIZE / 2 + waveOffset, TILE_SIZE / 2 - 4, 6, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(TILE_SIZE / 2 - waveOffset * 0.7, TILE_SIZE / 2 + 4, 5, 0, Math.PI);
  ctx.stroke();
  return c;
}

export function createTileCache() {
  return {
    grass: drawGrass(0),
    grass2: drawGrass(1),
    grass3: drawGrass(2),
    grass_flower: drawGrassFlower(),
    path: drawPath(),
    floor: drawFloor(),
    wall: drawWall(),
    fence: drawFence(),
    water: [drawWaterFrame(-4), drawWaterFrame(0), drawWaterFrame(4)],
  };
}
