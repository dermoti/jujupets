import { ANIMAL_SPRITE, STAFF_SPRITE } from './sprite-factory.js';

export function createAnimState(spriteInfo) {
  let anim = 0;
  let frame = 0;
  let timer = 0;
  let direction = 0;
  const frameMs = 200;

  return {
    setAnim(newAnim) {
      if (anim !== newAnim) {
        anim = newAnim;
        frame = 0;
        timer = 0;
      }
    },

    setDir(d) {
      direction = d;
    },

    update(dt) {
      timer += dt;
      if (timer >= frameMs) {
        timer -= frameMs;
        frame = (frame + 1) % spriteInfo.FRAMES;
      }
    },

    getFrame() {
      return {
        sx: (direction * spriteInfo.FRAMES + frame) * spriteInfo.W,
        sy: anim * spriteInfo.H,
        sw: spriteInfo.W,
        sh: spriteInfo.H,
      };
    },

    get currentAnim() { return anim; },
    get currentFrame() { return frame; },
    get currentDir() { return direction; },
  };
}

export function directionFromVelocity(dx, dy) {
  if (dx === 0 && dy === 0) return 0;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 1 : 3;
  return dy < 0 ? 2 : 0;
}

export function animalAnimFromStats(animal) {
  if (animal._eating) return 3;
  if (animal.stats.happiness > 0.7) return 1;
  if (animal.stats.happiness < 0.3) return 2;
  return 0;
}

export function staffAnimFromState(staff) {
  if (staff._working) return 2;
  if (staff.assignedAnimalId !== null) return 1;
  return 0;
}
