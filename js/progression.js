import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';

const MILESTONES = [
  { id: 'rabbit',      year: 3,  type: 'species', key: 'rabbit',     message: "Kaninchen freigeschaltet!" },
  { id: 'vet',         year: 3,  type: 'role',    key: 'vet',        message: "Tierarzt einstellbar!" },
  { id: 'smallpet',    year: 5,  type: 'species', key: 'smallpet',   message: "Kleintiere freigeschaltet!" },
  { id: 'trainer',     year: 5,  type: 'role',    key: 'trainer',    message: "Trainer einstellbar!" },
  { id: 'bird',        year: 7,  type: 'species', key: 'bird',       message: "Vögel freigeschaltet!" },
  { id: 'matchmaker',  year: 7,  type: 'role',    key: 'matchmaker', message: "Vermittler einstellbar!" },
  { id: 'expansion1',  year: 9,  type: 'upgrade', key: 'expansion1', message: "Tierheim-Erweiterung Stufe 1 verfügbar!", maxAnimalsBonus: 4 },
  { id: 'expansion2',  year: 12, type: 'upgrade', key: 'expansion2', message: "Tierheim-Erweiterung Stufe 2 verfügbar!", maxAnimalsBonus: 4 },
  { id: 'branch',      year: 15, type: 'upgrade', key: 'branch',     message: "Außenstelle verfügbar!", maxAnimalsBonus: 6 },
];

export function checkMilestones(state) {
  const unlocked = [];
  for (const milestone of MILESTONES) {
    if (state.time.year < milestone.year) continue;
    if (milestone.type === 'species') {
      if (state.unlockedSpecies.includes(milestone.key)) continue;
      state.unlockedSpecies.push(milestone.key);
      state.tickerMessages.push(milestone.message);
      unlocked.push(milestone);
    } else if (milestone.type === 'role') {
      if (state.unlockedRoles.includes(milestone.key)) continue;
      state.unlockedRoles.push(milestone.key);
      state.tickerMessages.push(milestone.message);
      unlocked.push(milestone);
    } else if (milestone.type === 'upgrade') {
      if (state.unlockedUpgrades && state.unlockedUpgrades.includes(milestone.key)) continue;
      if (!state.unlockedUpgrades) state.unlockedUpgrades = [];
      state.unlockedUpgrades.push(milestone.key);
      if (milestone.maxAnimalsBonus) {
        state.maxAnimals += milestone.maxAnimalsBonus;
      }
      state.tickerMessages.push(milestone.message);
      unlocked.push(milestone);
    }
  }
  if (state.time.year > BALANCING.totalYears && !state.endless && !state.gameOver) {
    state.gameOver = true;
    state.tickerMessages.push("20 Jahre sind vorbei! Endwertung...");
  }
  return unlocked;
}

export function enableEndless(state) {
  state.gameOver = false;
  state.endless = true;
  state.tickerMessages.push("Endlos-Modus freigeschaltet! Spiele weiter ohne Zeitlimit.");
}

export function calculateFinalScore(state) {
  return {
    totalAdoptions: state.totalAdoptions,
    totalReturns: state.totalReturns,
    reputation: state.reputation,
    money: state.money,
    score: state.totalAdoptions * 100 + state.reputation * 50 - state.totalReturns * 200 + Math.floor(state.money / 10),
  };
}
