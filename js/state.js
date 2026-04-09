import { BALANCING, SPECIES, STAFF_ROLES } from './data.js';

const SAVE_KEY = 'jujupets-save';

export function createNewState() {
  const unlockedSpecies = Object.entries(SPECIES)
    .filter(([_, s]) => s.unlockYear === 0)
    .map(([key]) => key);

  const unlockedRoles = Object.entries(STAFF_ROLES)
    .filter(([_, r]) => r.unlockYear === 0)
    .map(([key]) => key);

  return {
    money: BALANCING.startingMoney,
    reputation: BALANCING.startingReputation,
    time: { year: 1, month: 1, week: 1, day: 1, tick: 0 },
    animals: [],
    staff: [],
    owners: [],
    events: [],
    unlockedSpecies,
    unlockedRoles,
    maxAnimals: BALANCING.maxAnimalsStart,
    totalAdoptions: 0,
    totalReturns: 0,
    tickerMessages: [],
    gameOver: false,
    endless: false,
    nextId: 1,
  };
}

export function saveState(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function advanceTime(state) {
  state.time.tick++;
  if (state.time.tick >= BALANCING.ticksPerDay) {
    state.time.tick = 0;
    state.time.day++;
    if (state.time.day > BALANCING.daysPerWeek) {
      state.time.day = 1;
      state.time.week++;
      if (state.time.week > BALANCING.weeksPerMonth) {
        state.time.week = 1;
        state.time.month++;
        if (state.time.month > BALANCING.monthsPerYear) {
          state.time.month = 1;
          state.time.year++;
          if (state.time.year > BALANCING.totalYears && !state.endless) {
            state.gameOver = true;
          }
        }
      }
    }
  }
  return state.time;
}
