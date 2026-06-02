#!/usr/bin/env bun
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * GENERATE LAYOUT REGRESSION COMMENT
 * Parses Playwright test results and formats a PR comment with a detailed HTML table.
 */

const REPORT_PATH = 'test-results/visual-regression-consolidated.json';
const ARTIFACT_URL_BASE = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY + '/actions/runs/' + process.env.GITHUB_RUN_ID;

console.log('### 📸 Layout Regression Audit\n');

if (!existsSync(REPORT_PATH)) {
  console.log('✅ No layout regressions detected.');
  process.exit(0);
}

try {
  const report = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  const specs = report.suites?.[0]?.specs || [];
  const failures = specs.filter(spec => !spec.ok);

  if (failures.length === 0) {
    console.log('✅ All layout consistency checks passed across all breakpoints.');
  } else {
    console.log(`⚠️ **${failures.length} Layout Divergences Detected**\n`);
    
    // Sort failures by a heuristic of importance (e.g., page name)
    const sortedFailures = failures.sort((a, b) => a.title.localeCompare(b.title));

    console.log('#### 📊 Detailed Comparison Table\n');
    console.log('<table>');
    console.log('  <thead>');
    console.log('    <tr>');
    console.log('      <th>Component / Page</th>');
    console.log('      <th>Breakpoint</th>');
    console.log('      <th>Difference</th>');
    console.log('      <th>Artifacts</th>');
    console.log('    </tr>');
    console.log('  </thead>');
    console.log('  <tbody>');

    sortedFailures.forEach(failure => {
      const title = failure.title;
      const match = title.match(/Consistency: (.*) @ (.*)/);
      const pageName = match ? match[1] : 'Unknown';
      const bpName = match ? match[2] : 'Unknown';
      
      // Try to extract diff percentage from error message if available
      let diffPercent = 'N/A';
      if (failure.tests?.[0]?.results?.[0]?.errors?.[0]?.message) {
        const msg = failure.tests[0].results[0].errors[0].message;
        const diffMatch = msg.match(/([0-9.]+)%|([0-9.]+) pixels/);
        if (diffMatch) diffPercent = diffMatch[0];
      }

      console.log('    <tr>');
      console.log(`      <td><code>${pageName}</code></td>`);
      console.log(`      <td><code>${bpName}</code></td>`);
      console.log(`      <td><strong style="color: #e11d48;">${diffPercent}</strong></td>`);
      console.log(`      <td><a href="${ARTIFACT_URL_BASE}">📦 Download Diff Bundle</a></td>`);
      console.log('    </tr>');
    });

    console.log('  </tbody>');
    console.log('</table>\n');

    console.log('\n> [!IMPORTANT]\n> Please download the **`layout-regression-artifacts`** from the CI run to inspect precise visual diffs.');
    console.log(`\n[🔗 View Action Run](${ARTIFACT_URL_BASE})`);
  }
} catch (e) {
  console.log('⚠️ Error parsing visual regression report: ' + (e as Error).message);
}

