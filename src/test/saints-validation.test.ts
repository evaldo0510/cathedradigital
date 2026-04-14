import { describe, it, expect } from 'vitest';
import { ALL_SAINTS } from '../data/saints';

describe('Saints Database Coverage', () => {
  it('should cover all 366 days of the year (including leap years)', () => {
    const coverage = new Set<string>();
    
    ALL_SAINTS.forEach(saint => {
      if (saint.feastMonth && saint.feastDayNum) {
        coverage.add(`${saint.feastMonth}-${saint.feastDayNum}`);
      }
    });

    const missingDays: string[] = [];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    months.forEach((month, index) => {
      for (let day = 1; day <= daysInMonth[index]; day++) {
        const key = `${month}-${day}`;
        if (!coverage.has(key)) {
          missingDays.push(key);
        }
      }
    });

    if (missingDays.length > 0) {
      console.error('Missing days in saints database:', missingDays.join(', '));
    }

    expect(missingDays.length).toBe(0);
  });

  it('should have basic info for every saint', () => {
    ALL_SAINTS.forEach(saint => {
      expect(saint.name, `Saint ${saint.id} should have a name`).toBeTruthy();
      expect(saint.bio, `Saint ${saint.id} should have a bio`).toBeTruthy();
      expect(saint.feastMonth, `Saint ${saint.id} should have a feastMonth`).toBeGreaterThan(0);
      expect(saint.feastDayNum, `Saint ${saint.id} should have a feastDayNum`).toBeGreaterThan(0);
    });
  });
});