const RATE_LIMIT_CACHE = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Simple in-memory rate limiting for Edge Functions.
 * Note: Since Edge Functions are short-lived/ephemeral, this is most effective 
 * per-instance, but provides basic protection against common bursts.
 */
export function checkRateLimit(ip: string | null): boolean {
  if (!ip) return true;
  
  const now = Date.now();
  const entry = RATE_LIMIT_CACHE.get(ip);
  
  if (!entry || now - entry.lastReset > RATE_LIMIT_WINDOW) {
    RATE_LIMIT_CACHE.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (entry.count >= MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Brute force protection for specific keys (e.g., event IDs)
 */
const BRUTE_FORCE_CACHE = new Map<string, number>();
const MAX_ATTEMPTS = 5;

export function checkBruteForce(key: string): boolean {
  const attempts = BRUTE_FORCE_CACHE.get(key) || 0;
  if (attempts >= MAX_ATTEMPTS) {
    return false;
  }
  return true;
}

export function recordAttempt(key: string) {
  const attempts = BRUTE_FORCE_CACHE.get(key) || 0;
  BRUTE_FORCE_CACHE.set(key, attempts + 1);
}

export function clearAttempts(key: string) {
  BRUTE_FORCE_CACHE.delete(key);
}
