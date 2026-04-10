const ANIMAL_W = 32;
const ANIMAL_H = 32;
const ANIMAL_FRAMES = 4;
const ANIMAL_ANIMS = 4;

const STAFF_W = 32;
const STAFF_H = 48;
const STAFF_FRAMES = 6;
const STAFF_ANIMS = 3;

const SPECIES_PALETTE = {
  dog:      { body: '#C8A070', dark: '#A07848', ear: '#8B6914', eye: '#333' },
  cat:      { body: '#9E9E9E', dark: '#757575', ear: '#BDBDBD', eye: '#4CAF50' },
  rabbit:   { body: '#E0C8A0', dark: '#C8A878', ear: '#F5E0C0', eye: '#E91E63' },
  smallpet: { body: '#D0B080', dark: '#B89060', ear: '#E8D0A8', eye: '#333' },
  bird:     { body: '#4FC3F7', dark: '#0288D1', ear: '#FF9800', eye: '#333' },
};

const ROLE_PALETTE = {
  caretaker:  { shirt: '#4CAF50', pants: '#795548', skin: '#FFCC80', hair: '#5D4037' },
  vet:        { shirt: '#FFFFFF', pants: '#90CAF9', skin: '#FFCC80', hair: '#333333' },
  trainer:    { shirt: '#FF9800', pants: '#616161', skin: '#FFCC80', hair: '#D84315' },
  matchmaker: { shirt: '#CE93D8', pants: '#424242', skin: '#FFCC80', hair: '#F9A825' },
};

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawAnimalFrame(ctx, x, y, palette, anim, frame) {
  const cx = x + ANIMAL_W / 2;
  const cy = y + ANIMAL_H / 2;
  let bobY = 0;
  if (anim === 0) bobY = Math.sin(frame * 1.5) * 1;
  if (anim === 1) bobY = -2 + frame;
  if (anim === 2) bobY = 2;
  if (anim === 3) bobY = frame % 2 === 0 ? -1 : 1;
  const by = cy + bobY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, y + ANIMAL_H - 4, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.fillStyle = palette.body;
  ctx.fillRect(cx - 8, by - 4, 16, 12);
  // Head
  ctx.fillStyle = palette.body;
  ctx.fillRect(cx - 6, by - 12, 12, 10);
  // Ears
  ctx.fillStyle = palette.ear;
  ctx.fillRect(cx - 6, by - 16, 4, 5);
  ctx.fillRect(cx + 2, by - 16, 4, 5);
  // Eyes
  ctx.fillStyle = palette.eye;
  ctx.fillRect(cx - 4, by - 9, 2, 2);
  ctx.fillRect(cx + 2, by - 9, 2, 2);
  // Nose
  ctx.fillStyle = palette.dark;
  ctx.fillRect(cx - 1, by - 6, 2, 2);
  // Legs
  ctx.fillStyle = palette.dark;
  const legOffset = anim === 1 ? (frame % 2) * 2 : 0;
  ctx.fillRect(cx - 6, by + 8, 3, 5 + legOffset);
  ctx.fillRect(cx + 3, by + 8, 3, 5 - legOffset);
  // Tail (happy)
  if (anim === 1) {
    ctx.fillStyle = palette.body;
    const tailX = cx + 8 + Math.sin(frame * 2) * 3;
    ctx.fillRect(tailX, by - 2, 4, 3);
  }
}

export function createAnimalSpriteSheet(speciesKey) {
  const c = makeCanvas(ANIMAL_W * ANIMAL_FRAMES, ANIMAL_H * ANIMAL_ANIMS);
  const ctx = c.getContext('2d');
  const palette = SPECIES_PALETTE[speciesKey] || SPECIES_PALETTE.dog;
  for (let anim = 0; anim < ANIMAL_ANIMS; anim++) {
    for (let frame = 0; frame < ANIMAL_FRAMES; frame++) {
      drawAnimalFrame(ctx, frame * ANIMAL_W, anim * ANIMAL_H, palette, anim, frame);
    }
  }
  return c;
}

function drawStaffFrame(ctx, x, y, palette, anim, frame) {
  const cx = x + STAFF_W / 2;
  const footY = y + STAFF_H - 4;
  let bobY = 0;
  let legAnim = 0;
  if (anim === 1) { bobY = Math.sin(frame * 1.2) * 1; legAnim = frame; }
  if (anim === 2) { bobY = frame % 2 === 0 ? -1 : 0; }
  const headY = y + 4 + bobY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, footY + 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = palette.pants;
  const lStep = Math.sin(legAnim * 1.5) * 3;
  ctx.fillRect(cx - 5, footY - 14, 4, 14 + lStep);
  ctx.fillRect(cx + 1, footY - 14, 4, 14 - lStep);
  // Shoes
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(cx - 6, footY, 5, 3);
  ctx.fillRect(cx + 1, footY, 5, 3);
  // Body/shirt
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(cx - 7, headY + 14, 14, 16);
  // Arms
  const armSwing = anim === 2 ? Math.sin(frame * 2) * 4 : 0;
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(cx - 10, headY + 16 + armSwing, 4, 12);
  ctx.fillRect(cx + 6, headY + 16 - armSwing, 4, 12);
  // Hands
  ctx.fillStyle = palette.skin;
  ctx.fillRect(cx - 10, headY + 26 + armSwing, 4, 3);
  ctx.fillRect(cx + 6, headY + 26 - armSwing, 4, 3);
  // Head
  ctx.fillStyle = palette.skin;
  ctx.fillRect(cx - 5, headY + 2, 10, 12);
  // Hair
  ctx.fillStyle = palette.hair;
  ctx.fillRect(cx - 6, headY, 12, 5);
  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(cx - 3, headY + 6, 2, 2);
  ctx.fillRect(cx + 1, headY + 6, 2, 2);
  // Mouth
  ctx.fillStyle = '#C49155';
  ctx.fillRect(cx - 1, headY + 10, 2, 1);
}

export function createStaffSpriteSheet(roleKey) {
  const c = makeCanvas(STAFF_W * STAFF_FRAMES, STAFF_H * STAFF_ANIMS);
  const ctx = c.getContext('2d');
  const palette = ROLE_PALETTE[roleKey] || ROLE_PALETTE.caretaker;
  for (let anim = 0; anim < STAFF_ANIMS; anim++) {
    for (let frame = 0; frame < STAFF_FRAMES; frame++) {
      drawStaffFrame(ctx, frame * STAFF_W, anim * STAFF_H, palette, anim, frame);
    }
  }
  return c;
}

export const ANIMAL_SPRITE = { W: ANIMAL_W, H: ANIMAL_H, FRAMES: ANIMAL_FRAMES, ANIMS: ANIMAL_ANIMS };
export const STAFF_SPRITE = { W: STAFF_W, H: STAFF_H, FRAMES: STAFF_FRAMES, ANIMS: STAFF_ANIMS };

let _decoCache = null;

export function createDecoSpriteSheet() {
  if (_decoCache) return _decoCache;

  function draw(w, h, painter) {
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    painter(ctx, w, h);
    return { canvas: c, w, h };
  }

  _decoCache = {
    tree_oak: draw(64, 96, (ctx, w, h) => {
      // Trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(28, 50, 8, 46);
      // Canopy (round)
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(32, 40, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#43A047';
      ctx.beginPath();
      ctx.arc(28, 35, 16, 0, Math.PI * 2);
      ctx.fill();
    }),

    tree_pine: draw(64, 96, (ctx, w, h) => {
      // Trunk
      ctx.fillStyle = '#4E342E';
      ctx.fillRect(29, 60, 6, 36);
      // Triangle layers
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath(); ctx.moveTo(32, 5); ctx.lineTo(52, 40); ctx.lineTo(12, 40); ctx.fill();
      ctx.fillStyle = '#388E3C';
      ctx.beginPath(); ctx.moveTo(32, 20); ctx.lineTo(56, 55); ctx.lineTo(8, 55); ctx.fill();
      ctx.fillStyle = '#43A047';
      ctx.beginPath(); ctx.moveTo(32, 35); ctx.lineTo(58, 65); ctx.lineTo(6, 65); ctx.fill();
    }),

    bush: draw(32, 32, (ctx) => {
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(16, 22, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#66BB6A';
      ctx.beginPath();
      ctx.arc(12, 18, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(20, 18, 8, 0, Math.PI * 2);
      ctx.fill();
    }),

    bench: draw(64, 32, (ctx) => {
      // Seat
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 14, 56, 6);
      // Legs
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(8, 20, 4, 10);
      ctx.fillRect(52, 20, 4, 10);
      // Back rest
      ctx.fillStyle = '#795548';
      ctx.fillRect(4, 8, 56, 4);
      ctx.fillRect(8, 4, 4, 14);
      ctx.fillRect(52, 4, 4, 14);
    }),

    flower_bed: draw(64, 32, (ctx) => {
      // Soil
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(4, 18, 56, 12);
      // Flowers
      const colors = ['#E91E63', '#FF9800', '#FFEB3B', '#9C27B0', '#2196F3'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(10 + i * 11, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Stems
      ctx.fillStyle = '#4CAF50';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(9 + i * 11, 14, 2, 8);
      }
    }),

    cage: draw(64, 64, (ctx) => {
      // Floor
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(4, 48, 56, 12);
      // Bars
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const x = 8 + i * 8;
        ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x, 48); ctx.stroke();
      }
      // Top bar
      ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(56, 12); ctx.stroke();
      // Open door hint
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(24, 24, 16, 24);
    }),

    treatment_table: draw(64, 64, (ctx) => {
      // Table top
      ctx.fillStyle = '#CFD8DC';
      ctx.fillRect(4, 20, 56, 8);
      // Legs
      ctx.fillStyle = '#90A4AE';
      ctx.fillRect(8, 28, 4, 32);
      ctx.fillRect(52, 28, 4, 32);
      ctx.fillRect(28, 28, 4, 32);
      // Surface detail
      ctx.fillStyle = '#B0BEC5';
      ctx.fillRect(8, 20, 48, 2);
    }),

    counter: draw(64, 64, (ctx) => {
      // Main body
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 16, 56, 44);
      // Top surface
      ctx.fillStyle = '#A1887F';
      ctx.fillRect(2, 12, 60, 8);
      // Front panel lines
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 20); ctx.lineTo(32, 60);
      ctx.stroke();
    }),

    shelf: draw(64, 64, (ctx) => {
      // Back panel
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(4, 0, 56, 64);
      // Shelves
      ctx.fillStyle = '#A1887F';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(2, 12 + i * 18, 60, 4);
      }
      // Bags on shelves
      ctx.fillStyle = '#FFF9C4';
      ctx.fillRect(10, 2, 12, 10);
      ctx.fillRect(30, 2, 12, 10);
      ctx.fillStyle = '#FFCC80';
      ctx.fillRect(12, 20, 10, 12);
      ctx.fillRect(38, 20, 10, 12);
      ctx.fillStyle = '#C8E6C9';
      ctx.fillRect(14, 38, 10, 10);
    }),

    food_bowl: draw(32, 16, (ctx) => {
      // Bowl
      ctx.fillStyle = '#FF8A65';
      ctx.beginPath();
      ctx.ellipse(16, 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Food inside
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.ellipse(16, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }),

    water_bowl: draw(32, 16, (ctx) => {
      // Bowl
      ctx.fillStyle = '#90CAF9';
      ctx.beginPath();
      ctx.ellipse(16, 10, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Water surface
      ctx.fillStyle = '#42A5F5';
      ctx.beginPath();
      ctx.ellipse(16, 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }),

    climbing_tree: draw(32, 64, (ctx) => {
      // Post
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(12, 8, 8, 56);
      // Platforms
      ctx.fillStyle = '#A1887F';
      ctx.fillRect(2, 6, 28, 6);
      ctx.fillRect(4, 28, 24, 6);
      ctx.fillRect(0, 50, 32, 6);
      // Carpet on platforms
      ctx.fillStyle = '#CE93D8';
      ctx.fillRect(4, 6, 24, 3);
      ctx.fillRect(6, 28, 20, 3);
      ctx.fillRect(2, 50, 28, 3);
    }),
  };

  return _decoCache;
}
