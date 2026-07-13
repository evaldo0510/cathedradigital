// Sprint 1.12 — Testes do helper de rate limiting
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  checkRateLimit,
  checkBruteForce,
  recordAttempt,
  clearAttempts,
  __resetRateLimitCaches,
} from './rate-limit.ts';

Deno.test('checkRateLimit: IP nulo sempre permitido', () => {
  __resetRateLimitCaches();
  for (let i = 0; i < 100; i++) assertEquals(checkRateLimit(null), true);
});

Deno.test('checkRateLimit: permite até 10 e bloqueia o 11º', () => {
  __resetRateLimitCaches();
  const ip = '10.0.0.1';
  for (let i = 0; i < 10; i++) assertEquals(checkRateLimit(ip), true);
  assertEquals(checkRateLimit(ip), false);
});

Deno.test('checkRateLimit: IPs distintos são independentes', () => {
  __resetRateLimitCaches();
  for (let i = 0; i < 10; i++) checkRateLimit('10.0.0.2');
  assertEquals(checkRateLimit('10.0.0.2'), false);
  assertEquals(checkRateLimit('10.0.0.3'), true);
});

Deno.test('checkBruteForce: 5 tentativas → bloqueado', () => {
  __resetRateLimitCaches();
  const key = 'evt-1';
  for (let i = 0; i < 5; i++) {
    assertEquals(checkBruteForce(key), true);
    recordAttempt(key);
  }
  assertEquals(checkBruteForce(key), false);
  clearAttempts(key);
  assertEquals(checkBruteForce(key), true);
});
