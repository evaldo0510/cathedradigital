import fs from 'fs';
import path from 'path';

async function generateComment() {
  const reportDir = path.join(process.cwd(), 'test-results');
  const homeSummaryPath = path.join(reportDir, 'seo-summary-home.json');
  const internalSummaryPath = path.join(reportDir, 'seo-summary-internal.json');

  let comment = '## 🚀 SEO Audit Summary\n\n';
  let hasIssues = false;

  if (fs.existsSync(homeSummaryPath)) {
    const home = JSON.parse(fs.readFileSync(homeSummaryPath, 'utf8'));
    comment += `### 🏠 Home Page\n`;
    
    if (home.critical.length > 0) {
      hasIssues = true;
      comment += `#### ❌ Critical Issues\n`;
      home.critical.forEach((issue: string) => comment += `- ${issue}\n`);
    }

    if (home.warnings.length > 0) {
      comment += `#### ⚠️ Warnings\n`;
      home.warnings.forEach((issue: string) => comment += `- ${issue}\n`);
    }

    if (home.critical.length === 0 && home.warnings.length === 0) {
      comment += `✅ No issues found!\n`;
    }
    comment += '\n';
  }

  if (fs.existsSync(internalSummaryPath)) {
    const internal = JSON.parse(fs.readFileSync(internalSummaryPath, 'utf8'));
    comment += `### 📄 Internal Pages\n`;
    
    internal.forEach((page: any) => {
      comment += `#### ${page.page} (${page.path})\n`;
      if (page.critical.length > 0) {
        hasIssues = true;
        page.critical.forEach((issue: string) => comment += `- ❌ ${issue}\n`);
      }
      if (page.warnings.length > 0) {
        page.warnings.forEach((issue: string) => comment += `- ⚠️ ${issue}\n`);
      }
      if (page.critical.length === 0 && page.warnings.length === 0) {
        comment += `✅ No issues found!\n`;
      }
      comment += '\n';
    });
  }

  if (!hasIssues) {
    comment = '## ✅ SEO Audit Passed\n\nAll critical SEO checks passed successfully! 🚀';
  }

  comment += '\n---\n*Detailed reports are available in the Actions artifacts.*';
  
  fs.writeFileSync('seo-comment.md', comment);
  console.log('Comment generated successfully.');
}

generateComment();
