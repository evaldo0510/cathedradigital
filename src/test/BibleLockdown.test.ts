import { expect, test, describe, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from "@supabase/supabase-js";

const DEUTERO_ABBREVS = ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'];
const reportPath = path.resolve('reports/bible-lockdown-audit.json');
const failures: any[] = [];

// Supabase client for integrity check
const SUPABASE_URL = "https://gpwrpmoniglarqwfyryp.supabase.co";
// Using public anon key for reading
const supabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd3JwbW9uaWdsYXJxd2Z5cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODYxNDMsImV4cCI6MjA4ODE2MjE0M30.wvD9JCiH1edvigTFg6RP3EFNIqXF7T9GPC01hTTiTTw");

describe('Bible Source Lockdown (Zero External Deuterocanonical)', { timeout: 30000 }, () => {
  afterAll(() => {
    if (!fs.existsSync('reports')) fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      audit_date: new Date().toISOString(),
      build_timestamp: Date.now(),
      status: failures.length === 0 ? 'PASSED' : 'FAILED',
      failure_count: failures.length,
      failures
    }, null, 2));
  });

  DEUTERO_ABBREVS.forEach(abbr => {
    test(`Lockdown & Integrity Audit: ${abbr}`, async (context) => {
      const chapters = [1]; // Primary check
      
      for (const ch of chapters) {
        const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ abbrev: abbr, chapter: ch })
        });

        if (response.status === 404) {
          const data = await response.json();
          if (!data.error?.includes('Cathedra')) {
             failures.push({ 
               test_id: context.task.id,
               timestamp: Date.now(),
               abbr, ch, 
               error: 'Falha no Lockdown: Fallback detectado ou erro genérico', 
               data 
             });
          }
          continue;
        }

        expect(response.status).toBe(200);
        const data = await response.json();
        
        // 1. Validar Fonte
        expect(data.metadata.source).toBe('Cathedra (Banco)');

        // 2. Validar Integridade (Comparação com Banco Real)
        const { data: dbBook } = await supabase.from('bible_books').select('id').eq('abbrev', abbr).single();
        const { data: dbCh } = await supabase.from('bible_chapters').select('id').eq('book_id', dbBook?.id).eq('number', ch).single();
        const { data: dbVerses } = await supabase.from('bible_verses').select('number, text').eq('chapter_id', dbCh?.id).order('number');

        const apiText = data.verses.map((v: any) => v.text).join(' ');
        const dbText = dbVerses?.map((v: any) => v.text).join(' ');

        if (apiText !== dbText) {
          failures.push({
            test_id: context.task.id,
            timestamp: Date.now(),
            abbr, ch,
            error: 'DIVERGÊNCIA DE DADOS',
            api_content: apiText?.substring(0, 100),
            db_content: dbText?.substring(0, 100)
          });
        }
        expect(apiText).toBe(dbText);

        // 3. Validar Idioma
        const englishIndicators = [/\bthe\b/i, /\band\b/i, /\bwith\b/i];
        let hasEnglish = englishIndicators.some(reg => reg.test(apiText));

        if (hasEnglish) {
          failures.push({
            test_id: context.task.id,
            timestamp: Date.now(),
            abbr, ch,
            error: 'IDIOMA INVÁLIDO',
            evidence: apiText.substring(0, 200) + "..."
          });
        }
        expect(hasEnglish).toBe(false);
      }
    });
  });
});


