import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const reportPath = join(process.cwd(), 'reports/token-audit.json');

if (!existsSync(reportPath)) {
  console.log('### 🎨 Cathedra Design System Audit\n\n⚠️ No audit report found. Make sure to run the audit first.');
  process.exit(0);
}

try {
  const auditData = JSON.parse(readFileSync(reportPath, 'utf8'));
  const { totalIssues, results, timestamp } = auditData;

  console.log('### 🎨 Cathedra Design System Audit');
  console.log(`*Generated at: ${new Date(timestamp).toLocaleString()}* \n`);

  if (totalIssues === 0) {
    console.log('✅ **Perfect!** All components are compliant with official design tokens.');
  } else {
    console.log(`❌ Found **${totalIssues}** design token violations.`);
    
    console.log('\n#### 📊 Summary');
    console.log('| Category | Issues | Suggestion |');
    console.log('| :--- | :--- | :--- |');
    
    results.forEach((r: any) => {
      if (r.issuesCount > 0) {
        console.log(`| ${r.name} | ${r.issuesCount} | ${r.suggestion} |`);
      }
    });

    console.log('\n#### 🛠️ Recommendations');
    console.log('- Use **<Stack />** or **<Box />** for layout and spacing.');
    console.log('- Use **<Typography />** for all text elements.');
    console.log('- Prefer semantic tokens over direct Tailwind utility classes.');
    
    console.log('\n---\n*Full report available in CI artifacts (reports/token-audit.html)*');
  }
} catch (e) {
  console.log('### 🎨 Cathedra Design System Audit\n\n❌ Error parsing audit report.');
}
