import { TILE_W, TILE_H } from './iso.js';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawDiamond(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(w / 2, h);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.fill();
}

function drawDiamondOutline(ctx, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(w / 2, h);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawGrass(variant) {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  const colors = ['#7CB342', '#689F38', '#8BC34A'];
  drawDiamond(ctx, TILE_W, TILE_H, colors[variant % 3]);
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#558B2F');
  ctx.fillStyle = '#9CCC65';
  for (let i = 0; i < 5; i++) {
    const gx = 16 + Math.floor(Math.sin(i * 2.1 + variant) * 12);
    const gy = 8 + Math.floor(Math.cos(i * 1.7 + variant) * 6);
    ctx.fillRect(gx, gy, 2, 1);
  }
  return c;
}

function drawGrassFlower() {
  const c = drawGrass(1);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#E91E63';
  ctx.fillRect(28, 12, 3, 3);
  ctx.fillStyle = '#FF9800';
  ctx.fillRect(38, 18, 3, 3);
  ctx.fillStyle = '#FFEB3B';
  ctx.fillRect(22, 20, 2, 2);
  return c;
}

function drawPath() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#D7A86E');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#C49155');
  ctx.fillStyle = '#E0C8A0';
  for (let i = 0; i < 4; i++) {
    const px = 20 + i * 8;
    const py = 12 + (i % 2) * 6;
    ctx.fillRect(px, py, 2, 1);
  }
  return c;
}

function drawFloor() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#C49155');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#A0724A');
  ctx.strokeStyle = '#B8834A';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(16, 12); ctx.lineTo(48, 12);
  ctx.moveTo(10, 18); ctx.lineTo(54, 18);
  ctx.moveTo(16, 24); ctx.lineTo(48, 24);
  ctx.stroke();
  return c;
}

function drawWallBack() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#D7A86E';
  ctx.beginPath();
  ctx.moveTo(0, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.lineTo(0, TILE_H / 2 - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W, TILE_H / 2 - 16);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.closePath();
  ctx.fill();
  drawDiamond(ctx, TILE_W, TILE_H, '#8B4513');
  return c;
}

function drawWallLeft() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#C49155';
  ctx.beginPath();
  ctx.moveTo(0, TILE_H / 2);
  ctx.lineTo(TILE_W / 2, 0);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.lineTo(0, wallH - TILE_H / 2);
  ctx.closePath();
  ctx.fill();
  drawDiamond(ctx, TILE_W, TILE_H, '#C49155');
  return c;
}

function drawWallRight() {
  const wallH = 48;
  const c = makeCanvas(TILE_W, wallH);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#B8834A';
  ctx.beginPath();
  ctx.moveTo(TILE_W / 2, 0);
  ctx.lineTo(TILE_W, TILE_H / 2);
  ctx.lineTo(TILE_W, wallH - TILE_H / 2);
  ctx.lineTo(TILE_W / 2, wallH - TILE_H);
  ctx.closePath();
  ctx.fill();
  drawDiamond(ctx, TILE_W, TILE_H, '#B8834A');
  return c;
}

function drawFence() {
  const fenceH = 40;
  const c = makeCanvas(TILE_W, fenceH);
  const ctx = c.getContext('2d');
  const baseY = fenceH - TILE_H;
  ctx.save();
  ctx.translate(0, baseY);
  drawDiamond(ctx, TILE_W, TILE_H, '#689F38');
  ctx.restore();
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(10, baseY - 8, 3, 16);
  ctx.fillRect(30, baseY - 8, 3, 16);
  ctx.fillRect(50, baseY - 8, 3, 16);
  ctx.fillStyle = '#A0724A';
  ctx.fillRect(10, baseY - 4, 43, 2);
  ctx.fillRect(10, baseY + 2, 43, 2);
  return c;
}

function drawWater() {
  const c = makeCanvas(TILE_W, TILE_H);
  const ctx = c.getContext('2d');
  drawDiamond(ctx, TILE_W, TILE_H, '#42A5F5');
  drawDiamondOutline(ctx, TILE_W, TILE_H, '#1E88E5');
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(TILE_W / 2, TILE_H / 2, 6, 0, Math.PI);
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
    wall_back: drawWallBack(),
    wall_left: drawWallLeft(),
    wall_right: drawWallRight(),
    fence: drawFence(),
    water: drawWater(),
  };
}
