import { SPECIES, PERSONALITY_AXES, OWNER_PROFILES, BALANCING } from './data.js';

const OWNER_NAMES = [
  "Familie Klein", "Herr Müller", "Frau Schmidt", "Familie Weber",
  "Herr Fischer", "Frau Meyer", "Familie Wagner", "Herr Becker",
  "Frau Hoffmann", "Familie Schulz", "Herr Koch", "Frau Richter",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createOwner(id) {
  const preferences = {};
  for (const axis of PERSONALITY_AXES) {
    preferences[axis.id] = Math.random();
  }

  return {
    id,
    name: randomFrom(OWNER_NAMES),
    preferences,
    profile: {
      housing: randomFrom(OWNER_PROFILES.housing),
      experience: randomFrom(OWNER_PROFILES.experience),
      household: randomFrom(OWNER_PROFILES.household),
    },
    patienceDays: Math.floor(7 + Math.random() * (BALANCING.ownerPatienceDays - 7)),
    daysWaiting: 0,
  };
}

export function calculateMatchScore(animal, owner, matchmakerBonus) {
  // 1. Personality match (40%)
  let personalityScore = 0;
  for (const axis of PERSONALITY_AXES) {
    const diff = Math.abs(animal.personality[axis.id] - owner.preferences[axis.id]);
    personalityScore += (1 - diff);
  }
  personalityScore = (personalityScore / PERSONALITY_AXES.length) * 100;

  // 2. Training level (25%)
  const trainingScore = animal.stats.training * 100;

  // 3. Health & happiness (20%)
  const healthHappyScore = ((animal.stats.health + animal.stats.happiness) / 2) * 100;

  // 4. Matchmaker bonus (15%)
  const staffScore = matchmakerBonus * 100;

  // Weighted sum
  const score =
    personalityScore * BALANCING.matchWeightPersonality +
    trainingScore * BALANCING.matchWeightTraining +
    healthHappyScore * BALANCING.matchWeightHealth +
    staffScore * BALANCING.matchWeightStaff;

  // Profile compatibility modifiers
  let modifier = 0;

  if (animal.species === 'dog' && animal.personality.energy > 0.7 && owner.profile.housing === 'apartment') {
    modifier -= 10;
  }
  if (animal.personality.obedience < 0.3 && owner.profile.experience === 'firstTime') {
    modifier -= 8;
  }
  if (animal.personality.confidence < 0.3 && owner.profile.household === 'children') {
    modifier -= 8;
  }
  if (animal.species === 'dog' && animal.personality.energy > 0.6 && owner.profile.household === 'children') {
    modifier += 5;
  }
  if (animal.personality.energy < 0.4 && owner.profile.household === 'seniors') {
    modifier += 5;
  }

  return Math.max(0, Math.min(100, score + modifier));
}

export function executeAdoption(state, animal, owner, matchScore) {
  state.animals = state.animals.filter(a => a.id !== animal.id);

  const species = SPECIES[animal.species];
  let fee = species.baseAdoptionFee;
  let repChange = 0;

  if (matchScore >= BALANCING.matchThresholdPerfect) {
    fee *= 1.5;
    repChange = BALANCING.adoptionRepPerfect;
  } else if (matchScore >= BALANCING.matchThresholdGood) {
    repChange = BALANCING.adoptionRepGood;
  } else {
    fee *= 0.5;
    repChange = BALANCING.adoptionRepBad;
    if (Math.random() < BALANCING.returnRiskBadMatch) {
      animal.stats.happiness = Math.max(0, animal.stats.happiness - 0.2);
      animal.returned = true;
      state.animals.push(animal);
      state.totalReturns++;
      repChange += BALANCING.returnRepPenalty;
      state.tickerMessages.push(`${animal.name} wurde zurückgebracht!`);
    }
  }

  state.money += Math.floor(fee);
  state.reputation = Math.max(0, Math.min(BALANCING.maxReputation, state.reputation + repChange));
  state.totalAdoptions++;

  state.owners = state.owners.filter(o => o.id !== owner.id);

  return { fee: Math.floor(fee), repChange, matchScore };
}

export function shouldSpawnOwner(state) {
  const chance = BALANCING.ownerSpawnBaseChance + (state.reputation * BALANCING.ownerSpawnRepBonus);
  return Math.random() < chance;
}

export function tickOwners(state) {
  for (const owner of state.owners) {
    owner.daysWaiting++;
  }
  state.owners = state.owners.filter(o => o.daysWaiting < o.patienceDays);
}
