import { BALANCING, STAFF_ROLES } from './data.js';
import { advanceTime } from './state.js';
import { tickAnimal } from './animals.js';
import { tickStaff, performWork } from './staff.js';
import { shouldSpawnOwner, createOwner, tickOwners } from './matching.js';
import { checkPlannedEvents, rollRandomEvent, applyEvent } from './events.js';
import { checkMilestones } from './progression.js';

export function simulateTick(state) {
  if (state.gameOver) return;

  const prevDay = state.time.day;
  const prevWeek = state.time.week;
  const prevMonth = state.time.month;
  const prevYear = state.time.year;

  advanceTime(state);

  for (const animal of state.animals) {
    tickAnimal(animal);
  }

  for (const staff of state.staff) {
    tickStaff(staff);
  }

  for (const staff of state.staff) {
    if (staff.assignedAnimalId !== null) {
      const animal = state.animals.find(a => a.id === staff.assignedAnimalId);
      if (animal && staff.energy >= BALANCING.energyCostPerAction) {
        performWork(staff, animal);
      }
    }
  }

  if (state.time.day !== prevDay) {
    simulateDay(state);
  }

  if (state.time.week !== prevWeek) {
    simulateWeek(state);
  }

  if (state.time.month !== prevMonth) {
    const plannedEvents = checkPlannedEvents(state);
    for (const event of plannedEvents) {
      applyEvent(state, event);
    }
  }

  if (state.time.year !== prevYear) {
    checkMilestones(state);
  }
}

export function simulateDay(state) {
  const foodCost = state.animals.length * BALANCING.dailyFoodCost;
  state.money -= foodCost;

  for (const staff of state.staff) {
    const role = STAFF_ROLES[staff.role];
    state.money -= Math.ceil(role.salary / BALANCING.daysPerWeek);
  }

  if (shouldSpawnOwner(state) && state.owners.length < 5) {
    const owner = createOwner(state.nextId++);
    state.owners.push(owner);
  }

  tickOwners(state);

  const randomEvent = rollRandomEvent(state);
  if (randomEvent) {
    applyEvent(state, randomEvent);
  }

  for (const animal of state.animals) {
    animal.daysInShelter++;
  }
}

function simulateWeek(state) {
  if (state.tickerMessages.length > 10) {
    state.tickerMessages = state.tickerMessages.slice(-10);
  }
}
