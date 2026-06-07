import { test, expect, Page } from '@playwright/test';
import { BIBLE_DATA } from '../../src/data/bible-books';

const allBooks = Object.values(BIBLE_DATA).flat().flatMap(cat => cat.books);

/**
 * Forbidden English terms that should NEVER appear in the Portuguese UI.
 */
const forbiddenWords = [
  'Chapter', 'Verse', 'Book', 'Search', 'Loading', 'Error', 'Settings', 
  'Cancel', 'Save', 'Delete', 'Share', 'Back', 'Summary', 'Continue Reading',
  'Tobit', 'Judith', 'Wisdom', 'Sirach', 'Baruch', 'Maccabees', 'Obadiah'
];

/**
 * Allowed terms (names, technical terms, etc.)
 */
const allowlist = [
  'Cathedra', 'Logos', 'Oasis', 'Nexus', 'GA4', 'OLED', 'ID'
];

test.describe('CATHEDRA BIBLE: Language & Navigation Integrity', () => {
  
  // Test both Mobile and Desktop (handled by Playwright Projects)
  
  test('Complete Bible Scan & Language Audit', async ({ page }, testInfo) => {
    const report: any[] = [];
    const session_id = `audit_${Date.now()}`;
    const isMobile = !!testInfo.project.name.includes('mobile');
    
    console.log(`Starting audit on ${testInfo.project.name} (${isMobile ? 'Mobile' : 'Desktop'})`);

    // 1. Audit Bible Library / Book List
    await page.goto('/bible');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Antigo Testamento', { timeout: 15000 });
    
    await auditPage(page, 'Bible Home', report, isMobile);

    // 2. Audit Specific Books (New Testament and problematic Old Testament books)
    const booksToTest = [
      { name: 'Mateus', abbr: 'Mt' },
      { name: 'João', abbr: 'Jo' },
      { name: 'Apocalipse', abbr: 'Ap' },
      { name: 'Tobias', abbr: 'Tb' }, // Often incorrectly shown as Tobit
      { name: 'Judite', abbr: 'Jt' }, // Often incorrectly shown as Judith
      { name: 'Sabedoria', abbr: 'Sb' } // Often incorrectly shown as Wisdom
    ];

    for (const book of booksToTest) {
      console.log(`Auditing Book: ${book.name}`);
      await page.goto(`/bible?book=${encodeURIComponent(book.abbr)}&ch=1`);
      
      // Wait for reader content
      await page.waitForSelector('text=Capítulo 1', { timeout: 15000 }).catch(() => {
        console.warn(`Timeout waiting for Capítulo 1 in ${book.name}`);
      });
      
      await auditPage(page, `Reading ${book.name} Ch 1`, report, isMobile);
      
      // Navigate to Chapter 2
      const nextBtn = page.locator('button').filter({ hasText: /Próximo|Seguinte/i });
      if (await nextBtn.count() > 0) {
        await nextBtn.first().click();
        await page.waitForTimeout(1000);
        await auditPage(page, `Reading ${book.name} Ch 2`, report, isMobile);
      }
    }

    // 3. Audit Search Functionality
    await page.goto('/bible');
    const searchTrigger = page.getByPlaceholder(/Pesquisar nas Escrituras/i);
    if (await searchTrigger.count() > 0) {
      await searchTrigger.click();
      await searchTrigger.fill('Jesus');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await auditPage(page, 'Search Results', report, isMobile);
    }

    // Save report for CI/Audit
    const fs = require('fs');
    const path = require('path');
    const reportDir = path.join(process.cwd(), 'REPORTS');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);
    
    const reportPath = path.join(reportDir, `bible-integrity-${testInfo.project.name}-${session_id}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      session_id,
      project: testInfo.project.name,
      device: page.viewportSize(),
      violations: report,
      summary: {
        total_checks: report.length,
        violations_count: report.reduce((acc, r) => acc + r.violations.length, 0)
      }
    }, null, 2));
    
    console.log(`Report saved to ${reportPath}`);
    
    // ASSERTION: Zero English occurrences allowed
    const totalViolations = report.reduce((acc, r) => acc + r.violations.length, 0);
    if (totalViolations > 0) {
      const details = report
        .filter(r => r.violations.length > 0)
        .map(r => `[${r.context}] ${r.violations.map(v => v.term).join(', ')}`)
        .join('; ');
      
      // Capture screenshot of failure for evidence
      await page.screenshot({ path: `REPORTS/failure-${testInfo.project.name}-${session_id}.png`, fullPage: true });
      
      expect(totalViolations, `Found ${totalViolations} English terms: ${details}. Check ${reportPath} and screenshots for details.`).toBe(0);
    }
  });
});

async function auditPage(page: Page, context: string, report: any[], isMobile: boolean) {
  const violations: any[] = [];
  
  // Get all visible text
  const bodyText = await page.evaluate(() => {
    // Get visible text only
    return Array.from(document.querySelectorAll('body *:not(script):not(style)'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      })
      .map(el => (el as HTMLElement).innerText)
      .join(' ');
  });
  
  for (const word of forbiddenWords) {
    if (allowlist.includes(word)) continue;
    
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(bodyText)) {
      // Find the specific elements containing the word for precision
      const occurrences = await page.evaluate((w) => {
        const results: any[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n: Node | null;
        const r = new RegExp(`\\b${w}\\b`, 'i');
        
        while (n = walker.nextNode()) {
          if (n.textContent && r.test(n.textContent)) {
            const parent = n.parentElement as HTMLElement;
            const style = window.getComputedStyle(parent);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              results.push({
                text: n.textContent.trim(),
                tagName: parent.tagName,
                className: parent.className
              });
            }
          }
        }
        return results;
      }, word);
      
      if (occurrences.length > 0) {
        violations.push({
          term: word,
          count: occurrences.length,
          contexts: occurrences.slice(0, 3) // first 3 occurrences for brevity
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
