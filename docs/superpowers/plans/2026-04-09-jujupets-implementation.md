# JujuPets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Kairosoft-style real-time animal shelter management sim with pixel-art graphics, playable in a web browser with no build step.

**Architecture:** ES modules (`<script type="module">`) for all JS. Canvas (480x320, scaled) for the pixel-art shelter view. DOM overlays for UI. Central game state object drives simulation ticks. Game loop via requestAnimationFrame with configurable speed. LocalStorage for persistence.

**Tech Stack:** Vanilla HTML5/CSS/JS, Canvas 2D API, ES Modules, LocalStorage

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Entry point: canvas element, DOM overlay containers, loads `js/main.js` |
| `css/style.css` | Pixel-art themed UI: stats bar, side panel, ticker, dialogs, buttons |
| `js/main.js` | Bootstrap: creates engine, state, renderer, ui, simulation; starts game loop |
| `js/engine.js` | Game loop (rAF), delta time, speed control (pause/x1/x2/x3), tick dispatch |
| `js/state.js` | Central game state object, save/load to LocalStorage, JSON export, new game factory |
| `js/data.js` | Static data: animal species configs, personality axes, staff role definitions, owner profile templates, event definitions, balancing constants |
| `js/animals.js` | Animal factory, stat/need update logic per tick, personality generation |
| `js/staff.js` | Staff factory, assignment logic, energy drain/regen, leveling, work effects |
| `js/simulation.js` | Orchestrates one sim tick: updates animals, staff, spawns owners, fires events, checks milestones |
| `js/matching.js` | Owner generation, matching score calculation, adoption execution, return risk |
| `js/events.js` | Event scheduler (planned) + random event roller, event effect application |
| `js/progression.js` | Milestone tracking, unlock conditions, year-based feature gates, endgame/endless transition |
| `js/renderer.js` | Canvas rendering: shelter grid, animal sprites, staff sprites, animations |
| `js/ui.js` | DOM overlay management: stats bar, side panel, action buttons, ticker, popup dialogs |
| `js/test-runner.js` | Minimal browser test runner: assert functions, suite/test registration, HTML output |
| `test.html` | Loads test-runner + test modules, displays results |
| `tests/data.test.js` | Tests for data.js integrity |
| `tests/animals.test.js` | Tests for animal creation and tick logic |
| `tests/staff.test.js` | Tests for staff creation and work logic |
| `tests/matching.test.js` | Tests for matching score calculation and adoption |
| `tests/simulation.test.js` | Tests for simulation tick orchestration |
| `tests/state.test.js` | Tests for save/load and state management |
| `tests/events.test.js` | Tests for event scheduling and effects |
| `tests/progression.test.js` | Tests for milestone unlocks |
| `tests/engine.test.js` | Tests for engine speed control and tick accumulation |
| `tests/renderer.test.js` | Tests for renderer layout calculations and draw dispatch |
| `tests/ui.test.js` | Tests for UI formatting logic (date, money, match display) |
| `tests/integration.test.js` | Tests for full game loop: bootstrap → tick → state changes |

---

### Task 1: Test Runner + Project Scaffold

**Files:**
- Create: `js/test-runner.js`
- Create: `test.html`
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: Create the test runner module**

```js
// js/test-runner.js
const suites = [];
let currentSuite = null;

export function describe(name, fn) {
  currentSuite = { name, tests: [], passed: 0, failed: 0 };
  suites.push(currentSuite);
  fn();
  currentSuite = null;
}

export function it(name, fn) {
  const test = { name, error: null };
  try {
    fn();
    currentSuite.passed++;
  } catch (e) {
    test.error = e.message;
    currentSuite.failed++;
  }
  currentSuite.tests.push(test);
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected, tolerance = 0.01) {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ~${expected} (±${tolerance}), got ${actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(item)}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new Error(`Expected ${b}, got ${a}`);
      }
    },
  };
}

export function runAll() {
  const container = document.getElementById("test-results");
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    totalPassed += suite.passed;
    totalFailed += suite.failed;

    const section = document.createElement("details");
    section.open = suite.failed > 0;
    const summary = document.createElement("summary");
    summary.textContent = `${suite.failed ? "❌" : "✅"} ${suite.name} (${suite.passed}/${suite.tests.length})`;
    summary.style.color = suite.failed ? "#ef4444" : "#4ade80";
    summary.style.cursor = "pointer";
    section.appendChild(summary);

    for (const test of suite.tests) {
      const div = document.createElement("div");
      div.style.marginLeft = "20px";
      if (test.error) {
        div.textContent = `  ❌ ${test.name}: ${test.error}`;
        div.style.color = "#ef4444";
      } else {
        div.textContent = `  ✅ ${test.name}`;
        div.style.color = "#4ade80";
      }
      section.appendChild(div);
    }
    container.appendChild(section);
  }

  const header = document.getElementById("test-header");
  header.textContent = `Tests: ${totalPassed} passed, ${totalFailed} failed, ${totalPassed + totalFailed} total`;
  header.style.color = totalFailed ? "#ef4444" : "#4ade80";
}
```

- [ ] **Step 2: Create test.html**

```html
<!-- test.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>JujuPets Tests</title>
  <style>
    body { background: #1a1a2e; color: #eee; font-family: monospace; padding: 20px; }
    h1 { color: #ffd700; }
    details { margin: 8px 0; }
  </style>
</head>
<body>
  <h1>JujuPets Test Suite</h1>
  <h2 id="test-header">Running...</h2>
  <div id="test-results"></div>
  <script type="module">
    // Test modules will be imported here as they are created
    import { runAll } from './js/test-runner.js';
    runAll();
  </script>
</body>
</html>
```

- [ ] **Step 3: Open test.html in a browser and verify it loads**

Run: Open `test.html` via a local HTTP server (e.g., `python3 -m http.server 8080` then visit `http://localhost:8080/test.html`).
Expected: Page shows "Tests: 0 passed, 0 failed, 0 total" with no errors in console.

- [ ] **Step 4: Create index.html with canvas + DOM overlay structure**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JujuPets</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="game-container">
    <div id="stats-bar">
      <span id="stat-money">$0</span>
      <span id="stat-reputation">Rep: 0</span>
      <span id="stat-date">Jahr 1 - Jan W1</span>
      <div id="speed-controls">
        <button data-speed="0" class="speed-btn">⏸</button>
        <button data-speed="1" class="speed-btn active">▶</button>
        <button data-speed="2" class="speed-btn">▶▶</button>
        <button data-speed="3" class="speed-btn">▶▶▶</button>
      </div>
    </div>
    <div id="main-area">
      <canvas id="shelter-canvas" width="480" height="320"></canvas>
      <div id="side-panel">
        <div id="panel-staff" class="panel-section">
          <h3>Personal</h3>
          <div id="staff-list"></div>
        </div>
        <div id="panel-applicants" class="panel-section">
          <h3>Bewerber</h3>
          <div id="applicant-list"></div>
        </div>
        <div id="panel-actions" class="panel-section">
          <button class="action-btn" data-action="intake">Aufnehmen</button>
          <button class="action-btn" data-action="adopt">Vermitteln</button>
          <button class="action-btn" data-action="shop">Einkaufen</button>
          <button class="action-btn" data-action="staff">Personal</button>
        </div>
      </div>
    </div>
    <div id="event-ticker"></div>
  </div>
  <div id="dialog-overlay" class="hidden">
    <div id="dialog-box">
      <h3 id="dialog-title"></h3>
      <div id="dialog-content"></div>
      <div id="dialog-buttons"></div>
    </div>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create css/style.css with pixel-art themed layout**

```css
/* css/style.css */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0f0f23;
  color: #eee;
  font-family: "Courier New", monospace;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

#game-container {
  width: 720px;
  background: #1a1a2e;
  border: 2px solid #333;
  border-radius: 4px;
}

/* Stats bar */
#stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  background: #16213e;
  border-bottom: 2px solid #333;
  font-size: 13px;
  color: #ffd700;
}

#speed-controls {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.speed-btn {
  background: #2a2a4a;
  color: #888;
  border: 1px solid #444;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  border-radius: 2px;
}

.speed-btn.active {
  background: #4a4a7a;
  color: #ffd700;
  border-color: #ffd700;
}

/* Main area */
#main-area {
  display: flex;
}

#shelter-canvas {
  display: block;
  width: 480px;
  height: 320px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  background: #2a2a4a;
}

#side-panel {
  width: 240px;
  padding: 8px;
  background: #16213e;
  border-left: 2px solid #333;
  font-size: 12px;
  overflow-y: auto;
  max-height: 320px;
}

.panel-section {
  margin-bottom: 10px;
}

.panel-section h3 {
  color: #ffd700;
  font-size: 12px;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.action-btn {
  display: block;
  width: 100%;
  padding: 6px;
  margin-bottom: 4px;
  background: #2a2a4a;
  color: #eee;
  border: 1px solid #444;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  border-radius: 2px;
  text-align: left;
}

.action-btn:hover {
  background: #3a3a5a;
  border-color: #ffd700;
  color: #ffd700;
}

/* Event ticker */
#event-ticker {
  padding: 4px 12px;
  background: #16213e;
  border-top: 2px solid #333;
  font-size: 11px;
  color: #fbbf24;
  min-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dialog */
#dialog-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

#dialog-overlay.hidden { display: none; }

#dialog-box {
  background: #1a1a2e;
  border: 2px solid #ffd700;
  border-radius: 4px;
  padding: 16px;
  max-width: 400px;
  width: 90%;
}

#dialog-title {
  color: #ffd700;
  margin-bottom: 8px;
}

#dialog-content {
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
}

#dialog-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

#dialog-buttons button {
  padding: 6px 16px;
  background: #2a2a4a;
  color: #eee;
  border: 1px solid #444;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  border-radius: 2px;
}

#dialog-buttons button:hover {
  background: #4a4a7a;
  border-color: #ffd700;
  color: #ffd700;
}

/* Utility */
.hidden { display: none !important; }
.stat-bar {
  display: inline-block;
  height: 6px;
  border-radius: 1px;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.3s;
}
```

- [ ] **Step 6: Create js/main.js stub**

```js
// js/main.js
// Bootstrap — will wire up engine, state, renderer, ui, simulation
console.log("JujuPets loaded");
```

- [ ] **Step 7: Verify index.html renders the game layout**

Run: Start `python3 -m http.server 8080` and open `http://localhost:8080`.
Expected: Dark themed game layout with stats bar (showing $0, Rep: 0, speed buttons), canvas area (dark purple), side panel with section headers and action buttons, event ticker at bottom. Console shows "JujuPets loaded".

- [ ] **Step 8: Commit**

```bash
git add index.html css/style.css js/main.js js/test-runner.js test.html
git commit -m "feat: project scaffold with game layout and test runner"
```

---

### Task 2: Static Data Definitions

**Files:**
- Create: `js/data.js`
- Create: `tests/data.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write data integrity tests**

```js
// tests/data.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { SPECIES, PERSONALITY_AXES, STAFF_ROLES, NEEDS, BALANCING } from '../js/data.js';

describe('SPECIES', () => {
  it('has 5 species', () => {
    expect(Object.keys(SPECIES).length).toBe(5);
  });

  it('dog and cat are unlocked at year 0', () => {
    expect(SPECIES.dog.unlockYear).toBe(0);
    expect(SPECIES.cat.unlockYear).toBe(0);
  });

  it('each species has name, unlockYear, and needWeights', () => {
    for (const [key, species] of Object.entries(SPECIES)) {
      expect(typeof species.name).toBe('string');
      expect(typeof species.unlockYear).toBe('number');
      expect(typeof species.needWeights).toBe('object');
      expect(typeof species.needWeights.food).toBe('number');
      expect(typeof species.needWeights.medicine).toBe('number');
      expect(typeof species.needWeights.exercise).toBe('number');
      expect(typeof species.needWeights.attention).toBe('number');
    }
  });
});

describe('PERSONALITY_AXES', () => {
  it('has 4 axes', () => {
    expect(PERSONALITY_AXES.length).toBe(4);
  });

  it('each axis has id, labelLow, labelHigh', () => {
    for (const axis of PERSONALITY_AXES) {
      expect(typeof axis.id).toBe('string');
      expect(typeof axis.labelLow).toBe('string');
      expect(typeof axis.labelHigh).toBe('string');
    }
  });
});

describe('STAFF_ROLES', () => {
  it('has 4 roles', () => {
    expect(Object.keys(STAFF_ROLES).length).toBe(4);
  });

  it('caretaker is unlocked at year 0', () => {
    expect(STAFF_ROLES.caretaker.unlockYear).toBe(0);
  });

  it('each role has name, unlockYear, salary, skills', () => {
    for (const [key, role] of Object.entries(STAFF_ROLES)) {
      expect(typeof role.name).toBe('string');
      expect(typeof role.unlockYear).toBe('number');
      expect(typeof role.salary).toBe('number');
      expect(Array.isArray(role.skills)).toBeTruthy();
    }
  });
});

describe('BALANCING', () => {
  it('has tick and adoption config', () => {
    expect(typeof BALANCING.ticksPerDay).toBe('number');
    expect(typeof BALANCING.daysPerWeek).toBe('number');
    expect(typeof BALANCING.weeksPerMonth).toBe('number');
    expect(typeof BALANCING.monthsPerYear).toBe('number');
    expect(typeof BALANCING.startingMoney).toBe('number');
    expect(typeof BALANCING.adoptionFeeBase).toBe('number');
  });
});
```

- [ ] **Step 2: Add test import to test.html**

Update the `<script>` block in `test.html`:

```html
<script type="module">
  import './tests/data.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Open `http://localhost:8080/test.html`
Expected: Import errors — `js/data.js` does not exist yet.

- [ ] **Step 4: Implement js/data.js**

```js
// js/data.js

export const PERSONALITY_AXES = [
  { id: "energy",     labelLow: "Ruhig",      labelHigh: "Aktiv" },
  { id: "confidence", labelLow: "Scheu",       labelHigh: "Zutraulich" },
  { id: "playfulness",labelLow: "Gemütlich",   labelHigh: "Verspielt" },
  { id: "obedience",  labelLow: "Eigensinnig", labelHigh: "Folgsam" },
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
    adoptionFest:  { name: "Adoptionsfest",        interval: "monthly" },
    inspection:    { name: "Tierschutz-Inspektion", interval: "quarterly" },
  },
  random: {
    strayAnimal:   { name: "Ausgesetztes Tier",  weight: 3 },
    disease:       { name: "Krankheitsausbruch",  weight: 1 },
    celebrity:     { name: "Promi-Besuch",        weight: 1 },
    donation:      { name: "Spenden-Aktion",      weight: 2 },
    pressReport:   { name: "Pressebericht",       weight: 2 },
  },
};

export const BALANCING = {
  // Time
  ticksPerDay: 24,
  daysPerWeek: 7,
  weeksPerMonth: 4,
  monthsPerYear: 12,
  totalYears: 20,
  msPerTick: 250,          // at speed x1: 1 tick every 250ms → 1 day = 6 seconds

  // Economy
  startingMoney: 2000,
  adoptionFeeBase: 100,
  dailyFoodCost: 5,
  dailyMedicineCost: 10,
  donationBase: 50,

  // Reputation
  startingReputation: 10,
  maxReputation: 100,
  adoptionRepGood: 3,
  adoptionRepPerfect: 8,
  adoptionRepBad: -5,
  returnRepPenalty: -10,

  // Animals
  maxAnimalsStart: 6,
  needDecayPerTick: 0.02,
  happinessFromCare: 0.05,

  // Staff
  maxEnergyBase: 100,
  energyRegenPerTick: 0.5,
  energyCostPerAction: 15,
  xpPerAction: 10,
  xpPerLevel: 100,

  // Matching
  matchWeightPersonality: 0.40,
  matchWeightTraining: 0.25,
  matchWeightHealth: 0.20,
  matchWeightStaff: 0.15,
  matchThresholdPerfect: 85,
  matchThresholdGood: 60,
  returnRiskBadMatch: 0.3,

  // Owners
  ownerSpawnBaseChance: 0.1,
  ownerSpawnRepBonus: 0.005,
  ownerPatienceDays: 14,

  // Random events
  randomEventChancePerDay: 0.05,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All tests green. "Tests: N passed, 0 failed"

- [ ] **Step 6: Commit**

```bash
git add js/data.js tests/data.test.js test.html
git commit -m "feat: add static game data definitions with species, staff, events, balancing"
```

---

### Task 3: Game Engine (Loop + Time)

**Files:**
- Create: `js/engine.js`
- Create: `tests/engine.test.js`
- Modify: `test.html`

To make the engine testable without `requestAnimationFrame`, we extract the tick-accumulation logic into a pure `computeTicks(dt, speed, msPerTick, accumulator)` function and test that separately. The rAF loop just calls it.

- [ ] **Step 1: Write engine tests**

```js
// tests/engine.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createEngine, computeTicks } from '../js/engine.js';

describe('computeTicks', () => {
  it('returns 0 ticks when dt is less than msPerTick', () => {
    const result = computeTicks(100, 1, 250, 0);
    expect(result.ticks).toBe(0);
    expect(result.accumulator).toBe(100);
  });

  it('returns 1 tick when dt equals msPerTick', () => {
    const result = computeTicks(250, 1, 250, 0);
    expect(result.ticks).toBe(1);
    expect(result.accumulator).toBe(0);
  });

  it('returns 2 ticks when dt is double msPerTick', () => {
    const result = computeTicks(500, 1, 250, 0);
    expect(result.ticks).toBe(2);
    expect(result.accumulator).toBe(0);
  });

  it('accumulates remainder across calls', () => {
    const r1 = computeTicks(100, 1, 250, 0);
    expect(r1.ticks).toBe(0);
    expect(r1.accumulator).toBe(100);
    const r2 = computeTicks(200, 1, 250, r1.accumulator);
    expect(r2.ticks).toBe(1);
    expect(r2.accumulator).toBe(50);
  });

  it('multiplies dt by speed', () => {
    const result = computeTicks(125, 2, 250, 0);
    expect(result.ticks).toBe(1);
    expect(result.accumulator).toBe(0);
  });

  it('returns 0 ticks at speed 0', () => {
    const result = computeTicks(1000, 0, 250, 0);
    expect(result.ticks).toBe(0);
    expect(result.accumulator).toBe(0);
  });

  it('speed 3 triples effective dt', () => {
    const result = computeTicks(250, 3, 250, 0);
    expect(result.ticks).toBe(3);
    expect(result.accumulator).toBe(0);
  });
});

describe('createEngine', () => {
  it('starts with running false', () => {
    const engine = createEngine();
    expect(engine.running).toBe(false);
  });

  it('defaults to speed 1', () => {
    const engine = createEngine();
    expect(engine.getSpeed()).toBe(1);
  });

  it('clamps speed to 0-3', () => {
    const engine = createEngine();
    engine.setSpeed(-1);
    expect(engine.getSpeed()).toBe(0);
    engine.setSpeed(5);
    expect(engine.getSpeed()).toBe(3);
    engine.setSpeed(2);
    expect(engine.getSpeed()).toBe(2);
  });

  it('sets running to true after start', () => {
    const engine = createEngine();
    engine.start();
    expect(engine.running).toBe(true);
    engine.stop();
  });

  it('sets running to false after stop', () => {
    const engine = createEngine();
    engine.start();
    engine.stop();
    expect(engine.running).toBe(false);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/engine.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/engine.js` does not export `computeTicks`.

- [ ] **Step 4: Implement js/engine.js**

```js
// js/engine.js

// Pure function — testable without rAF
export function computeTicks(dt, speed, msPerTick, accumulator) {
  if (speed === 0) {
    return { ticks: 0, accumulator: 0 };
  }
  accumulator += dt * speed;
  let ticks = 0;
  while (accumulator >= msPerTick) {
    accumulator -= msPerTick;
    ticks++;
  }
  return { ticks, accumulator };
}

export function createEngine() {
  let running = false;
  let speed = 1;            // 0=pause, 1=x1, 2=x2, 3=x3
  let rafId = null;
  let lastTime = 0;
  let tickAccumulator = 0;
  let onTick = null;        // callback: (tickCount) => void
  let onRender = null;      // callback: (dt) => void
  let msPerTick = 250;

  function setMsPerTick(ms) {
    msPerTick = ms;
  }

  function setSpeed(s) {
    speed = Math.max(0, Math.min(3, s));
  }

  function getSpeed() {
    return speed;
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (speed > 0 && onTick) {
      const result = computeTicks(dt, speed, msPerTick, tickAccumulator);
      tickAccumulator = result.accumulator;
      if (result.ticks > 0) {
        onTick(result.ticks);
      }
    }

    if (onRender) {
      onRender(dt);
    }

    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    tickAccumulator = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    start,
    stop,
    setSpeed,
    getSpeed,
    setMsPerTick,
    set onTick(fn) { onTick = fn; },
    set onRender(fn) { onRender = fn; },
    get running() { return running; },
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All engine tests green.

- [ ] **Step 6: Commit**

```bash
git add js/engine.js tests/engine.test.js test.html
git commit -m "feat: add game engine with testable tick accumulation and speed control"
```

---

### Task 4: Game State + Save/Load

**Files:**
- Create: `js/state.js`
- Create: `tests/state.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write state tests**

```js
// tests/state.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createNewState, saveState, loadState, clearSave } from '../js/state.js';
import { BALANCING } from '../js/data.js';

describe('createNewState', () => {
  it('creates state with starting money', () => {
    const state = createNewState();
    expect(state.money).toBe(BALANCING.startingMoney);
  });

  it('creates state with starting reputation', () => {
    const state = createNewState();
    expect(state.reputation).toBe(BALANCING.startingReputation);
  });

  it('starts at year 1, month 1, week 1, day 1', () => {
    const state = createNewState();
    expect(state.time.year).toBe(1);
    expect(state.time.month).toBe(1);
    expect(state.time.week).toBe(1);
    expect(state.time.day).toBe(1);
  });

  it('starts with empty animals and staff arrays', () => {
    const state = createNewState();
    expect(state.animals.length).toBe(0);
    expect(state.staff.length).toBe(0);
  });

  it('starts with dog and cat unlocked', () => {
    const state = createNewState();
    expect(state.unlockedSpecies).toContain('dog');
    expect(state.unlockedSpecies).toContain('cat');
  });
});

describe('saveState / loadState', () => {
  it('round-trips state through localStorage', () => {
    clearSave();
    const state = createNewState();
    state.money = 9999;
    saveState(state);
    const loaded = loadState();
    expect(loaded.money).toBe(9999);
    clearSave();
  });

  it('returns null when no save exists', () => {
    clearSave();
    const loaded = loadState();
    expect(loaded).toBe(null);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/state.js` does not exist.

- [ ] **Step 4: Implement js/state.js**

```js
// js/state.js
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All state tests green.

- [ ] **Step 6: Commit**

```bash
git add js/state.js tests/state.test.js test.html
git commit -m "feat: add game state with save/load and time advancement"
```

---

### Task 5: Animal System

**Files:**
- Create: `js/animals.js`
- Create: `tests/animals.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write animal tests**

```js
// tests/animals.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createAnimal, tickAnimal } from '../js/animals.js';
import { BALANCING } from '../js/data.js';

describe('createAnimal', () => {
  it('creates a dog with all required fields', () => {
    const animal = createAnimal('dog', 1);
    expect(animal.species).toBe('dog');
    expect(animal.id).toBe(1);
    expect(typeof animal.name).toBe('string');
    expect(typeof animal.stats.health).toBe('number');
    expect(typeof animal.stats.happiness).toBe('number');
    expect(typeof animal.stats.training).toBe('number');
    expect(typeof animal.stats.social).toBe('number');
  });

  it('has needs between 0 and 1', () => {
    const animal = createAnimal('cat', 2);
    expect(animal.needs.food >= 0 && animal.needs.food <= 1).toBeTruthy();
    expect(animal.needs.medicine >= 0 && animal.needs.medicine <= 1).toBeTruthy();
    expect(animal.needs.exercise >= 0 && animal.needs.exercise <= 1).toBeTruthy();
    expect(animal.needs.attention >= 0 && animal.needs.attention <= 1).toBeTruthy();
  });

  it('has personality values between 0 and 1', () => {
    const animal = createAnimal('dog', 3);
    expect(typeof animal.personality.energy).toBe('number');
    expect(typeof animal.personality.confidence).toBe('number');
    expect(typeof animal.personality.playfulness).toBe('number');
    expect(typeof animal.personality.obedience).toBe('number');
    expect(animal.personality.energy >= 0 && animal.personality.energy <= 1).toBeTruthy();
  });
});

describe('tickAnimal', () => {
  it('decreases needs over time', () => {
    const animal = createAnimal('dog', 4);
    animal.needs.food = 0.8;
    const before = animal.needs.food;
    tickAnimal(animal);
    expect(animal.needs.food).toBeLessThan(before);
  });

  it('decreases happiness when needs are low', () => {
    const animal = createAnimal('dog', 5);
    animal.needs.food = 0.0;
    animal.needs.medicine = 0.0;
    animal.needs.exercise = 0.0;
    animal.needs.attention = 0.0;
    animal.stats.happiness = 0.5;
    tickAnimal(animal);
    expect(animal.stats.happiness).toBeLessThan(0.5);
  });

  it('clamps needs to 0 minimum', () => {
    const animal = createAnimal('dog', 6);
    animal.needs.food = 0.001;
    for (let i = 0; i < 100; i++) tickAnimal(animal);
    expect(animal.needs.food >= 0).toBeTruthy();
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/animals.js` does not exist.

- [ ] **Step 4: Implement js/animals.js**

```js
// js/animals.js
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

  // Decay needs based on species weights
  for (const need of ["food", "medicine", "exercise", "attention"]) {
    const weight = species.needWeights[need];
    animal.needs[need] = Math.max(0, animal.needs[need] - BALANCING.needDecayPerTick * weight);
  }

  // Happiness changes based on average need satisfaction
  const avgNeed = (animal.needs.food + animal.needs.medicine + animal.needs.exercise + animal.needs.attention) / 4;
  if (avgNeed < 0.3) {
    animal.stats.happiness = Math.max(0, animal.stats.happiness - 0.01);
  } else if (avgNeed > 0.7) {
    animal.stats.happiness = Math.min(1, animal.stats.happiness + BALANCING.happinessFromCare * 0.2);
  }

  // Health degrades if medicine need is very low
  if (animal.needs.medicine < 0.15) {
    animal.stats.health = Math.max(0, animal.stats.health - 0.005);
  }
}

export function fulfillNeed(animal, need, amount) {
  animal.needs[need] = Math.min(1, animal.needs[need] + amount);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All animal tests green.

- [ ] **Step 6: Commit**

```bash
git add js/animals.js tests/animals.test.js test.html
git commit -m "feat: add animal system with creation, tick logic, and need fulfillment"
```

---

### Task 6: Staff System

**Files:**
- Create: `js/staff.js`
- Create: `tests/staff.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write staff tests**

```js
// tests/staff.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createStaff, tickStaff, assignStaff, performWork } from '../js/staff.js';
import { createAnimal } from '../js/animals.js';
import { BALANCING } from '../js/data.js';

describe('createStaff', () => {
  it('creates a caretaker with correct role', () => {
    const staff = createStaff('caretaker', 1);
    expect(staff.role).toBe('caretaker');
    expect(staff.level).toBe(1);
    expect(staff.energy).toBe(BALANCING.maxEnergyBase);
  });

  it('has xp starting at 0', () => {
    const staff = createStaff('vet', 2);
    expect(staff.xp).toBe(0);
  });
});

describe('tickStaff', () => {
  it('regenerates energy over time', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = 50;
    tickStaff(staff);
    expect(staff.energy).toBeGreaterThan(50);
  });

  it('caps energy at max', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = BALANCING.maxEnergyBase;
    tickStaff(staff);
    expect(staff.energy).toBe(BALANCING.maxEnergyBase);
  });
});

describe('performWork', () => {
  it('drains energy when working', () => {
    const staff = createStaff('caretaker', 1);
    const animal = createAnimal('dog', 1);
    const before = staff.energy;
    performWork(staff, animal);
    expect(staff.energy).toBeLessThan(before);
  });

  it('does not work if energy too low', () => {
    const staff = createStaff('caretaker', 1);
    staff.energy = 0;
    const animal = createAnimal('dog', 1);
    animal.needs.food = 0.2;
    const before = animal.needs.food;
    const worked = performWork(staff, animal);
    expect(worked).toBeFalsy();
    expect(animal.needs.food).toBe(before);
  });

  it('gains xp when working', () => {
    const staff = createStaff('caretaker', 1);
    const animal = createAnimal('dog', 1);
    performWork(staff, animal);
    expect(staff.xp).toBeGreaterThan(0);
  });

  it('levels up when reaching xp threshold', () => {
    const staff = createStaff('caretaker', 1);
    staff.xp = BALANCING.xpPerLevel - 1;
    const animal = createAnimal('dog', 1);
    performWork(staff, animal);
    expect(staff.level).toBe(2);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/staff.js` does not exist.

- [ ] **Step 4: Implement js/staff.js**

```js
// js/staff.js
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

  // Apply role-specific effects
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

  // Gain XP
  staff.xp += BALANCING.xpPerAction;
  if (staff.xp >= BALANCING.xpPerLevel) {
    staff.xp -= BALANCING.xpPerLevel;
    staff.level++;
  }

  return true;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All staff tests green.

- [ ] **Step 6: Commit**

```bash
git add js/staff.js tests/staff.test.js test.html
git commit -m "feat: add staff system with roles, energy, leveling, and work effects"
```

---

### Task 7: Matching & Adoption

**Files:**
- Create: `js/matching.js`
- Create: `tests/matching.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write matching tests**

```js
// tests/matching.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createOwner, calculateMatchScore, executeAdoption } from '../js/matching.js';
import { createAnimal } from '../js/animals.js';
import { createNewState } from '../js/state.js';
import { BALANCING } from '../js/data.js';

describe('createOwner', () => {
  it('creates an owner with personality preferences', () => {
    const owner = createOwner(1);
    expect(typeof owner.preferences.energy).toBe('number');
    expect(typeof owner.preferences.confidence).toBe('number');
    expect(typeof owner.preferences.playfulness).toBe('number');
    expect(typeof owner.preferences.obedience).toBe('number');
  });

  it('has a profile with housing, experience, household', () => {
    const owner = createOwner(2);
    expect(typeof owner.profile.housing).toBe('string');
    expect(typeof owner.profile.experience).toBe('string');
    expect(typeof owner.profile.household).toBe('string');
  });

  it('has a patience value in days', () => {
    const owner = createOwner(3);
    expect(owner.patienceDays).toBeGreaterThan(0);
  });
});

describe('calculateMatchScore', () => {
  it('returns a score between 0 and 100', () => {
    const animal = createAnimal('dog', 1);
    const owner = createOwner(1);
    const score = calculateMatchScore(animal, owner, 0);
    expect(score >= 0).toBeTruthy();
    expect(score <= 100).toBeTruthy();
  });

  it('higher score when personality matches', () => {
    const animal = createAnimal('dog', 1);
    animal.personality = { energy: 0.8, confidence: 0.7, playfulness: 0.9, obedience: 0.6 };
    const matchingOwner = createOwner(1);
    matchingOwner.preferences = { energy: 0.8, confidence: 0.7, playfulness: 0.9, obedience: 0.6 };
    const mismatchOwner = createOwner(2);
    mismatchOwner.preferences = { energy: 0.1, confidence: 0.2, playfulness: 0.1, obedience: 0.9 };

    const goodScore = calculateMatchScore(animal, matchingOwner, 0);
    const badScore = calculateMatchScore(animal, mismatchOwner, 0);
    expect(goodScore).toBeGreaterThan(badScore);
  });

  it('trained animals score higher', () => {
    const trained = createAnimal('dog', 1);
    trained.stats.training = 1.0;
    trained.stats.health = 1.0;
    trained.stats.happiness = 1.0;
    const untrained = createAnimal('dog', 2);
    untrained.stats.training = 0.0;
    untrained.stats.health = 1.0;
    untrained.stats.happiness = 1.0;
    untrained.personality = { ...trained.personality };

    const owner = createOwner(1);
    owner.preferences = { ...trained.personality };
    const scoreTrained = calculateMatchScore(trained, owner, 0);
    const scoreUntrained = calculateMatchScore(untrained, owner, 0);
    expect(scoreTrained).toBeGreaterThan(scoreUntrained);
  });
});

describe('executeAdoption', () => {
  it('removes animal from state and adds money for good match', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    animal.stats = { health: 1, happiness: 1, training: 1, social: 1 };
    const owner = createOwner(1);
    owner.preferences = { ...animal.personality };
    const moneyBefore = state.money;

    executeAdoption(state, animal, owner, 80);

    expect(state.animals.length).toBe(0);
    expect(state.money).toBeGreaterThan(moneyBefore);
    expect(state.totalAdoptions).toBe(1);
  });

  it('penalizes reputation for bad match', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    const owner = createOwner(1);
    const repBefore = state.reputation;

    executeAdoption(state, animal, owner, 40);

    expect(state.reputation).toBeLessThan(repBefore);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import './tests/matching.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/matching.js` does not exist.

- [ ] **Step 4: Implement js/matching.js**

```js
// js/matching.js
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
  const species = SPECIES[animal.species];

  // Big/active dogs need space
  if (animal.species === 'dog' && animal.personality.energy > 0.7 && owner.profile.housing === 'apartment') {
    modifier -= 10;
  }
  // Stubborn animals are hard for first-timers
  if (animal.personality.obedience < 0.3 && owner.profile.experience === 'firstTime') {
    modifier -= 8;
  }
  // Shy animals struggle with children
  if (animal.personality.confidence < 0.3 && owner.profile.household === 'children') {
    modifier -= 8;
  }
  // Active dogs great with families
  if (animal.species === 'dog' && animal.personality.energy > 0.6 && owner.profile.household === 'children') {
    modifier += 5;
  }
  // Calm animals good for seniors
  if (animal.personality.energy < 0.4 && owner.profile.household === 'seniors') {
    modifier += 5;
  }

  return Math.max(0, Math.min(100, score + modifier));
}

export function executeAdoption(state, animal, owner, matchScore) {
  // Remove animal from shelter
  state.animals = state.animals.filter(a => a.id !== animal.id);

  // Calculate fee
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
    // Risk of return
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

  // Remove owner from waiting list
  state.owners = state.owners.filter(o => o.id !== owner.id);

  return { fee: Math.floor(fee), repChange, matchScore };
}

export function shouldSpawnOwner(state) {
  const chance = BALANCING.ownerSpawnBaseChance + (state.reputation * BALANCING.ownerSpawnRepBonus);
  return Math.random() < chance;
}

export function tickOwners(state) {
  // Age out impatient owners
  for (const owner of state.owners) {
    owner.daysWaiting++;
  }
  state.owners = state.owners.filter(o => o.daysWaiting < o.patienceDays);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All matching tests green.

- [ ] **Step 6: Commit**

```bash
git add js/matching.js tests/matching.test.js test.html
git commit -m "feat: add matching system with owner generation, score calculation, adoption"
```

---

### Task 8: Events System

**Files:**
- Create: `js/events.js`
- Create: `tests/events.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write event tests**

```js
// tests/events.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { checkPlannedEvents, rollRandomEvent, applyEvent } from '../js/events.js';
import { createNewState } from '../js/state.js';

describe('checkPlannedEvents', () => {
  it('fires adoption fest on first day of each month', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const fest = events.find(e => e.type === 'adoptionFest');
    expect(fest !== undefined).toBeTruthy();
  });

  it('fires inspection every 3 months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 3, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection !== undefined).toBeTruthy();
  });

  it('does not fire inspection on non-quarter months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection === undefined).toBeTruthy();
  });
});

describe('applyEvent', () => {
  it('stray animal adds an animal to state', () => {
    const state = createNewState();
    const animalCountBefore = state.animals.length;
    applyEvent(state, { type: 'strayAnimal' });
    expect(state.animals.length).toBe(animalCountBefore + 1);
  });

  it('donation adds money', () => {
    const state = createNewState();
    const moneyBefore = state.money;
    applyEvent(state, { type: 'donation' });
    expect(state.money).toBeGreaterThan(moneyBefore);
  });

  it('disease reduces health of animals', () => {
    const state = createNewState();
    const { createAnimal } = await import('../js/animals.js');
    const animal = createAnimal('dog', state.nextId++);
    animal.stats.health = 1.0;
    state.animals.push(animal);
    applyEvent(state, { type: 'disease' });
    expect(state.animals[0].stats.health).toBeLessThan(1.0);
  });
});
```

Wait — the `await import()` won't work in a synchronous test. Let me fix the test.

- [ ] **Step 1 (revised): Write event tests without dynamic import**

```js
// tests/events.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { checkPlannedEvents, rollRandomEvent, applyEvent } from '../js/events.js';
import { createAnimal } from '../js/animals.js';
import { createNewState } from '../js/state.js';

describe('checkPlannedEvents', () => {
  it('fires adoption fest on first day of each month', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const fest = events.find(e => e.type === 'adoptionFest');
    expect(fest !== undefined).toBeTruthy();
  });

  it('fires inspection every 3 months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 3, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection !== undefined).toBeTruthy();
  });

  it('does not fire inspection on non-quarter months', () => {
    const state = createNewState();
    state.time = { year: 1, month: 2, week: 1, day: 1, tick: 0 };
    const events = checkPlannedEvents(state);
    const inspection = events.find(e => e.type === 'inspection');
    expect(inspection === undefined).toBeTruthy();
  });
});

describe('applyEvent', () => {
  it('stray animal adds an animal to state', () => {
    const state = createNewState();
    const before = state.animals.length;
    applyEvent(state, { type: 'strayAnimal' });
    expect(state.animals.length).toBe(before + 1);
  });

  it('donation adds money', () => {
    const state = createNewState();
    const before = state.money;
    applyEvent(state, { type: 'donation' });
    expect(state.money).toBeGreaterThan(before);
  });

  it('disease reduces health of animals', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.stats.health = 1.0;
    state.animals.push(animal);
    applyEvent(state, { type: 'disease' });
    expect(state.animals[0].stats.health).toBeLessThan(1.0);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import './tests/matching.test.js';
  import './tests/events.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/events.js` does not exist.

- [ ] **Step 4: Implement js/events.js**

```js
// js/events.js
import { EVENT_TYPES, BALANCING } from './data.js';
import { createAnimal } from './animals.js';

export function checkPlannedEvents(state) {
  const events = [];
  const { month, week, day } = state.time;

  // Adoption fest: first day of every month
  if (week === 1 && day === 1) {
    events.push({ type: 'adoptionFest', name: EVENT_TYPES.planned.adoptionFest.name });
  }

  // Inspection: first day of months 3, 6, 9, 12
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
      // Temporarily boost owner spawn rate — handled in simulation tick
      state.tickerMessages.push("Adoptionsfest! Mehr Besucher heute.");
      break;

    case 'inspection': {
      // Score based on average animal happiness and health
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
        repChange > 0
          ? "Inspektion bestanden! Reputation +"  + repChange
          : "Inspektion mangelhaft! Reputation " + repChange
      );
      break;
    }

    case 'strayAnimal': {
      const speciesKeys = state.unlockedSpecies;
      const speciesKey = speciesKeys[Math.floor(Math.random() * speciesKeys.length)];
      const animal = createAnimal(speciesKey, state.nextId++);
      // Stray animals have poor stats
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
      state.tickerMessages.push(
        positive ? "Positiver Pressebericht!" : "Negativer Pressebericht!"
      );
      break;
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All event tests green.

- [ ] **Step 6: Commit**

```bash
git add js/events.js tests/events.test.js test.html
git commit -m "feat: add event system with planned and random events"
```

---

### Task 9: Progression System

**Files:**
- Create: `js/progression.js`
- Create: `tests/progression.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write progression tests**

```js
// tests/progression.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { checkMilestones } from '../js/progression.js';
import { createNewState } from '../js/state.js';

describe('checkMilestones', () => {
  it('does not unlock anything in year 1', () => {
    const state = createNewState();
    state.time.year = 1;
    const unlocked = checkMilestones(state);
    expect(unlocked.length).toBe(0);
  });

  it('unlocks rabbit and vet at year 3', () => {
    const state = createNewState();
    state.time.year = 3;
    const unlocked = checkMilestones(state);
    const types = unlocked.map(u => u.id);
    expect(types).toContain('rabbit');
    expect(types).toContain('vet');
  });

  it('does not re-unlock already unlocked species', () => {
    const state = createNewState();
    state.time.year = 3;
    state.unlockedSpecies.push('rabbit');
    state.unlockedRoles.push('vet');
    const unlocked = checkMilestones(state);
    expect(unlocked.length).toBe(0);
  });

  it('unlocks expansion at year 9', () => {
    const state = createNewState();
    state.time.year = 9;
    // Pre-unlock everything before year 9
    state.unlockedSpecies = ['dog', 'cat', 'rabbit', 'smallpet'];
    state.unlockedRoles = ['caretaker', 'vet', 'trainer', 'matchmaker'];
    const unlocked = checkMilestones(state);
    const types = unlocked.map(u => u.id);
    expect(types).toContain('expansion1');
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import './tests/matching.test.js';
  import './tests/events.test.js';
  import './tests/progression.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/progression.js` does not exist.

- [ ] **Step 4: Implement js/progression.js**

```js
// js/progression.js
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

  // Check for game end / endless transition
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All progression tests green.

- [ ] **Step 6: Commit**

```bash
git add js/progression.js tests/progression.test.js test.html
git commit -m "feat: add progression system with milestones, unlocks, and endgame"
```

---

### Task 10: Simulation Orchestrator

**Files:**
- Create: `js/simulation.js`
- Create: `tests/simulation.test.js`
- Modify: `test.html`

- [ ] **Step 1: Write simulation tests**

```js
// tests/simulation.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { simulateTick, simulateDay } from '../js/simulation.js';
import { createNewState } from '../js/state.js';
import { createAnimal } from '../js/animals.js';
import { createStaff, assignStaff } from '../js/staff.js';

describe('simulateTick', () => {
  it('advances time by one tick', () => {
    const state = createNewState();
    const tickBefore = state.time.tick;
    simulateTick(state);
    expect(state.time.tick).toBe(tickBefore + 1);
  });

  it('updates animal needs each tick', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 0.8;
    state.animals.push(animal);
    simulateTick(state);
    expect(state.animals[0].needs.food).toBeLessThan(0.8);
  });

  it('regenerates staff energy each tick', () => {
    const state = createNewState();
    const staff = createStaff('caretaker', state.nextId++);
    staff.energy = 50;
    state.staff.push(staff);
    simulateTick(state);
    expect(state.staff[0].energy).toBeGreaterThan(50);
  });
});

describe('simulateDay', () => {
  it('deducts daily food costs per animal', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    state.animals.push(animal);
    const moneyBefore = state.money;
    simulateDay(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });

  it('deducts staff salaries daily (fraction of weekly)', () => {
    const state = createNewState();
    const staff = createStaff('caretaker', state.nextId++);
    state.staff.push(staff);
    const moneyBefore = state.money;
    simulateDay(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });
});
```

- [ ] **Step 2: Add import to test.html**

```html
<script type="module">
  import './tests/data.test.js';
  import './tests/state.test.js';
  import './tests/animals.test.js';
  import './tests/staff.test.js';
  import './tests/matching.test.js';
  import './tests/events.test.js';
  import './tests/progression.test.js';
  import './tests/simulation.test.js';
  import { runAll } from './js/test-runner.js';
  runAll();
</script>
```

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/simulation.js` does not exist.

- [ ] **Step 4: Implement js/simulation.js**

```js
// js/simulation.js
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

  // Per-tick updates
  for (const animal of state.animals) {
    tickAnimal(animal);
  }

  for (const staff of state.staff) {
    tickStaff(staff);
  }

  // Staff auto-work: assigned staff works on their animal
  for (const staff of state.staff) {
    if (staff.assignedAnimalId !== null) {
      const animal = state.animals.find(a => a.id === staff.assignedAnimalId);
      if (animal && staff.energy >= BALANCING.energyCostPerAction) {
        performWork(staff, animal);
      }
    }
  }

  // Day change
  if (state.time.day !== prevDay) {
    simulateDay(state);
  }

  // Week change
  if (state.time.week !== prevWeek) {
    simulateWeek(state);
  }

  // Month change
  if (state.time.month !== prevMonth) {
    const plannedEvents = checkPlannedEvents(state);
    for (const event of plannedEvents) {
      applyEvent(state, event);
    }
  }

  // Year change
  if (state.time.year !== prevYear) {
    checkMilestones(state);
  }
}

export function simulateDay(state) {
  // Daily costs: food per animal
  const foodCost = state.animals.length * BALANCING.dailyFoodCost;
  state.money -= foodCost;

  // Daily salary fraction (salary is per week, divide by 7)
  for (const staff of state.staff) {
    const role = STAFF_ROLES[staff.role];
    state.money -= Math.ceil(role.salary / BALANCING.daysPerWeek);
  }

  // Owner spawning
  if (shouldSpawnOwner(state) && state.owners.length < 5) {
    const owner = createOwner(state.nextId++);
    state.owners.push(owner);
  }

  // Owner patience tick
  tickOwners(state);

  // Random events
  const randomEvent = rollRandomEvent(state);
  if (randomEvent) {
    applyEvent(state, randomEvent);
  }

  // Increment days in shelter
  for (const animal of state.animals) {
    animal.daysInShelter++;
  }

  // Prevent negative money (shelter goes into debt but continues)
  // No clamping — debt is a valid game state
}

function simulateWeek(state) {
  // Trim old ticker messages (keep last 10)
  if (state.tickerMessages.length > 10) {
    state.tickerMessages = state.tickerMessages.slice(-10);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All simulation tests green.

- [ ] **Step 6: Commit**

```bash
git add js/simulation.js tests/simulation.test.js test.html
git commit -m "feat: add simulation orchestrator combining all game systems"
```

---

### Task 11: Canvas Renderer

**Files:**
- Create: `js/renderer.js`
- Create: `tests/renderer.test.js`
- Modify: `test.html`

To make the renderer testable, we extract `calculateLayout(width, height, maxAnimals)` as a pure function that returns enclosure positions and sizes. The actual Canvas draw calls remain untested (visual verification), but the layout math is covered.

- [ ] **Step 1: Write renderer layout tests**

```js
// tests/renderer.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { calculateLayout } from '../js/renderer.js';

describe('calculateLayout', () => {
  it('returns correct number of enclosures for maxAnimals 6', () => {
    const layout = calculateLayout(480, 320, 6);
    expect(layout.enclosures.length).toBe(6);
  });

  it('arranges in 3 columns and 2 rows', () => {
    const layout = calculateLayout(480, 320, 6);
    // First row: col 0,1,2
    expect(layout.enclosures[0].col).toBe(0);
    expect(layout.enclosures[1].col).toBe(1);
    expect(layout.enclosures[2].col).toBe(2);
    // Second row
    expect(layout.enclosures[3].col).toBe(0);
    expect(layout.enclosures[3].row).toBe(1);
  });

  it('enclosures have positive width and height', () => {
    const layout = calculateLayout(480, 320, 6);
    for (const enc of layout.enclosures) {
      expect(enc.w).toBeGreaterThan(0);
      expect(enc.h).toBeGreaterThan(0);
    }
  });

  it('enclosures do not exceed canvas bounds', () => {
    const layout = calculateLayout(480, 320, 6);
    for (const enc of layout.enclosures) {
      expect(enc.x + enc.w <= 480).toBeTruthy();
      expect(enc.y + enc.h <= 320).toBeTruthy();
    }
  });

  it('staff area starts below enclosures', () => {
    const layout = calculateLayout(480, 320, 6);
    const lastEncBottom = Math.max(...layout.enclosures.map(e => e.y + e.h));
    expect(layout.staffAreaY).toBeGreaterThan(lastEncBottom - 1);
  });

  it('caps at 6 enclosures even if maxAnimals is higher', () => {
    const layout = calculateLayout(480, 320, 10);
    expect(layout.enclosures.length).toBe(6);
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/renderer.test.js';` to the test imports in `test.html`.

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/renderer.js` does not export `calculateLayout`.

- [ ] **Step 4: Implement js/renderer.js**

```js
// js/renderer.js
import { SPECIES } from './data.js';

// Placeholder pixel colors for each species (will be replaced with sprites later)
const SPECIES_COLORS = {
  dog:      '#c8a070',
  cat:      '#a0a0a0',
  rabbit:   '#e0c8a0',
  smallpet: '#d0b080',
  bird:     '#70b0d0',
};

const STAFF_COLOR = '#5070c0';
const ENCLOSURE_BG = '#3a3a5a';
const ENCLOSURE_BORDER = '#555';
const FLOOR_COLOR = '#2a2a4a';
const COLS = 3;
const ROWS = 2;
const PADDING = 8;

// Pure function — testable without Canvas
export function calculateLayout(canvasW, canvasH, maxAnimals) {
  const encW = Math.floor((canvasW - PADDING * (COLS + 1)) / COLS);
  const encH = Math.floor((canvasH - 60 - PADDING * (ROWS + 1)) / ROWS);
  const count = Math.min(maxAnimals, COLS * ROWS);
  const enclosures = [];
  for (let i = 0; i < count; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    enclosures.push({
      x: PADDING + col * (encW + PADDING),
      y: PADDING + row * (encH + PADDING),
      w: encW,
      h: encH,
      col,
      row,
    });
  }
  return {
    enclosures,
    staffAreaY: PADDING + (encH + PADDING) * ROWS,
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;   // 480
  const H = canvas.height;  // 320

  function render(state) {
    const layout = calculateLayout(W, H, state.maxAnimals);

    // Clear
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, W, H);

    // Draw enclosures
    for (let i = 0; i < layout.enclosures.length; i++) {
      const { x, y, w, h } = layout.enclosures[i];

      // Enclosure background
      ctx.fillStyle = ENCLOSURE_BG;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = ENCLOSURE_BORDER;
      ctx.strokeRect(x, y, w, h);

      const animal = state.animals[i];
      if (animal) {
        drawAnimal(ctx, animal, x, y, w, h);
      } else {
        // Empty enclosure
        ctx.fillStyle = '#555';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Leer', x + w / 2, y + h / 2);
      }
    }

    // Draw staff area
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, layout.staffAreaY, W, H - layout.staffAreaY);
    ctx.strokeStyle = ENCLOSURE_BORDER;
    ctx.beginPath();
    ctx.moveTo(0, layout.staffAreaY);
    ctx.lineTo(W, layout.staffAreaY);
    ctx.stroke();

    drawStaff(ctx, state.staff, layout.staffAreaY);
  }

  function drawAnimal(ctx, animal, x, y, w, h) {
    const color = SPECIES_COLORS[animal.species] || '#888';
    const cx = x + w / 2;
    const cy = y + h / 2 - 8;

    // Simple pixel-art placeholder: colored square with face
    const size = 20;
    ctx.fillStyle = color;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 5, cy - 3, 3, 3);
    ctx.fillRect(cx + 2, cy - 3, 3, 3);

    // Nose
    ctx.fillRect(cx - 1, cy + 2, 2, 2);

    // Name
    ctx.fillStyle = '#eee';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(animal.name, cx, cy + size / 2 + 12);

    // Health/happiness bar
    const barY = cy + size / 2 + 16;
    const barW = w - 16;
    const barH = 4;
    const barX = x + 8;

    // Health bar (red/green)
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = animal.stats.health > 0.5 ? '#4ade80' : animal.stats.health > 0.25 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(barX, barY, barW * animal.stats.health, barH);

    // Happiness bar
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY + 6, barW, barH);
    ctx.fillStyle = animal.stats.happiness > 0.5 ? '#60a5fa' : '#f97316';
    ctx.fillRect(barX, barY + 6, barW * animal.stats.happiness, barH);

    // Species label
    ctx.fillStyle = '#888';
    ctx.font = '8px monospace';
    ctx.fillText(SPECIES[animal.species].name, cx, y + 12);
  }

  function drawStaff(ctx, staffList, startY) {
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PERSONAL:', 8, startY + 14);

    for (let i = 0; i < staffList.length; i++) {
      const staff = staffList[i];
      const sx = 8 + i * 120;
      const sy = startY + 24;

      // Staff icon
      ctx.fillStyle = STAFF_COLOR;
      ctx.fillRect(sx, sy, 10, 12);

      // Head
      ctx.fillRect(sx + 2, sy - 6, 6, 6);

      // Info
      ctx.fillStyle = '#eee';
      ctx.font = '8px monospace';
      ctx.fillText(`${staff.name} Lv.${staff.level}`, sx + 14, sy + 4);

      // Energy bar
      const energyPct = staff.energy / 100;
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + 14, sy + 8, 60, 3);
      ctx.fillStyle = energyPct > 0.5 ? '#4ade80' : '#fbbf24';
      ctx.fillRect(sx + 14, sy + 8, 60 * energyPct, 3);
    }
  }

  return { render };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All renderer layout tests green.

- [ ] **Step 6: Verify renderer visually**

Add temporary code to `js/main.js`:
```js
import { createRenderer } from './renderer.js';
import { createNewState } from './state.js';
import { createAnimal } from './animals.js';
import { createStaff } from './staff.js';

const canvas = document.getElementById('shelter-canvas');
const renderer = createRenderer(canvas);
const state = createNewState();

// Add test data
state.animals.push(createAnimal('dog', state.nextId++));
state.animals.push(createAnimal('cat', state.nextId++));
state.staff.push(createStaff('caretaker', state.nextId++));

renderer.render(state);
console.log("Renderer test: drawn", state.animals.length, "animals");
```

Run: Open `http://localhost:8080`
Expected: Canvas shows 2 enclosures with colored square "animals" + names + health bars, one staff member in the bottom area. 4 empty enclosures shown.

- [ ] **Step 7: Commit**

```bash
git add js/renderer.js tests/renderer.test.js test.html js/main.js
git commit -m "feat: add canvas renderer with testable layout and placeholder pixel-art"
```

---

### Task 12: UI System (DOM Overlays)

**Files:**
- Create: `js/ui.js`
- Create: `tests/ui.test.js`
- Modify: `test.html`

To make the UI testable, we extract pure formatting functions: `formatMoney(amount)`, `formatDate(time)`, `formatStaffEntry(staff, animals)`, `formatApplicantEntry(owner, animals)`. The DOM manipulation stays in `createUI` (visually verified), but the data→string logic is tested.

- [ ] **Step 1: Write UI formatting tests**

```js
// tests/ui.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { formatMoney, formatDate, formatStaffEntry } from '../js/ui.js';

describe('formatMoney', () => {
  it('formats positive amounts with $ prefix', () => {
    expect(formatMoney(1234)).toBe('$1.234');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0');
  });

  it('formats negative amounts (debt)', () => {
    expect(formatMoney(-500)).toBe('-$500');
  });
});

describe('formatDate', () => {
  it('formats year 1, month 1, week 1', () => {
    const result = formatDate({ year: 1, month: 1, week: 1, day: 1, tick: 0 });
    expect(result).toBe('Jahr 1 - Jan W1');
  });

  it('formats month 6 correctly', () => {
    const result = formatDate({ year: 3, month: 6, week: 2, day: 3, tick: 5 });
    expect(result).toBe('Jahr 3 - Jun W2');
  });

  it('formats month 12 correctly', () => {
    const result = formatDate({ year: 20, month: 12, week: 4, day: 7, tick: 0 });
    expect(result).toBe('Jahr 20 - Dez W4');
  });
});

describe('formatStaffEntry', () => {
  it('shows role, name, level, energy, and assignment', () => {
    const staff = { id: 1, role: 'caretaker', name: 'Max', level: 3, energy: 80, assignedAnimalId: 5 };
    const animals = [{ id: 5, name: 'Buddy' }];
    const result = formatStaffEntry(staff, animals);
    expect(result).toContain('Pfleger');
    expect(result).toContain('Max');
    expect(result).toContain('Lv.3');
    expect(result).toContain('80%');
    expect(result).toContain('Buddy');
  });

  it('shows dash when not assigned', () => {
    const staff = { id: 1, role: 'vet', name: 'Mia', level: 1, energy: 100, assignedAnimalId: null };
    const result = formatStaffEntry(staff, []);
    expect(result).toContain('-');
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/ui.test.js';` to the test imports in `test.html`.

- [ ] **Step 3: Run tests to verify they fail**

Run: Refresh `http://localhost:8080/test.html`
Expected: Import error — `js/ui.js` does not export `formatMoney`, `formatDate`, `formatStaffEntry`.

- [ ] **Step 4: Implement js/ui.js**

```js
// js/ui.js
import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';
import { calculateMatchScore } from './matching.js';

const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// Pure formatting functions — testable without DOM
export function formatMoney(amount) {
  if (amount < 0) return `-$${Math.abs(amount).toLocaleString('de-DE')}`;
  return `$${amount.toLocaleString('de-DE')}`;
}

export function formatDate(time) {
  const monthName = MONTH_NAMES[time.month - 1] || "???";
  return `Jahr ${time.year} - ${monthName} W${time.week}`;
}

export function formatStaffEntry(staff, animals) {
  const role = STAFF_ROLES[staff.role];
  const energyPct = Math.floor(staff.energy);
  const assigned = staff.assignedAnimalId !== null
    ? animals.find(a => a.id === staff.assignedAnimalId)?.name || '?'
    : '-';
  return `${role.name} ${staff.name} Lv.${staff.level} | E:${energyPct}% | → ${assigned}`;
}

export function createUI(state, callbacks) {
  const elements = {
    money: document.getElementById('stat-money'),
    reputation: document.getElementById('stat-reputation'),
    date: document.getElementById('stat-date'),
    staffList: document.getElementById('staff-list'),
    applicantList: document.getElementById('applicant-list'),
    ticker: document.getElementById('event-ticker'),
    dialogOverlay: document.getElementById('dialog-overlay'),
    dialogTitle: document.getElementById('dialog-title'),
    dialogContent: document.getElementById('dialog-content'),
    dialogButtons: document.getElementById('dialog-buttons'),
  };

  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseInt(btn.dataset.speed);
      callbacks.onSetSpeed(speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Action buttons
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      callbacks.onAction(action);
    });
  });

  function update(state) {
    // Stats bar
    elements.money.textContent = formatMoney(state.money);
    elements.reputation.textContent = `Rep: ${state.reputation}`;
    elements.date.textContent = formatDate(state.time);

    // Staff list
    elements.staffList.innerHTML = state.staff.map(s =>
      `<div class="staff-entry">${formatStaffEntry(s, state.animals)}</div>`
    ).join('');

    // Applicant list
    elements.applicantList.innerHTML = state.owners.map(o => {
      const bestMatch = state.animals.reduce((best, animal) => {
        const score = calculateMatchScore(animal, o, 0);
        return score > best.score ? { score, name: animal.name } : best;
      }, { score: 0, name: '-' });
      return `<div class="applicant-entry">${o.name} | Best: ${bestMatch.name} (${Math.floor(bestMatch.score)}%)</div>`;
    }).join('') || '<div style="color:#666">Keine Bewerber</div>';

    // Ticker
    if (state.tickerMessages.length > 0) {
      elements.ticker.textContent = state.tickerMessages[state.tickerMessages.length - 1];
    }
  }

  function showDialog(title, content, buttons) {
    elements.dialogTitle.textContent = title;
    elements.dialogContent.innerHTML = content;
    elements.dialogButtons.innerHTML = '';
    for (const btn of buttons) {
      const el = document.createElement('button');
      el.textContent = btn.label;
      el.addEventListener('click', () => {
        hideDialog();
        btn.onClick();
      });
      elements.dialogButtons.appendChild(el);
    }
    elements.dialogOverlay.classList.remove('hidden');
  }

  function hideDialog() {
    elements.dialogOverlay.classList.add('hidden');
  }

  return { update, showDialog, hideDialog };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All UI formatting tests green.

- [ ] **Step 6: Verify UI module loads in game**

Run: Open `http://localhost:8080` — no console errors.

- [ ] **Step 7: Commit**

```bash
git add js/ui.js tests/ui.test.js test.html
git commit -m "feat: add UI system with testable formatting and DOM overlay management"
```

---

### Task 13: Main Bootstrap — Wire Everything Together

**Files:**
- Modify: `js/main.js`
- Create: `tests/integration.test.js`
- Modify: `test.html`

Before wiring up the full game, we write integration tests that verify the core loop works end-to-end without Canvas/DOM: create a state, add animals/staff, run simulation ticks, and assert that state changes correctly.

- [ ] **Step 1: Write integration tests**

```js
// tests/integration.test.js
import { describe, it, expect } from '../js/test-runner.js';
import { createNewState } from '../js/state.js';
import { createAnimal } from '../js/animals.js';
import { createStaff, assignStaff } from '../js/staff.js';
import { simulateTick } from '../js/simulation.js';
import { createOwner, calculateMatchScore, executeAdoption } from '../js/matching.js';

describe('Integration: full game loop', () => {
  it('animal needs decrease over multiple ticks', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 1.0;
    state.animals.push(animal);
    for (let i = 0; i < 10; i++) simulateTick(state);
    expect(state.animals[0].needs.food).toBeLessThan(1.0);
  });

  it('assigned caretaker restores animal needs', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.needs.food = 0.2;
    state.animals.push(animal);
    const staff = createStaff('caretaker', state.nextId++);
    assignStaff(staff, animal.id);
    state.staff.push(staff);
    for (let i = 0; i < 5; i++) simulateTick(state);
    expect(state.animals[0].needs.food).toBeGreaterThan(0.2);
  });

  it('adoption removes animal and adds money', () => {
    const state = createNewState();
    const animal = createAnimal('dog', state.nextId++);
    animal.stats = { health: 1, happiness: 1, training: 1, social: 1 };
    state.animals.push(animal);
    const owner = createOwner(state.nextId++);
    owner.preferences = { ...animal.personality };
    state.owners.push(owner);
    const score = calculateMatchScore(animal, owner, 0);
    const moneyBefore = state.money;
    executeAdoption(state, animal, owner, score);
    expect(state.animals.length).toBe(0);
    expect(state.money).toBeGreaterThan(moneyBefore);
  });

  it('time advances correctly over many ticks', () => {
    const state = createNewState();
    // 24 ticks = 1 day, 7 days = 1 week, 4 weeks = 1 month
    const ticksPerMonth = 24 * 7 * 4;
    for (let i = 0; i < ticksPerMonth; i++) simulateTick(state);
    expect(state.time.month).toBeGreaterThan(1);
  });

  it('money decreases from food costs with animals', () => {
    const state = createNewState();
    state.animals.push(createAnimal('dog', state.nextId++));
    const moneyBefore = state.money;
    // Simulate enough ticks for one day (24 ticks)
    for (let i = 0; i < 24; i++) simulateTick(state);
    expect(state.money).toBeLessThan(moneyBefore);
  });
});
```

- [ ] **Step 2: Add import to test.html**

Add `import './tests/integration.test.js';` to the test imports in `test.html`.

- [ ] **Step 3: Run integration tests to verify they pass**

Run: Refresh `http://localhost:8080/test.html`
Expected: All integration tests green (these test already-implemented modules together).

- [ ] **Step 4: Implement the main bootstrap**

```js
// js/main.js
import { createEngine } from './engine.js';
import { createNewState, loadState, saveState } from './state.js';
import { createRenderer } from './renderer.js';
import { createUI } from './ui.js';
import { simulateTick } from './simulation.js';
import { createAnimal } from './animals.js';
import { createStaff, assignStaff, unassignStaff } from './staff.js';
import { calculateMatchScore, executeAdoption, createOwner } from './matching.js';
import { enableEndless, calculateFinalScore } from './progression.js';
import { SPECIES, STAFF_ROLES, BALANCING } from './data.js';

// Initialize
const canvas = document.getElementById('shelter-canvas');
const renderer = createRenderer(canvas);
const engine = createEngine();
engine.setMsPerTick(BALANCING.msPerTick);

let state = loadState() || createNewState();
let autoSaveCounter = 0;

const ui = createUI(state, {
  onSetSpeed(speed) {
    engine.setSpeed(speed);
  },
  onAction(action) {
    switch (action) {
      case 'intake': showIntakeDialog(); break;
      case 'adopt':  showAdoptDialog();  break;
      case 'shop':   showShopDialog();   break;
      case 'staff':  showStaffDialog();  break;
    }
  },
});

// Engine callbacks
engine.onTick = (ticks) => {
  for (let i = 0; i < ticks; i++) {
    simulateTick(state);
  }
  autoSaveCounter += ticks;
  if (autoSaveCounter > BALANCING.ticksPerDay * 7) {
    saveState(state);
    autoSaveCounter = 0;
  }
  if (state.gameOver && !state.endless) {
    engine.setSpeed(0);
    showGameOverDialog();
  }
};

engine.onRender = () => {
  renderer.render(state);
  ui.update(state);
};

// Dialog implementations
function showIntakeDialog() {
  if (state.animals.length >= state.maxAnimals) {
    ui.showDialog('Kein Platz', 'Das Tierheim ist voll! Vermittle erst Tiere oder erweitere.', [
      { label: 'OK', onClick() {} }
    ]);
    return;
  }
  const available = state.unlockedSpecies;
  const content = available.map(key => {
    const sp = SPECIES[key];
    return `<button class="action-btn" data-species="${key}">${sp.name} (Kosten: $${Math.floor(sp.baseAdoptionFee * 0.3)})</button>`;
  }).join('');

  ui.showDialog('Tier aufnehmen', content, [
    { label: 'Abbrechen', onClick() {} }
  ]);

  // Bind species buttons
  document.querySelectorAll('[data-species]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.species;
      const cost = Math.floor(SPECIES[key].baseAdoptionFee * 0.3);
      if (state.money < cost) {
        ui.showDialog('Zu teuer', 'Nicht genug Geld für die Aufnahmekosten.', [{ label: 'OK', onClick() {} }]);
        return;
      }
      state.money -= cost;
      const animal = createAnimal(key, state.nextId++);
      state.animals.push(animal);
      state.tickerMessages.push(`${animal.name} (${SPECIES[key].name}) aufgenommen!`);
      ui.hideDialog();
    });
  });
}

function showAdoptDialog() {
  if (state.owners.length === 0) {
    ui.showDialog('Keine Bewerber', 'Aktuell sind keine Adoptionsbewerber da. Steigere deine Reputation!', [
      { label: 'OK', onClick() {} }
    ]);
    return;
  }
  if (state.animals.length === 0) {
    ui.showDialog('Keine Tiere', 'Es sind keine Tiere im Tierheim.', [
      { label: 'OK', onClick() {} }
    ]);
    return;
  }

  let content = '<div style="margin-bottom:8px"><b>Bewerber wählen:</b></div>';
  for (const owner of state.owners) {
    content += `<button class="action-btn" data-owner="${owner.id}">${owner.name} (${owner.profile.housing}, ${owner.profile.experience})</button>`;
  }

  ui.showDialog('Vermittlung', content, [
    { label: 'Abbrechen', onClick() {} }
  ]);

  document.querySelectorAll('[data-owner]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ownerId = parseInt(btn.dataset.owner);
      const owner = state.owners.find(o => o.id === ownerId);
      if (!owner) return;
      ui.hideDialog();
      showAnimalSelectDialog(owner);
    });
  });
}

function showAnimalSelectDialog(owner) {
  const matchmakerBonus = state.staff
    .filter(s => s.role === 'matchmaker')
    .reduce((max, s) => Math.max(max, 0.3 + s.level * 0.1), 0);

  let content = `<div style="margin-bottom:8px"><b>${owner.name}</b> sucht ein Tier:</div>`;
  for (const animal of state.animals) {
    const score = calculateMatchScore(animal, owner, matchmakerBonus);
    const color = score >= 85 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#ef4444';
    content += `<button class="action-btn" data-animal="${animal.id}">
      ${animal.name} (${SPECIES[animal.species].name}) — <span style="color:${color}">Match: ${Math.floor(score)}%</span>
    </button>`;
  }

  ui.showDialog('Tier wählen', content, [
    { label: 'Abbrechen', onClick() {} }
  ]);

  document.querySelectorAll('[data-animal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const animalId = parseInt(btn.dataset.animal);
      const animal = state.animals.find(a => a.id === animalId);
      if (!animal) return;
      const score = calculateMatchScore(animal, owner, matchmakerBonus);
      const result = executeAdoption(state, animal, owner, score);
      state.tickerMessages.push(
        `${animal.name} vermittelt an ${owner.name}! Match: ${Math.floor(score)}%, Gebühr: $${result.fee}`
      );
      ui.hideDialog();
    });
  });
}

function showShopDialog() {
  const content = `
    <button class="action-btn" data-buy="food">Futter-Vorrat ($${BALANCING.dailyFoodCost * 7})</button>
    <button class="action-btn" data-buy="medicine">Medizin-Vorrat ($${BALANCING.dailyMedicineCost * 7})</button>
  `;
  ui.showDialog('Einkaufen', content, [
    { label: 'Schließen', onClick() {} }
  ]);

  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.buy;
      const cost = item === 'food' ? BALANCING.dailyFoodCost * 7 : BALANCING.dailyMedicineCost * 7;
      if (state.money < cost) return;
      state.money -= cost;
      // Boost all animals' relevant need
      const need = item === 'food' ? 'food' : 'medicine';
      for (const animal of state.animals) {
        animal.needs[need] = Math.min(1, animal.needs[need] + 0.3);
      }
      state.tickerMessages.push(`${item === 'food' ? 'Futter' : 'Medizin'} eingekauft!`);
    });
  });
}

function showStaffDialog() {
  let content = '<div style="margin-bottom:8px"><b>Personal verwalten:</b></div>';

  // Hire
  content += '<div style="margin-bottom:8px"><u>Einstellen:</u></div>';
  for (const roleKey of state.unlockedRoles) {
    const role = STAFF_ROLES[roleKey];
    content += `<button class="action-btn" data-hire="${roleKey}">${role.name} einstellen ($${role.salary}/Wo)</button>`;
  }

  // Assign
  if (state.staff.length > 0 && state.animals.length > 0) {
    content += '<div style="margin-top:8px; margin-bottom:8px"><u>Zuweisen:</u></div>';
    for (const staff of state.staff) {
      const role = STAFF_ROLES[staff.role];
      content += `<div style="margin-bottom:4px"><b>${role.name} ${staff.name}</b> → `;
      content += `<select data-assign="${staff.id}">`;
      content += `<option value="">Niemand</option>`;
      for (const animal of state.animals) {
        const selected = staff.assignedAnimalId === animal.id ? 'selected' : '';
        content += `<option value="${animal.id}" ${selected}>${animal.name}</option>`;
      }
      content += `</select></div>`;
    }
  }

  ui.showDialog('Personal', content, [
    { label: 'Schließen', onClick() {} }
  ]);

  document.querySelectorAll('[data-hire]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roleKey = btn.dataset.hire;
      const staff = createStaff(roleKey, state.nextId++);
      state.staff.push(staff);
      state.tickerMessages.push(`${STAFF_ROLES[roleKey].name} ${staff.name} eingestellt!`);
      ui.hideDialog();
      showStaffDialog(); // Refresh
    });
  });

  document.querySelectorAll('[data-assign]').forEach(select => {
    select.addEventListener('change', () => {
      const staffId = parseInt(select.dataset.assign);
      const staff = state.staff.find(s => s.id === staffId);
      if (!staff) return;
      const animalId = select.value ? parseInt(select.value) : null;
      if (animalId) {
        assignStaff(staff, animalId);
      } else {
        unassignStaff(staff);
      }
    });
  });
}

function showGameOverDialog() {
  const score = calculateFinalScore(state);
  const content = `
    <div style="text-align:center; line-height:2;">
      <div>Adoptionen: <b>${score.totalAdoptions}</b></div>
      <div>Rückgaben: <b>${score.totalReturns}</b></div>
      <div>Reputation: <b>${score.reputation}</b></div>
      <div>Geld: <b>$${score.money.toLocaleString('de-DE')}</b></div>
      <div style="margin-top:8px; font-size:16px; color:#ffd700;">Punktzahl: <b>${score.score}</b></div>
    </div>
  `;
  ui.showDialog('20 Jahre vorbei!', content, [
    { label: 'Endlos-Modus', onClick() { enableEndless(state); engine.setSpeed(1); } },
    { label: 'Neues Spiel', onClick() { state = createNewState(); saveState(state); } },
  ]);
}

// Start the game with initial animals if new game
if (state.animals.length === 0 && state.staff.length === 0) {
  // New game: start with 2 animals and 1 caretaker
  state.animals.push(createAnimal('dog', state.nextId++));
  state.animals.push(createAnimal('cat', state.nextId++));
  state.staff.push(createStaff('caretaker', state.nextId++));
  state.tickerMessages.push('Willkommen bei JujuPets! Dein Tierheim-Abenteuer beginnt.');
}

engine.start();
```

- [ ] **Step 5: Verify the game runs end-to-end**

Run: Open `http://localhost:8080`
Expected: Game starts with 2 animals (dog + cat) and 1 caretaker. Stats bar shows $2000, Rep: 10, Year 1. Time advances. Animals' health bars slowly decrease. Side panel shows staff. Action buttons open dialogs. Speed buttons work.

- [ ] **Step 6: Commit**

```bash
git add js/main.js tests/integration.test.js test.html
git commit -m "feat: wire all systems together with integration tests — game is playable"
```

---

### Task 14: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

JujuPets — Kairosoft-style real-time animal shelter management sim. Pure vanilla HTML5/CSS/JS, no build step, no framework.

## Running

- Serve locally: `python3 -m http.server 8080` then open `http://localhost:8080`
- Run tests: open `http://localhost:8080/test.html`
- No npm, no bundler, no compilation needed

## Architecture

ES modules throughout (`<script type="module">`). Canvas (480x320) for pixel-art shelter view, DOM overlays for UI.

- `js/main.js` — bootstrap, wires engine + state + renderer + ui + simulation, handles dialogs
- `js/engine.js` — rAF game loop, speed control (pause/x1/x2/x3), tick dispatch
- `js/state.js` — central game state object, save/load (LocalStorage), time advancement
- `js/data.js` — all static data: species, personality axes, staff roles, events, balancing constants
- `js/animals.js` — animal factory, per-tick need decay, happiness/health logic
- `js/staff.js` — staff factory, energy regen, work effects, leveling
- `js/matching.js` — owner generation, 4-factor match score, adoption execution with return risk
- `js/events.js` — planned events (monthly/quarterly) + weighted random events
- `js/progression.js` — year-based milestone unlocks, endgame, final score
- `js/simulation.js` — orchestrates one sim tick: animals → staff → owners → events → milestones
- `js/renderer.js` — canvas rendering of shelter grid, animals, staff
- `js/ui.js` — DOM overlay management: stats bar, panels, ticker, dialogs

## Testing

Browser-based test runner (`js/test-runner.js`). Tests are ES modules in `tests/`. Add new test files by importing them in `test.html`.

## Key Design Decisions

- Matching score: 40% personality, 25% training, 20% health+happiness, 15% matchmaker staff — with profile-based modifiers (housing/experience/household)
- Bad matches (<60%) risk animal return (30% chance), costing reputation and animal happiness
- Time: 24 ticks/day, 7 days/week, 4 weeks/month, 12 months/year, 20 years story mode
- All game data constants live in `js/data.js` BALANCING object for easy tuning
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with project guidance for Claude Code"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Echtzeit-Sim → Task 3 (engine), Task 10 (simulation)
- [x] Pixel-Art Canvas → Task 11 (renderer)
- [x] 5 Tierarten, freischaltbar → Task 2 (data), Task 9 (progression)
- [x] 4 Persönlichkeitsachsen → Task 2 (data), Task 5 (animals)
- [x] 4 Ressourcen (Geld, Reputation, Tierglück, Personal-Energie) → Task 4 (state), Task 5 (animals), Task 6 (staff)
- [x] 4 Personalrollen → Task 2 (data), Task 6 (staff)
- [x] Matching-System mit Besitzer-Profilen → Task 7 (matching)
- [x] Events (geplant + zufällig) → Task 8 (events)
- [x] 20-Jahres-Progression + Endlos → Task 9 (progression)
- [x] Single-View UI → Task 1 (scaffold), Task 12 (ui)
- [x] Save/Load LocalStorage → Task 4 (state)
- [x] Speed Control → Task 3 (engine)

**Placeholder scan:** No TBD/TODO found. All code blocks are complete.

**TDD coverage:** All 14 tasks use TDD. Tasks 3 (engine), 11 (renderer), and 12 (UI) extract testable pure functions (`computeTicks`, `calculateLayout`, `formatMoney`/`formatDate`/`formatStaffEntry`). Task 13 adds integration tests verifying the full game loop without DOM/Canvas.

**Type consistency:**
- `createAnimal(speciesKey, id)` — consistent across animals.js, matching.js, events.js, main.js
- `createStaff(roleKey, id)` — consistent across staff.js, main.js
- `createOwner(id)` — consistent across matching.js, simulation.js
- `simulateTick(state)` — consistent between simulation.js and main.js
- `calculateMatchScore(animal, owner, matchmakerBonus)` — consistent across matching.js, ui.js, main.js
- `executeAdoption(state, animal, owner, matchScore)` — consistent across matching.js, main.js
- `computeTicks(dt, speed, msPerTick, accumulator)` — exported from engine.js, used internally and in tests
- `calculateLayout(canvasW, canvasH, maxAnimals)` — exported from renderer.js, used internally and in tests
- `formatMoney(amount)`, `formatDate(time)`, `formatStaffEntry(staff, animals)` — exported from ui.js, used internally and in tests
