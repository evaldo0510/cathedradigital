import { test, expect } from '@playwright/test';
import { BIBLE_DATA } from '../../src/data/bible-books';

const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);
const forbiddenWords = [
  'Chapter', 'Verse', 'Book', 'Search', 'Loading', 'Error', 'Settings', 
  'Cancel', 'Save', 'Delete', 'Share', 'Back', 'Summary', 'Continue Reading',
  'Tobit', 'Judith', 'Wisdom', 'Sirach', 'Baruch', 'Maccabees', 'Obadiah'
];

test.describe('CATHEDRA STABILIZATION: Bible Navigation & Language Audit', () => {
  
  // Test across devices (defined in playwright.config.ts)
  // This test will run for each project (Desktop, Mobile, etc.)
  
  test('Full Navigation & Language Check', async ({ page }) => {
    const report: any[] = [];
    const session_id = `audit_${Date.now()}`;
    
    // 1. Check Library / Book List
    await page.goto('/bible');
    // Wait for content
    await page.waitForSelector('text=Antigo Testamento', { timeout: 15000 });
    
    await auditPage(page, 'Bible Home', report);

    // 2. Sample random books from each category for deep check
    const categories = Object.values(BIBLE_DATA).flat();
    for (const cat of categories) {
      // Test at least one book per category to ensure coverage
      const book = cat.books[0];
      
      console.log(`Auditing Book: ${book.name}`);
      await page.goto(`/bible?book=${encodeURIComponent(book.abbr)}&ch=1`);
      
      // Wait for reader
      await page.waitForSelector('text=Capítulo 1', { timeout: 15000 }).catch(() => {
        console.warn(`Timeout waiting for Capítulo 1 in ${book.name}`);
      });
      
      await auditPage(page, `Reading ${book.name} Ch 1`, report);
      
      // Check for navigation controls
      const nextBtn = page.locator('button').filter({ hasText: /Próximo|Seguinte/i });
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
        await page.waitForTimeout(1000);
        await auditPage(page, `Reading ${book.name} Ch 2`, report);
      }
    }

    // 3. Search Audit
    await page.goto('/bible');
    const searchTrigger = page.getByPlaceholder(/Pesquisar nas Escrituras/i);
    if (await searchTrigger.count() > 0) {
      await searchTrigger.click();
      await searchTrigger.fill('Cristo');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await auditPage(page, 'Search Results', report);
    }

    // Save report
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(process.cwd(), 'REPORTS');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
    
    const reportPath = path.join(reportDir, `bible-integrity-${session_id}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      session_id,
      device: page.viewportSize(),
      violations: report,
      summary: {
        total_checks: report.length,
        violations_count: report.filter(r => r.violations.length > 0).length
      }
    }, null, 2));
    
    console.log(`Report saved to ${reportPath}`);
    
    // Final assertion: No violations allowed
    const totalViolations = report.reduce((acc, r) => acc + r.violations.length, 0);
    expect(totalViolations, `Found ${totalViolations} English terms in PT experience. Check ${reportPath} for details.`).toBe(0);
  });
});

async function auditPage(page, context, report) {
  const violations = [];
  
  // Get all text from body
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  for (const word of forbiddenWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bodyText)) {
      // Verify if it's really visible and not in an allowlist context (though we want 0 here)
      const count = await page.evaluate((w) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n, c = 0;
        const r = new RegExp(`\\b${w}\\b`, 'i');
        while (n = walker.nextNode()) {
          if (r.test(n.textContent) && n.parentElement.offsetParent !== null) c++;
        }
        return c;
      }, word);
      
      if (count > 0) {
        violations.push({
          term: word,
          count,
          selector: `Contains: ${word}`
        });
      }
    }
  }
  
  report.push({
    context,
    url: page.url(),
    timestamp: new Date().toISOString(),
    violations
  });
}
