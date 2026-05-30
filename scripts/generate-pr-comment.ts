import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const auditData = JSON.parse(readFileSync(join(process.cwd(), 'reports/token-audit.json'), 'utf8'));
  const { totalIssues, results } = auditData;

  console.log('### 🎨 Cathedra Design System Audit Results');
  if (totalIssues === 0) {
    console.log('✅ All components are compliant with official design tokens.');
  } else {
    console.log('❌ Found **' + totalIssues + '** design token violations.');
    console.log('| Category | Issues | Suggestion |');
    console.log('| :--- | :--- | :--- |');
    results.forEach((r: any) => {
      if (r.issuesCount > 0) {
        console.log('| ' + r.name + ' | ' + r.issuesCount + ' | ' + r.suggestion + ' |');
      }
    });
    console.log('\n---');
    console.log('*Please use <Stack />, <Box />, or <Typography /> to ensure token compliance.*');
  }
} catch (e) {
  console.log('Audit report not found. Please run "npm run token-audit" first.');
}
