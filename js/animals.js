import { SPECIES, PERSONALITY_AXES, BALANCING } from './data.js';

const DOG_NAMES = ["Buddy", "Rex", "Luna", "Max", "Bella", "Rocky", "Daisy", "Bruno", "Lola", "Charlie"];
const CAT_NAMES = ["Mimi", "Felix", "Simba", "Nala", "Whiskers", "Shadow", "Cleo", "Tiger", "Misty", "Oscar"];
const RABBIT_NAMES = ["Hoppel", "Flopsy", "Schnuffel", "Bunny", "Cotton", "Thumper", "Clover", "Hazel"];
const SMALL_NAMES = ["Nugget", "Peanut", "Cookie", "Biscuit", "Squeaky", "Fuzzy", "Pippin", "Gizmo"];
const BIRD_NAMES = ["Tweety", "Kiwi", "Sky", "Sunny", "Coco", "Rio", "Piper", "Melody"];

const NAME_MAP = {
  dog: DOG_NAMES,
  cat: CAT_NAMES,
  rabbit: RABBIT_NAMES,
  smallpet: SMALL_NAMES,
  bird: BIRD_NAMES,
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function createAnimal(speciesKey, id) {
  const species = SPECIES[speciesKey];
  const personality = {};
  for (const axis of PERSONALITY_AXES) {
    personality[axis.id] = Math.random();
  }

  return {
    id,
    species: speciesKey,
    name: randomFrom(NAME_MAP[speciesKey] || DOG_NAMES),
    stats: {
      health: randomBetween(0.4, 0.9),
      happiness: randomBetween(0.3, 0.7),
      training: randomBetween(0.0, 0.3),
      social: randomBetween(0.1, 0.5),
    },
    needs: {
      food: randomBetween(0.5, 1.0),
      medicine: randomBetween(0.5, 1.0),
      exercise: randomBetween(0.3, 0.8),
      attention: randomBetween(0.3, 0.8),
    },
    personality,
    assignedStaffId: null,
    daysInShelter: 0,
    returned: false,
  };
}

export function tickAnimal(animal) {
  const species = SPECIES[animal.species];

  for (const need of ["food", "medicine", "exercise", "attention"]) {
    const weight = species.needWeights[need];
    animal.needs[need] = Math.max(0, animal.needs[need] - BALANCING.needDecayPerTick * weight);
  }

  const avgNeed = (animal.needs.food + animal.needs.medicine + animal.needs.exercise + animal.needs.attention) / 4;
  if (avgNeed < 0.3) {
    animal.stats.happiness = Math.max(0, animal.stats.happiness - 0.01);
  } else if (avgNeed > 0.7) {
    animal.stats.happiness = Math.min(1, animal.stats.happiness + BALANCING.happinessFromCare * 0.2);
  }

  if (animal.needs.medicine < 0.15) {
    animal.stats.health = Math.max(0, animal.stats.health - 0.005);
  }
}

export function fulfillNeed(animal, need, amount) {
  animal.needs[need] = Math.min(1, animal.needs[need] + amount);
}
