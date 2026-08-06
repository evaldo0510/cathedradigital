import { describe, it, expect } from 'vitest';
import { computeEaster, resolveLiturgicalDay, msUntilNextMidnight } from './liturgicalCalendar';

describe('liturgicalCalendar', () => {
  it('calcula a Páscoa corretamente (computus gregoriano)', () => {
    expect(computeEaster(2024).toDateString()).toBe(new Date(2024, 2, 31).toDateString());
    expect(computeEaster(2025).toDateString()).toBe(new Date(2025, 3, 20).toDateString());
    expect(computeEaster(2026).toDateString()).toBe(new Date(2026, 3, 5).toDateString());
  });

  it('identifica o Tempo Pascal', () => {
    const day = resolveLiturgicalDay(new Date(2026, 3, 5));
    expect(day.season).toBe('Tempo Pascal');
    expect(day.celebration).toBe('Domingo da Ressurreição');
    expect(day.rank).toBe('solenidade');
  });

  it('identifica Quaresma e Quarta-feira de Cinzas', () => {
    const ashes = resolveLiturgicalDay(new Date(2026, 1, 18));
    expect(ashes.season).toBe('Quaresma');
    expect(ashes.celebration).toBe('Quarta-feira de Cinzas');
  });

  it('identifica o Advento e o ano litúrgico', () => {
    const day = resolveLiturgicalDay(new Date(2025, 11, 7));
    expect(day.season).toBe('Advento');
    expect(day.liturgicalYear).toBe(2026);
  });

  it('resolve ciclos de leitura', () => {
    const day = resolveLiturgicalDay(new Date(2026, 7, 6));
    expect(['A', 'B', 'C']).toContain(day.yearCycle);
    expect(['I', 'II']).toContain(day.weekCycle);
  });

  it('agenda a próxima meia-noite dentro de 24h', () => {
    const ms = msUntilNextMidnight(new Date(2026, 7, 6, 23, 0, 0));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 3600 * 1000);
  });
});
