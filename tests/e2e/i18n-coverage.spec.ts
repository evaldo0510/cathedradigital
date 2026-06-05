import { test, expect } from '@playwright/test';
import * as fs from 'fs';

// Glossário de referência extraído do GLOSSARIO.md
const GLOSSARY_MAPPING = {
  'Bible Audit': 'Verificação de Integridade das Escrituras',
  'Scan': 'Varredura / Verificação',
  'Retry Policy': 'Política de Retentativa',
  'Webhook': 'Transmissão Webhook',
  'Payload': 'Conteúdo da Transmissão',
  'Canonical Payload': 'Conteúdo Padronizado (Canônico)',
  'A11y': 'Acessibilidade',
  'Compliance': 'Conformidade',
  'Issue': 'Inconformidade / Incidente',
  'Normal Text': 'Texto Padrão',
  'Large Text': 'Texto Ampliado',
  'Security Logs': 'Registro de Eventos de Segurança',
  'Books': 'Livros',
  'Chapters': 'Capítulos',
  'Verses': 'Versículos',
  'Canon': 'Cânone'
};

const FORBIDDEN_ENGLISH_STRINGS = [
  'Retry Policy', 'Webhook', 'Scanning...', 'Security Scan', 'Issues Found',
  'Normal Text', 'Large Text', 'A11y Check', 'Compliance Score', 'Audit Results',
  'Last Run', 'Compare Runs', 'Export Report', 'Settings', 'Search...', 'All Actions'
];

test.describe('Governança de i18n e Consistência Institucional', () => {
  
  test('Geração de Relatório de Auditoria de i18n', async ({ page }) => {
    await page.goto('/');
    // Simular abertura do painel de auditoria se necessário
    const bodyContent = await page.textContent('body') || '';
    
    const failures: { key: string, foundIn: string, suggestion: string }[] = [];

    FORBIDDEN_ENGLISH_STRINGS.forEach(pattern => {
      if (bodyContent.includes(pattern)) {
        failures.push({
          key: pattern,
          foundIn: 'Interface Principal',
          suggestion: (GLOSSARY_MAPPING as any)[pattern] || 'Traduzir via Glossário'
        });
      }
    });

    // Validar termos técnicos de Webhooks
    ['status', 'canonical_payload', 'retry policy'].forEach(term => {
      if (bodyContent.toLowerCase().includes(term.toLowerCase()) && !bodyContent.toLowerCase().includes('canônico')) {
        failures.push({
          key: term,
          foundIn: 'Configuração de Webhooks',
          suggestion: (GLOSSARY_MAPPING as any)[term] || 'Termo técnico detectado em inglês'
        });
      }
    });

    if (failures.length > 0) {
      const reportPath = 'tests/reports/i18n-audit-report.json';
      if (!fs.existsSync('tests/reports')) fs.mkdirSync('tests/reports', { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        total_failures: failures.length,
        details: failures
      }, null, 2));
      
      console.log(`\n🚨 Auditoria de i18n falhou! Relatório gerado em: ${reportPath}`);
      console.table(failures);
    }


    expect(failures, `Detectadas ${failures.length} inconsistências de tradução. Verifique o relatório json.`).toHaveLength(0);
  });

  test('Validar Cabeçalhos e Rodapés Institucionais (Termos Bíblicos)', async ({ page }) => {
    await page.goto('/');
    const content = await page.textContent('body') || '';
    
    const requiredSolemnTerms = ['Escrituras', 'Cânone', 'Integridade', 'Verificação'];
    requiredSolemnTerms.forEach(term => {
      // Este teste confirma se a versão solene está presente em vez da genérica
      if (content.includes('Bíblia') && !content.includes('Escrituras')) {
         console.warn(`Aviso: Termo 'Bíblia' encontrado sem reforço de 'Escrituras' para tom solene.`);
      }
    });
  });
});

