import { test, expect } from 'vitest';

// Simple check for typography classes in index.css
// In a real CI, we might use Playwright for visual snapshots, 
// but here we validate the system's presence.

test('typography fluid scale exists', async () => {
  const fs = await import('fs');
  const css = fs.readFileSync('src/index.css', 'utf-8');
  
  expect(css).toContain('clamp');
  expect(css).toContain('text-premium-tiny');
  expect(css).toContain('text-premium-small');
  expect(css).toContain('text-premium-base');
});

test('base font sizes are responsive', async () => {
  const fs = await import('fs');
  const css = fs.readFileSync('src/index.css', 'utf-8');
  
  expect(css).toContain('@screen md');
  expect(css).toContain('@screen lg');
});
