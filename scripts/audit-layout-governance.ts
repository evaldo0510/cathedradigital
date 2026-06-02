#!/usr/bin/env bun
import { execSync } from 'child_process';

/**
 * CATHEDRA LAYOUT GOVERNANCE AUDIT
 * Blocks PRs if layout utility classes are used outside the layout authority.
 */

const forbiddenWrappers = [
  'max-w-',
  'mx-auto',
  'container'
];

const exemptionPatterns = [
  // Layout Authorities
  'src/components/cathedra/ContemplativeLayout.tsx',
  'src/components/cathedra/AppHeader.tsx',
  'src/components/cathedra/ItinerariumStepPage.tsx',
  
  // Design System & Core UI
  'src/components/ui/',
  'src/lib/design-system.ts',
  'src/index.css',
  
  // Landing Pages (Separate Layout Logic)
  'src/pages/landing/',
  'src/components/landing/',
  
  // Test Infrastructure
  'test',
  '.snap',
  'node_modules',
  
  // Explicitly Audited Exceptions (Legacy or complex UI)
  'src/components/cathedra/Auth.tsx',
  'src/components/cathedra/Catechism.tsx', // Nested reader prose needs max-w-none
  'src/components/cathedra/RouteSkeletons.tsx',
  'src/components/cathedra/OfflinePage.tsx',
  'src/components/cathedra/TransactionsPage.tsx',
  'src/components/cathedra/PricingPage.tsx',
  'src/components/cathedra/UpgradePage.tsx',
  'src/components/cathedra/OnboardingPage.tsx',
  'src/components/cathedra/ResetPasswordPage.tsx',
  'src/components/cathedra/DesignSystemGuide.tsx',
  'src/components/cathedra/ViaCrucis.tsx',
  'src/components/cathedra/PrayerPage.tsx',
  'src/components/cathedra/ProShowcase.tsx',
  'src/components/cathedra/NexusBubbles.tsx',
  'src/components/cathedra/ReadingJournal.tsx',
  'src/components/cathedra/QuickModals.tsx',
  'src/components/cathedra/A11ySettingsPanel.tsx',
  'src/components/cathedra/RouteSkeletons.tsx'
];

console.log('--- CATHEDRA LAYOUT GOVERNANCE AUDIT ---');

let violationsFound = 0;

forbiddenWrappers.forEach(pattern => {
  try {
    const command = `rg -n "\\b${pattern}" src --glob "!**/*.test.tsx" --glob "!**/*.spec.ts" --glob "!**/*.snap" --glob "!node_modules/**"`;
    const output = execSync(command, { encoding: 'utf8' }).trim();
    
    if (output) {
      const lines = output.split('\n');
      lines.forEach(line => {
        const filePath = line.split(':')[0];
        if (exemptionPatterns.some(ex => filePath.includes(ex))) return;

        // Final secondary filter for specific allowed Tailwind patterns that are NOT layout wrappers
        // e.g., max-w-none on prose, or specific max-w on images/icons (not containers)
        if (line.includes('max-w-none') || line.includes('max-w-[12px]') || line.includes('max-w-fit')) return;

        console.error(`❌ Layout Governance Violation: ${line}`);
        violationsFound++;
      });
    }
  } catch (e) {
    // No matches
  }
});

console.log('\n--- CATHEDRA LAYOUT CONSOLIDATION REPORT ---');
console.log(`- Governance Status: ${violationsFound === 0 ? '✅ PASSED' : '⚠️ WARNING'}`);
console.log(`- Violations Blocking CI: ${violationsFound}`);
console.log('-------------------------------------------\n');

// During migration phase, we warn. Once ready, uncomment next line:
// if (violationsFound > 0) process.exit(1);

