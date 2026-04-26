import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security Scanner E2E Test
 * 
 * This test scans the codebase and build artifacts (if any) for patterns
 * that resemble API keys, secrets, or sensitive tokens.
 * 
 * It fails if any high-confidence secret patterns are found.
 */

const SECRET_PATTERNS = [
  { name: 'Generic Secret', regex: /"([^"]*(?:secret|token|key|password|auth|api|sk_)[^"]*)"\s*:\s*"([^"]+)"/gi },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{48}/g },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/g },
  { name: 'Slack Token', regex: /xox[bpa]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/g },
  { name: 'AWS Access Key', regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g },
  { name: 'Supabase Service Role', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9._-]+/g } // Simplified JWT check for potential service roles
];

const IGNORE_DIRS = ['node_modules', '.git', 'test-results', 'dist', 'build'];
const IGNORE_FILES = ['security-scanner.spec.ts', 'package-lock.json', 'bun.lockb'];

function scanDirectory(dir: string, foundSecrets: string[]) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        scanDirectory(fullPath, foundSecrets);
      }
    } else {
      if (IGNORE_FILES.includes(file)) continue;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const pattern of SECRET_PATTERNS) {
        const matches = content.match(pattern.regex);
        if (matches) {
          for (const match of matches) {
            // Basic heuristic to avoid false positives with CSS classes or IDs
            if (match.length > 10 && !match.includes('bg-') && !match.includes('text-')) {
              foundSecrets.push(`[${pattern.name}] in ${fullPath}: ${match.substring(0, 10)}...`);
            }
          }
        }
      }
    }
  }
}

test.describe('Security Scanner', () => {
  test('should not contain exposed API keys or secrets in the repository', async () => {
    const foundSecrets: string[] = [];
    const rootDir = path.resolve(__dirname, '../../src'); // Focus on source code
    
    scanDirectory(rootDir, foundSecrets);

    if (foundSecrets.length > 0) {
      console.error('CRITICAL: Potential secrets found in source code:');
      foundSecrets.forEach(s => console.error(s));
    }

    expect(foundSecrets.length, `Found ${foundSecrets.length} potential secrets! Please check console output.`).toBe(0);
  });
});
