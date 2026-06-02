#!/usr/bin/env bun
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * GENERATE LAYOUT REGRESSION COMMENT
 * Parses Playwright test results and format a PR comment with diffs.
 */

const REPORT_PATH = 'test-results/visual-regression-consolidated.json';
const ARTIFACT_URL_BASE = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY + '/actions/runs/' + process.env.GITHUB_RUN_ID;

console.log('### 📸 Layout Regression Summary\n');

if (!existsSync(REPORT_PATH)) {
  console.log('✅ No layout regressions detected.');
  process.exit(0);
}

try {
  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  const failures = report.suites[0].specs.filter(spec => spec.ok === false);

  if (failures.length === 0) {
    console.log('✅ All layout consistency checks passed across all breakpoints.');
  } else {
    console.log(`⚠️ **${failures.length} Layout Divergences Detected**\n`);
    console.log('| Page | Breakpoint | Status | Diff Link |');
    console.log('| :--- | :--- | :--- | :--- |');

    failures.forEach(failure => {
      const title = failure.title;
      // Extract page and breakpoint from title (e.g., "Layout Consistency: Dashboard @ mobile")
      const match = title.match(/Consistency: (.*) @ (.*)/);
      const pageName = match ? match[1] : 'Unknown';
      const bpName = match ? match[2] : 'Unknown';
      
      console.log(`| ${pageName} | ${bpName} | ❌ Diverged | [View Artifacts](${ARTIFACT_URL_BASE}) |`);
    });

    console.log('\n> **Note:** Please download the `playwright-visual-report` artifact to inspect precise pixel diffs.');
  }
} catch (e) {
  console.log('⚠️ Error parsing visual regression report.');
}
