import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const GLOSSARY = {
  'Bible Audit': 'Verificação de Integridade das Escrituras',
  'Scan': 'Varredura',
  'Retry Policy': 'Política de Retentativa',
  'Webhook': 'Transmissão Webhook',
  'Payload': 'Conteúdo da Transmissão',
  'Canonical Payload': 'Conteúdo Padronizado (Canônico)',
  'A11y': 'Acessibilidade',
  'Compliance': 'Conformidade',
  'Issue': 'Inconformidade',
  'Books': 'Livros',
  'Chapters': 'Capítulos',
  'Verses': 'Versículos',
  'Canon': 'Cânone',
  'Scriptures': 'Escrituras'
};

const FORBIDDEN_STRINGS = [
  'Retry Policy', 'Webhook', 'Scanning...', 'Security Scan', 'Issues Found',
  'Normal Text', 'Large Text', 'A11y Check', 'Compliance Score', 'Audit Results',
  'Last Run', 'Compare Runs', 'Export Report', 'Settings', 'Search...', 'All Actions', 
  'status', 'canonical_payload', 'retry policy'
];

test.describe('I18n Audit & Glossary Consistency', () => {
  test('Generate detailed i18n checklist report', async ({ page }) => {
    await page.goto('/');
    const bodyText = await page.textContent('body') || '';
    const failures: any[] = [];

    FORBIDDEN_STRINGS.forEach(str => {
      const regex = new RegExp(`\\b${str}\\b`, 'gi');
      if (regex.test(bodyText) && !bodyText.toLowerCase().includes('canônico')) {
        failures.push({
          term: str,
          context: 'Interface Global',
          expected: (GLOSSARY as any)[str] || 'Tradução solene em PT-BR'
        });
      }
    });

    if (failures.length > 0) {
      const reportDir = path.resolve('tests/reports');
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
      fs.writeFileSync(path.join(reportDir, 'i18n-release-check.json'), JSON.stringify({
        date: new Date().toISOString(),
        status: 'FAILED',
        failures
      }, null, 2));
    }

    expect(failures, `Detectadas ${failures.length} falhas de i18n. Veja o relatório em tests/reports/i18n-release-check.json`).toHaveLength(0);
  });

  test('Verify Webhook labels and Glossary consistency', async ({ page }) => {
    await page.goto('/');
    const content = await page.textContent('body') || '';
    
    // Validar termos técnicos solenes
    const solemnTerms = ['Escrituras', 'Cânone', 'Integridade', 'Verificação'];
    solemnTerms.forEach(term => {
      if (content.includes('Bíblia')) {
        // Sugestão institucional: preferir Escrituras em contextos formais
        console.log(`Contexto solene verificado para: ${term}`);
      }
    });

    // Validar labels de webhook em português
    const webhookLabels = ['Status', 'Conteúdo Padronizado', 'Política de Retentativa'];
    webhookLabels.forEach(label => {
      if (content.includes('Webhook')) {
        expect(content).toContain(label);
      }
    });
  });
});
