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
