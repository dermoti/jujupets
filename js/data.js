export const PERSONALITY_AXES = [
  { id: "energy",      labelLow: "Ruhig",      labelHigh: "Aktiv" },
  { id: "confidence",  labelLow: "Scheu",       labelHigh: "Zutraulich" },
  { id: "playfulness", labelLow: "Gemütlich",   labelHigh: "Verspielt" },
  { id: "obedience",   labelLow: "Eigensinnig", labelHigh: "Folgsam" },
];

export const NEEDS = ["food", "medicine", "exercise", "attention"];

export const SPECIES = {
  dog: {
    name: "Hund",
    unlockYear: 0,
    needWeights: { food: 1.2, medicine: 0.8, exercise: 1.5, attention: 1.0 },
    baseAdoptionFee: 150,
  },
  cat: {
    name: "Katze",
    unlockYear: 0,
    needWeights: { food: 1.0, medicine: 0.7, exercise: 0.8, attention: 1.3 },
    baseAdoptionFee: 120,
  },
  rabbit: {
    name: "Kaninchen",
    unlockYear: 3,
    needWeights: { food: 1.0, medicine: 0.6, exercise: 0.9, attention: 1.1 },
    baseAdoptionFee: 80,
  },
  smallpet: {
    name: "Kleintier",
    unlockYear: 5,
    needWeights: { food: 0.8, medicine: 0.5, exercise: 0.5, attention: 1.2 },
    baseAdoptionFee: 60,
  },
  bird: {
    name: "Vogel",
    unlockYear: 7,
    needWeights: { food: 0.7, medicine: 0.4, exercise: 0.3, attention: 1.4 },
    baseAdoptionFee: 70,
  },
};

export const STAFF_ROLES = {
  caretaker: {
    name: "Pfleger",
    unlockYear: 0,
    salary: 200,
    skills: ["feed", "clean"],
    statEffects: { food: 1.0, attention: 0.5 },
  },
  vet: {
    name: "Tierarzt",
    unlockYear: 3,
    salary: 400,
    skills: ["treat", "vaccinate"],
    statEffects: { medicine: 1.0, health: 0.8 },
  },
  trainer: {
    name: "Trainer",
    unlockYear: 5,
    salary: 350,
    skills: ["train", "socialize"],
    statEffects: { training: 1.0, social: 0.7 },
  },
  matchmaker: {
    name: "Vermittler",
    unlockYear: 7,
    salary: 300,
    skills: ["match", "consult"],
    statEffects: { matchBonus: 0.15 },
  },
};

export const OWNER_PROFILES = {
  housing: ["apartment", "house", "garden"],
  experience: ["firstTime", "experienced"],
  household: ["children", "single", "seniors"],
};

export const EVENT_TYPES = {
  planned: {
    adoptionFest: { name: "Adoptionsfest",        interval: "monthly" },
    inspection:   { name: "Tierschutz-Inspektion", interval: "quarterly" },
  },
  random: {
    strayAnimal: { name: "Ausgesetztes Tier",  weight: 3 },
    disease:     { name: "Krankheitsausbruch", weight: 1 },
    celebrity:   { name: "Promi-Besuch",       weight: 1 },
    donation:    { name: "Spenden-Aktion",     weight: 2 },
    pressReport: { name: "Pressebericht",      weight: 2 },
  },
};

export const BALANCING = {
  // Time
  ticksPerDay:    24,
  daysPerWeek:    7,
  weeksPerMonth:  4,
  monthsPerYear:  12,
  totalYears:     20,
  msPerTick:      250,

  // Economy
  startingMoney:    2000,
  adoptionFeeBase:  100,
  dailyFoodCost:    5,
  dailyMedicineCost: 10,
  donationBase:     50,

  // Reputation
  startingReputation:  10,
  maxReputation:       100,
  adoptionRepGood:     3,
  adoptionRepPerfect:  8,
  adoptionRepBad:      -5,
  returnRepPenalty:    -10,

  // Animals
  maxAnimalsStart:    6,
  needDecayPerTick:   0.02,
  happinessFromCare:  0.05,

  // Staff
  maxEnergyBase:       100,
  energyRegenPerTick:  0.5,
  energyCostPerAction: 15,
  xpPerAction:         10,
  xpPerLevel:          100,

  // Matching
  matchWeightPersonality: 0.40,
  matchWeightTraining:    0.25,
  matchWeightHealth:      0.20,
  matchWeightStaff:       0.15,
  matchThresholdPerfect:  85,
  matchThresholdGood:     60,
  returnRiskBadMatch:     0.3,

  // Owners
  ownerSpawnBaseChance: 0.1,
  ownerSpawnRepBonus:   0.005,
  ownerPatienceDays:    14,

  // Random events
  randomEventChancePerDay: 0.05,
};
