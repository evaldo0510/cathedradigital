import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runVisualTests() {
  console.log('🚀 Starting Visual Regression Tests...');
  
  const reportPath = path.join(process.cwd(), 'visual-report.json');
  const results: any = {
    timestamp: new Date().toISOString(),
    status: 'pending',
    pages: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    }
  };

  try {
    // Run Playwright tests with JSON reporter
    execSync('npx playwright test tests/e2e/visual-regression.spec.ts --reporter=json', {
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    });
    results.status = 'success';
  } catch (error) {
    console.error('❌ Tests failed or found visual differences.');
    results.status = 'failed';
  }

  // Parse the playwright json report if it exists
  const playwrightReportPath = path.join(process.cwd(), 'test-results', 'report.json');
  if (fs.existsSync(playwrightReportPath)) {
    const playwrightReport = JSON.parse(fs.readFileSync(playwrightReportPath, 'utf8'));
    
    playwrightReport.suites.forEach((suite: any) => {
      suite.specs.forEach((spec: any) => {
        spec.tests.forEach((test: any) => {
          results.summary.total++;
          const result = test.results[0];
          const isFailed = result.status !== 'passed';
          
          if (isFailed) results.summary.failed++;
          else results.summary.passed++;

          results.pages.push({
            name: spec.title,
            route: spec.title.split(' ')[1],
            viewport: spec.title.split(' ')[3],
            status: result.status,
            errors: result.errors?.map((e: any) => e.message) || [],
            diffImage: result.attachments?.find((a: any) => a.name === 'diff')?.path,
            actualImage: result.attachments?.find((a: any) => a.name === 'actual')?.path,
            expectedImage: result.attachments?.find((a: any) => a.name === 'expected')?.path,
          });
        });
      });
    });
  }

  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`✅ Report generated at ${reportPath}`);
}

runVisualTests();
