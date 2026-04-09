import { STAFF_ROLES, BALANCING } from './data.js';
import { fulfillNeed } from './animals.js';

const STAFF_NAMES = ["Max", "Mia", "Leon", "Emma", "Paul", "Sophie", "Lukas", "Anna", "Finn", "Lena"];

export function createStaff(roleKey, id) {
  const role = STAFF_ROLES[roleKey];
  return {
    id,
    role: roleKey,
    name: STAFF_NAMES[Math.floor(Math.random() * STAFF_NAMES.length)],
    level: 1,
    xp: 0,
    energy: BALANCING.maxEnergyBase,
    assignedAnimalId: null,
  };
}

export function tickStaff(staff) {
  staff.energy = Math.min(BALANCING.maxEnergyBase, staff.energy + BALANCING.energyRegenPerTick);
}

export function assignStaff(staff, animalId) {
  staff.assignedAnimalId = animalId;
}

export function unassignStaff(staff) {
  staff.assignedAnimalId = null;
}

export function performWork(staff, animal) {
  if (staff.energy < BALANCING.energyCostPerAction) {
    return false;
  }

  const role = STAFF_ROLES[staff.role];
  const effectiveness = 0.3 + (staff.level * 0.1);

  staff.energy -= BALANCING.energyCostPerAction;

  if (role.statEffects.food !== undefined) {
    fulfillNeed(animal, 'food', role.statEffects.food * effectiveness);
  }
  if (role.statEffects.attention !== undefined) {
    fulfillNeed(animal, 'attention', role.statEffects.attention * effectiveness);
  }
  if (role.statEffects.medicine !== undefined) {
    fulfillNeed(animal, 'medicine', role.statEffects.medicine * effectiveness);
    animal.stats.health = Math.min(1, animal.stats.health + role.statEffects.health * effectiveness * 0.5);
  }
  if (role.statEffects.training !== undefined) {
    animal.stats.training = Math.min(1, animal.stats.training + role.statEffects.training * effectiveness * 0.1);
  }
  if (role.statEffects.social !== undefined) {
    animal.stats.social = Math.min(1, animal.stats.social + role.statEffects.social * effectiveness * 0.1);
  }

  staff.xp += BALANCING.xpPerAction;
  if (staff.xp >= BALANCING.xpPerLevel) {
    staff.xp -= BALANCING.xpPerLevel;
    staff.level++;
  }

  return true;
}
