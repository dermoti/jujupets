import { EVENT_TYPES, BALANCING } from './data.js';
import { createAnimal } from './animals.js';

export function checkPlannedEvents(state) {
  const events = [];
  const { month, week, day } = state.time;

  if (week === 1 && day === 1) {
    events.push({ type: 'adoptionFest', name: EVENT_TYPES.planned.adoptionFest.name });
  }

  if (week === 1 && day === 1 && month % 3 === 0) {
    events.push({ type: 'inspection', name: EVENT_TYPES.planned.inspection.name });
  }

  return events;
}

export function rollRandomEvent(state) {
  if (Math.random() > BALANCING.randomEventChancePerDay) {
    return null;
  }

  const eventDefs = Object.entries(EVENT_TYPES.random);
  const totalWeight = eventDefs.reduce((sum, [_, def]) => sum + def.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [key, def] of eventDefs) {
    roll -= def.weight;
    if (roll <= 0) {
      return { type: key, name: def.name };
    }
  }
  return null;
}

export function applyEvent(state, event) {
  switch (event.type) {
    case 'adoptionFest':
      state.tickerMessages.push("Adoptionsfest! Mehr Besucher heute.");
      break;

    case 'inspection': {
      let score = 0;
      if (state.animals.length > 0) {
        const avgHappiness = state.animals.reduce((s, a) => s + a.stats.happiness, 0) / state.animals.length;
        const avgHealth = state.animals.reduce((s, a) => s + a.stats.health, 0) / state.animals.length;
        score = (avgHappiness + avgHealth) / 2;
      } else {
        score = 0.5;
      }
      const repChange = score > 0.6 ? 5 : -5;
      state.reputation = Math.max(0, Math.min(BALANCING.maxReputation, state.reputation + repChange));
      state.tickerMessages.push(
        repChange > 0 ? "Inspektion bestanden! Reputation +" + repChange : "Inspektion mangelhaft! Reputation " + repChange
      );
      break;
    }

    case 'strayAnimal': {
      const speciesKeys = state.unlockedSpecies;
      const speciesKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
      const animal = createAnimal(speciesKey, state.nextId++);
      animal.stats.health = Math.random() * 0.4;
      animal.stats.happiness = Math.random() * 0.3;
      animal.needs.food = Math.random() * 0.3;
      animal.needs.medicine = Math.random() * 0.2;
      if (state.animals.length < state.maxAnimals) {
        state.animals.push(animal);
        state.tickerMessages.push(`Ausgesetztes Tier gefunden: ${animal.name} (${animal.species})`);
      }
      break;
    }

    case 'disease':
      for (const animal of state.animals) {
        if (Math.random() < 0.5) {
          animal.stats.health = Math.max(0, animal.stats.health - 0.2 - Math.random() * 0.2);
          animal.needs.medicine = Math.max(0, animal.needs.medicine - 0.3);
        }
      }
      state.tickerMessages.push("Krankheitsausbruch! Mehrere Tiere betroffen.");
      break;

    case 'celebrity': {
      const bonus = 10 + Math.floor(Math.random() * 10);
      state.reputation = Math.min(BALANCING.maxReputation, state.reputation + bonus);
      state.money += 500 + Math.floor(Math.random() * 500);
      state.tickerMessages.push("Promi-Besuch! Reputation und Spende erhalten.");
      break;
    }

    case 'donation': {
      const amount = BALANCING.donationBase * (2 + Math.floor(Math.random() * 5));
      state.money += amount;
      state.tickerMessages.push(`Spende erhalten: $${amount}`);
      break;
    }

    case 'pressReport': {
      const positive = state.reputation > 50;
      const repChange = positive ? 5 : -5;
      state.reputation = Math.max(0, Math.min(BALANCING.maxReputation, state.reputation + repChange));
      state.tickerMessages.push(positive ? "Positiver Pressebericht!" : "Negativer Pressebericht!");
      break;
    }
  }
}
