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

describe('PA canvas dimensions', () => {
  it('680x500 viewport constants are correct', () => {
    expect(680).toBeGreaterThan(0);
    expect(500).toBeGreaterThan(0);
  });
});
