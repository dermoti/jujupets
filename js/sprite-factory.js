// ============================================================
// ANIMAL constants
// ============================================================
const ANIMAL_W     = 16;
const ANIMAL_H     = 18;
const ANIMAL_FRAMES = 3;
const ANIMAL_ANIMS  = 4;
const ANIMAL_DIRS   = 4;

// ============================================================
// STAFF constants
// ============================================================
const STAFF_W      = 14;
const STAFF_H      = 22;
const STAFF_FRAMES  = 3;
const STAFF_ANIMS   = 3;
const STAFF_DIRS    = 4;

// ============================================================
// Palettes
// ============================================================
const SPECIES_PALETTE = {
  dog:      { body: '#C8A070', dark: '#A07848', ear: '#8B6914',  eye: '#333333', nose: '#9B4E2A' },
  cat:      { body: '#9E9E9E', dark: '#757575', ear: '#BDBDBD',  eye: '#4CAF50', nose: '#E91E63' },
  rabbit:   { body: '#E0C8A0', dark: '#C8A878', ear: '#F5A0A8',  eye: '#E91E63', nose: '#E57373' },
  smallpet: { body: '#D0B080', dark: '#B89060', ear: '#E8D0A8',  eye: '#333333', nose: '#795548' },
  bird:     { body: '#4FC3F7', dark: '#0288D1', ear: '#FF9800',  eye: '#333333', nose: '#FF9800' },
};

const ROLE_PALETTE = {
  caretaker:  { shirt: '#4CAF50',  pants: '#795548', skin: '#FFCC80', hair: '#5D4037' },
  vet:        { shirt: '#ECEFF1',  pants: '#90CAF9', skin: '#FFCC80', hair: '#333333' },
  trainer:    { shirt: '#FF9800',  pants: '#616161', skin: '#FFCC80', hair: '#D84315' },
  matchmaker: { shirt: '#CE93D8',  pants: '#424242', skin: '#FFCC80', hair: '#F9A825' },
};

// ============================================================
// Helpers
// ============================================================
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Outline helper — draws a filled rect with a dark border
function outlineRect(ctx, x, y, w, h, fill, lineW = 1.5) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = lineW;
  ctx.strokeRect(x + lineW / 2, y + lineW / 2, w - lineW, h - lineW);
}

// Outlined circle
function outlineCircle(ctx, cx, cy, r, fill, lineW = 1.5) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = lineW;
  ctx.stroke();
}

// ============================================================
// Animal frame drawing — PA blob style
//
// dir: 0=south (facing viewer), 1=west, 2=north (back), 3=east
// anim: 0=idle, 1=happy/wag, 2=eat, 3=walk
// frame: 0..2
// ============================================================
function drawAnimalFrame(ctx, x, y, palette, species, anim, frame, dir) {
  // ---- Layout measurements (relative to cell origin) ----
  const W = ANIMAL_W;
  const H = ANIMAL_H;
  const cx = x + W / 2;

  // Bob offset for walking / idle breathing
  let bobY = 0;
  if (anim === 0) bobY = frame === 1 ? -1 : 0;          // idle: slight breathe
  if (anim === 3) bobY = frame % 2 === 0 ? 0 : -1;       // walk: step bob

  // For eat anim lean forward
  const leanX = (anim === 2) ? 1 : 0;

  // ---- Shadow ----
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx + leanX, y + H - 2, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Body (small rectangle) ----
  const bodyW = 8;
  const bodyH = 5;
  const bodyTop = y + H - 2 - 4 - bodyH + bobY;
  const bodyX = cx - bodyW / 2 + leanX;

  outlineRect(ctx, bodyX, bodyTop, bodyW, bodyH, palette.body);

  // ---- Legs (stubby, 2 visible) ----
  const legH = 4;
  const legW = 2;
  const legY = bodyTop + bodyH;

  // Walk animation: alternate legs
  let leftLegH  = legH;
  let rightLegH = legH;
  if (anim === 3) {
    if (frame === 1) { leftLegH  = legH + 1; rightLegH = legH - 1; }
    if (frame === 2) { leftLegH  = legH - 1; rightLegH = legH + 1; }
  }

  if (dir !== 2) { // show legs for S / E / W; for north just stubs
    ctx.fillStyle = palette.dark;
    ctx.fillRect(bodyX + 1,           legY, legW, leftLegH);
    ctx.fillRect(bodyX + bodyW - legW - 1, legY, legW, rightLegH);
  } else {
    ctx.fillStyle = palette.dark;
    ctx.fillRect(bodyX + 1,           legY, legW, legH - 1);
    ctx.fillRect(bodyX + bodyW - legW - 1, legY, legW, legH - 1);
  }

  // ---- Head position (varies by direction) ----
  const headR = species === 'smallpet' ? 4 : (species === 'bird' ? 4 : 5);
  let headCX = cx + leanX;
  let headCY = bodyTop - headR + 1 + bobY;

  // Side views: shift head slightly toward facing direction
  if (dir === 1) headCX = cx - 1 + leanX; // west
  if (dir === 3) headCX = cx + 1 + leanX; // east

  // ---- Species-specific ears / features BEHIND head ----
  if (species === 'dog') {
    // Floppy oval ears on the sides
    if (dir === 0 || dir === 2) {
      // Front/back: ears hang on both sides
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.ellipse(headCX - headR + 1, headCY + 1, 2, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headCX + headR - 1, headCY + 1, 2, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Side: one drooping ear
      const earSide = dir === 1 ? -1 : 1;
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.ellipse(headCX + earSide * headR, headCY + 2, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (species === 'rabbit') {
    // Long upright oval ears
    if (dir === 0 || dir === 2) {
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.ellipse(headCX - 3, headCY - headR - 2, 2, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headCX + 3, headCY - headR - 2, 2, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      // Inner pink
      ctx.fillStyle = '#F48FB1';
      ctx.beginPath();
      ctx.ellipse(headCX - 3, headCY - headR - 2, 1, 3, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(headCX + 3, headCY - headR - 2, 1, 3, 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const earSide = dir === 1 ? -1 : 1;
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.ellipse(headCX, headCY - headR - 1, 2, 5, earSide * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F48FB1';
      ctx.beginPath();
      ctx.ellipse(headCX, headCY - headR - 1, 1, 3, earSide * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Main head blob ----
  outlineCircle(ctx, headCX, headCY, headR, dir === 2 ? palette.dark : palette.body);

  // ---- Cat: pointed triangle ears (drawn over head outline) ----
  if (species === 'cat') {
    if (dir === 0 || dir === 2) {
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.moveTo(headCX - headR + 1, headCY - 1);
      ctx.lineTo(headCX - headR - 1, headCY - headR - 3);
      ctx.lineTo(headCX - 1, headCY - headR + 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(headCX + headR - 1, headCY - 1);
      ctx.lineTo(headCX + headR + 1, headCY - headR - 3);
      ctx.lineTo(headCX + 1, headCY - headR + 1);
      ctx.fill();
    } else {
      const earSide = dir === 1 ? -1 : 1;
      ctx.fillStyle = palette.ear;
      ctx.beginPath();
      ctx.moveTo(headCX + earSide * (headR - 1), headCY - 1);
      ctx.lineTo(headCX + earSide * (headR + 2), headCY - headR - 2);
      ctx.lineTo(headCX + earSide * 1, headCY - headR + 1);
      ctx.fill();
    }
  }

  // ---- Bird: triangle beak ----
  if (species === 'bird') {
    if (dir === 0) {
      ctx.fillStyle = palette.nose; // orange
      ctx.beginPath();
      ctx.moveTo(headCX - 2, headCY + 1);
      ctx.lineTo(headCX + 2, headCY + 1);
      ctx.lineTo(headCX, headCY + 4);
      ctx.fill();
    } else if (dir === 2) {
      // No beak visible from back
    } else {
      const beakDir = dir === 1 ? -1 : 1;
      ctx.fillStyle = palette.nose;
      ctx.beginPath();
      ctx.moveTo(headCX, headCY + 1);
      ctx.lineTo(headCX + beakDir * (headR + 1), headCY);
      ctx.lineTo(headCX, headCY - 1);
      ctx.fill();
    }
  }

  // ---- Eyes (south & side only, not north) ----
  if (dir !== 2) {
    ctx.fillStyle = palette.eye;
    if (dir === 0) {
      // Both eyes visible
      ctx.fillRect(headCX - 3, headCY - 1, 2, 2);
      ctx.fillRect(headCX + 1, headCY - 1, 2, 2);
    } else {
      // Side: one eye
      const eyeOffX = dir === 1 ? -2 : 2;
      ctx.fillRect(headCX + eyeOffX - 1, headCY - 1, 2, 2);
    }
  }

  // ---- Nose (south only, except bird already drew beak) ----
  if (dir === 0 && species !== 'bird') {
    ctx.fillStyle = palette.nose;
    ctx.fillRect(headCX - 1, headCY + 2, 2, 1);
  }

  // ---- Tail ----
  if (anim === 1) {
    // Happy: wagging tail
    const wagX = Math.sin(frame * 1.4) * 2;
    if (dir === 0 || dir === 2) {
      ctx.fillStyle = palette.body;
      outlineRect(ctx, bodyX + bodyW - 1, bodyTop - 1 + wagX, 3, 2, palette.body, 1);
    } else if (dir === 1) {
      ctx.fillStyle = palette.body;
      outlineRect(ctx, bodyX + bodyW, bodyTop + wagX, 3, 2, palette.body, 1);
    } else {
      outlineRect(ctx, bodyX - 3, bodyTop + wagX, 3, 2, palette.body, 1);
    }
  } else if (species === 'cat' && dir === 0) {
    // Cat: upright tail
    const tailSway = frame === 1 ? 1 : (frame === 2 ? -1 : 0);
    ctx.fillStyle = palette.dark;
    ctx.fillRect(bodyX + bodyW, bodyTop + 1 + tailSway, 2, 4);
    ctx.fillRect(bodyX + bodyW + 1 + tailSway, bodyTop - 2, 2, 3);
  }
}

export function createAnimalSpriteSheet(speciesKey) {
  const palette = SPECIES_PALETTE[speciesKey] || SPECIES_PALETTE.dog;
  const species = speciesKey || 'dog';
  const sheetW = ANIMAL_W * ANIMAL_FRAMES * ANIMAL_DIRS;
  const sheetH = ANIMAL_H * ANIMAL_ANIMS;
  const c = makeCanvas(sheetW, sheetH);
  const ctx = c.getContext('2d');

  for (let anim = 0; anim < ANIMAL_ANIMS; anim++) {
    for (let dir = 0; dir < ANIMAL_DIRS; dir++) {
      for (let frame = 0; frame < ANIMAL_FRAMES; frame++) {
        const col = dir * ANIMAL_FRAMES + frame;
        drawAnimalFrame(
          ctx,
          col * ANIMAL_W,
          anim * ANIMAL_H,
          palette,
          species,
          anim,
          frame,
          dir
        );
      }
    }
  }

  return c;
}

// ============================================================
// Staff frame drawing — PA blob style
//
// dir: 0=south, 1=west, 2=north, 3=east
// anim: 0=idle, 1=walk, 2=work
// frame: 0..2
// ============================================================
function drawStaffFrame(ctx, x, y, palette, role, anim, frame, dir) {
  const W = STAFF_W;
  const H = STAFF_H;
  const cx = x + W / 2;

  // Head occupies top 1/3, body fills rest
  const headH = Math.floor(H / 3);   // ~7px
  const bodyH = H - headH;           // ~15px

  // Bob offset
  let bobY = 0;
  if (anim === 1) bobY = frame % 2 === 0 ? 0 : -1;
  if (anim === 2) bobY = frame === 1 ? -1 : 0;

  // Leg swing for walk
  let leftLegOff = 0;
  let rightLegOff = 0;
  if (anim === 1) {
    if (frame === 1) { leftLegOff = -1; rightLegOff = 1; }
    if (frame === 2) { leftLegOff = 1;  rightLegOff = -1; }
  }

  const footY = y + H - 1;
  const legH = 5;
  const bodyTop = y + headH + bobY;
  const headTop = y + bobY;

  // ---- Shadow ----
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, footY + 1, 4, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Shoes ----
  ctx.fillStyle = '#4E342E';
  ctx.fillRect(cx - 4, footY - 2, 3, 2);
  ctx.fillRect(cx + 1, footY - 2, 3, 2);

  // ---- Legs ----
  ctx.fillStyle = palette.pants;
  ctx.fillRect(cx - 4, footY - legH - 2 + leftLegOff,  3, legH);
  ctx.fillRect(cx + 1, footY - legH - 2 + rightLegOff, 3, legH);

  // ---- Shirt/Body ----
  const shirtTop = bodyTop + 1;
  const shirtH = bodyH - legH - 1;
  outlineRect(ctx, cx - 4, shirtTop, 8, shirtH, palette.shirt);

  // Vet: red cross on shirt
  if (role === 'vet') {
    ctx.fillStyle = '#F44336';
    ctx.fillRect(cx - 1, shirtTop + 1, 2, shirtH - 2);
    ctx.fillRect(cx - 3, shirtTop + Math.floor(shirtH / 2) - 1, 6, 2);
  }

  // ---- Arms ----
  const armSwing = anim === 2 ? (frame === 1 ? 1 : -1) : 0;
  ctx.fillStyle = palette.shirt;
  if (dir === 0 || dir === 2) {
    ctx.fillRect(cx - 6, shirtTop + 1 + armSwing,  2, 4);
    ctx.fillRect(cx + 4, shirtTop + 1 - armSwing,  2, 4);
    // Hands
    ctx.fillStyle = palette.skin;
    ctx.fillRect(cx - 6, shirtTop + 5 + armSwing,  2, 2);
    ctx.fillRect(cx + 4, shirtTop + 5 - armSwing,  2, 2);
  } else {
    // Side: show only front arm
    const armDir = dir === 1 ? 1 : -1;
    ctx.fillRect(cx + armDir * 4, shirtTop + 1, 2, 4);
    ctx.fillStyle = palette.skin;
    ctx.fillRect(cx + armDir * 4, shirtTop + 5, 2, 2);
  }

  // ---- Head ----
  const headCX = cx;
  const headCY = headTop + Math.floor(headH / 2);
  const headR  = Math.floor(headH / 2);

  // Head circle — darker from back
  outlineCircle(ctx, headCX, headCY, headR, dir === 2 ? palette.hair : palette.skin);

  // Hair (top of head, except south facing shows face)
  ctx.fillStyle = palette.hair;
  if (dir !== 2) {
    // Small hair strip on top
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR, Math.PI, Math.PI * 2);
    ctx.fill();
    // Redraw skin on lower half
    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.arc(headCX, headCY, headR - 0.5, 0, Math.PI);
    ctx.fill();
  }

  // ---- Face features (only south and sides) ----
  if (dir !== 2) {
    // Eyes
    ctx.fillStyle = '#333333';
    if (dir === 0) {
      ctx.fillRect(headCX - 2, headCY - 1, 1, 1);
      ctx.fillRect(headCX + 1, headCY - 1, 1, 1);
    } else {
      const eyeX = dir === 1 ? headCX - 2 : headCX + 1;
      ctx.fillRect(eyeX, headCY - 1, 1, 1);
    }
    // Mouth (small dash)
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(headCX - 1, headCY + 1, 2, 1);
  }
}

export function createStaffSpriteSheet(roleKey) {
  const palette = ROLE_PALETTE[roleKey] || ROLE_PALETTE.caretaker;
  const role = roleKey || 'caretaker';
  const sheetW = STAFF_W * STAFF_FRAMES * STAFF_DIRS;
  const sheetH = STAFF_H * STAFF_ANIMS;
  const c = makeCanvas(sheetW, sheetH);
  const ctx = c.getContext('2d');

  for (let anim = 0; anim < STAFF_ANIMS; anim++) {
    for (let dir = 0; dir < STAFF_DIRS; dir++) {
      for (let frame = 0; frame < STAFF_FRAMES; frame++) {
        const col = dir * STAFF_FRAMES + frame;
        drawStaffFrame(
          ctx,
          col * STAFF_W,
          anim * STAFF_H,
          palette,
          role,
          anim,
          frame,
          dir
        );
      }
    }
  }

  return c;
}

// ============================================================
// Sprite metadata exports
// ============================================================
export const ANIMAL_SPRITE = {
  W:      ANIMAL_W,
  H:      ANIMAL_H,
  FRAMES: ANIMAL_FRAMES,
  ANIMS:  ANIMAL_ANIMS,
  DIRS:   ANIMAL_DIRS,
};

export const STAFF_SPRITE = {
  W:      STAFF_W,
  H:      STAFF_H,
  FRAMES: STAFF_FRAMES,
  ANIMS:  STAFF_ANIMS,
  DIRS:   STAFF_DIRS,
};

// ============================================================
// Deco sprites — to be fully rewritten in T11.
// Sizes are all capped at 32x32 (TILE_SIZE) or multiples.
// ============================================================
const TILE_SIZE = 32;

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
    tree_oak: draw(TILE_SIZE * 2, TILE_SIZE * 3, (ctx, w, h) => {
      // Trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(28, 50, 8, 46);
      // Canopy
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(32, 40, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#43A047';
      ctx.beginPath();
      ctx.arc(28, 35, 16, 0, Math.PI * 2);
      ctx.fill();
    }),

    tree_pine: draw(TILE_SIZE * 2, TILE_SIZE * 3, (ctx, w, h) => {
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

    bush: draw(TILE_SIZE, TILE_SIZE, (ctx) => {
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

    bench: draw(TILE_SIZE * 2, TILE_SIZE, (ctx) => {
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

    flower_bed: draw(TILE_SIZE * 2, TILE_SIZE, (ctx) => {
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

    cage: draw(TILE_SIZE * 2, TILE_SIZE * 2, (ctx) => {
      // Floor
      ctx.fillStyle = '#BDBDBD';
      ctx.fillRect(4, 48, 56, 12);
      // Bars
      ctx.strokeStyle = '#757575';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const bx = 8 + i * 8;
        ctx.beginPath(); ctx.moveTo(bx, 12); ctx.lineTo(bx, 48); ctx.stroke();
      }
      // Top bar
      ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(56, 12); ctx.stroke();
      // Open door hint
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(24, 24, 16, 24);
    }),

    treatment_table: draw(TILE_SIZE * 2, TILE_SIZE * 2, (ctx) => {
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

    counter: draw(TILE_SIZE * 2, TILE_SIZE * 2, (ctx) => {
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

    shelf: draw(TILE_SIZE * 2, TILE_SIZE * 2, (ctx) => {
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

    food_bowl: draw(TILE_SIZE, TILE_SIZE / 2, (ctx) => {
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

    water_bowl: draw(TILE_SIZE, TILE_SIZE / 2, (ctx) => {
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

    climbing_tree: draw(TILE_SIZE, TILE_SIZE * 2, (ctx) => {
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
