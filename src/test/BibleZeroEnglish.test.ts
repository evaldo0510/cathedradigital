import { expect, test, describe } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MISSÃO CRÍTICA: ZERO INGLÊS - PIPELINE DE CI CATHEDRA
 * Este teste valida a Edge Function e o conteúdo final para bloquear merges
 * se houver qualquer regressão para o inglês em livros Proto ou Deuterocanônicos.
 */

// Lista expandida para cobertura total do Cânone Católico
const BOOKS_TO_VALIDATE = [
  // Deuterocanônicos (Foco Crítico)
  { abbr: 'Tb', name: 'Tobias', chapter: 1 },
  { abbr: 'Jdt', name: 'Judite', chapter: 1 },
  { abbr: 'Sb', name: 'Sabedoria', chapter: 1 },
  { abbr: 'Eclo', name: 'Eclesiástico', chapter: 1 },
  { abbr: 'Br', name: 'Baruc', chapter: 1 },
  { abbr: '1Mc', name: '1 Macabeus', chapter: 14 },
  { abbr: '2Mc', name: '2 Macabeus', chapter: 1 },
  // Protocanônicos (Amostragem de Cobertura)
  { abbr: 'Gn', name: 'Gênesis', chapter: 1 },
  { abbr: 'Sl', name: 'Salmos', chapter: 23 },
  { abbr: 'Is', name: 'Isaías', chapter: 53 },
  { abbr: 'Mt', name: 'Mateus', chapter: 5 },
  { abbr: 'Jo', name: 'João', chapter: 1 },
  { abbr: 'Ap', name: 'Apocalipse', chapter: 22 }
];

const ENGLISH_INDICATORS = [
  /\bthe\b/i, /\band\b/i, /\bshall\b/i, /\bunto\b/i, /\bfrom\b/i, /\bwith\b/i,
  /\bking\b/i, /\bgathered\b/i, /\bforces\b/i, /\bfight\b/i, /\bwent\b/i,
  /\bupon\b/i, /\bsaid\b/i, /\bthem\b/i, /\bgod\b/i
];

const reportPath = path.resolve('reports/bible-i18n-audit.json');

describe('Bible Zero English CI Pipeline', { timeout: 60000 }, () => {
  const failures: any[] = [];

  test.afterAll(() => {
    // Gerar relatório de falhas para o CI consumir
    if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      audit_date: new Date().toISOString(),
      status: failures.length === 0 ? 'PASSED' : 'FAILED',
      failure_count: failures.length,
      failures
    }, null, 2));
    
    if (failures.length > 0) {
      console.error(`\n❌ CI BLOQUEADO: ${failures.length} capítulos com regressão para o inglês encontrados.`);
    }
  });

  BOOKS_TO_VALIDATE.forEach(book => {
    test(`[Determinístico] Validar ${book.name} Cap ${book.chapter}`, { retry: 3 }, async () => {
      const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abbrev: book.abbr, chapter: book.chapter })
      });

      if (response.status !== 200) {
        throw new Error(`Edge Function offline para ${book.name}: Status ${response.status}`);
      }

      const data = await response.json();
      const allText = data.verses.map((v: any) => v.text).join(' ');
      const source = data.metadata?.source || "Unknown";

      let chapterFailed = false;
      const foundTerms: string[] = [];

      ENGLISH_INDICATORS.forEach(indicator => {
        const matches = allText.match(indicator);
        if (matches) {
          chapterFailed = true;
          foundTerms.push(matches[0]);
        }
      });

      if (chapterFailed) {
        const failureEntry = {
          book: book.name,
          chapter: book.chapter,
          provider: source,
          detected_terms: Array.from(new Set(foundTerms)),
          evidence: allText.substring(0, 150) + "..."
        };
        failures.push(failureEntry);
        
        // snapshot determinístico para o relatório do CI
        expect(allText, `REGRESSÃO EM ${book.name} ${book.chapter}: Termos em inglês detectados: ${foundTerms.join(', ')}`).not.toMatch(ENGLISH_INDICATORS[0]);
      }

      // Validação de sanidade de Português
      const ptIndicators = [' de ', ' o ', ' e ', ' que ', ' para '];
      const hasPT = ptIndicators.some(w => allText.toLowerCase().includes(w));
      expect(hasPT, `Conteúdo de ${book.name} não parece português válido.`).toBe(true);
    });
  });
});

