import { expect, test, describe, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const DEUTERO_ABBREVS = ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'];
const reportPath = path.resolve('reports/bible-lockdown-audit.json');
const failures: any[] = [];

describe('Bible Source Lockdown (Zero External Deuterocanonical)', { timeout: 30000 }, () => {
  afterAll(() => {
    if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      audit_date: new Date().toISOString(),
      status: failures.length === 0 ? 'PASSED' : 'FAILED',
      failure_count: failures.length,
      failures
    }, null, 2));
  });

  DEUTERO_ABBREVS.forEach(abbr => {
    test(`Lockdown & Language Audit: ${abbr}`, async () => {
      // Testar capítulo 1 e um capítulo aleatório (se aplicável)
      const chapters = [1, 2]; 
      
      for (const ch of chapters) {
        const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ abbrev: abbr, chapter: ch })
        });

        if (response.status === 404) {
          // Se não estiver no banco, o lockdown deve garantir erro explícito, não fallback
          const data = await response.json();
          if (!data.error?.includes('Cathedra')) {
             failures.push({ abbr, ch, error: 'Falha no Lockdown: Fallback detectado ou erro genérico', data });
          }
          continue;
        }

        expect(response.status).toBe(200);
        const data = await response.json();
        
        // 1. Validar Fonte
        if (data.metadata.source !== 'Cathedra (Banco)') {
           failures.push({ abbr, ch, error: 'FONTE INVÁLIDA', expected: 'Cathedra (Banco)', received: data.metadata.source });
        }
        expect(data.metadata.source).toBe('Cathedra (Banco)');

        // 2. Validar Idioma (Detector de Inglês)
        const allText = data.verses.map((v: any) => v.text).join(' ');
        const englishIndicators = [/\bthe\b/i, /\band\b/i, /\bwith\b/i, /\bshall\b/i];
        
        let hasEnglish = false;
        englishIndicators.forEach(reg => {
          if (reg.test(allText)) {
            hasEnglish = true;
          }
        });

        if (hasEnglish) {
          failures.push({
            abbr, ch,
            error: 'IDIOMA INVÁLIDO (INGLÊS DETECTADO)',
            evidence: allText.substring(0, 200) + "..."
          });
        }
        
        expect(hasEnglish, `Inglês detectado em ${abbr} Cap ${ch}`).toBe(false);
      }
    });
  });

  test('Security Guard: Bloqueio Total de Fallback Externo', async () => {
    const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abbrev: '1Mc', chapter: 999 }) // Capítulo inexistente
    });
    
    expect(response.status).toBe(404);
    const data = await response.json();
    // A mensagem deve ser explícita sobre o banco Cathedra (sem fallback)
    expect(data.error).toContain('Cathedra');
  });
});

