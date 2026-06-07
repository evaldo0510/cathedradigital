import { expect, test, describe, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const DEUTERO_ABBREVS = ['Tb', 'Jdt', 'Sb', 'Eclo', 'Br', '1Mc', '2Mc'];
const reportPath = path.resolve('reports/bible-lockdown-audit.json');
const failures: any[] = [];

const SUPABASE_URL = "https://gpwrpmoniglarqwfyryp.supabase.co";
const supabase = createClient(SUPABASE_URL, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd3JwbW9uaWdsYXJxd2Z5cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODYxNDMsImV4cCI6MjA4ODE2MjE0M30.wvD9JCiH1edvigTFg6RP3EFNIqXF7T9GPC01hTTiTTw");

const hashContent = (text: string) => createHash('sha256').update(text || '').digest('hex');

describe('Bible Source Lockdown (Parity & Zero External)', { timeout: 30000 }, () => {
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
    test(`Parity Check: ${abbr}`, async (context) => {
      const correlationId = `test_${abbr}_${Date.now()}`;
      const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
        body: JSON.stringify({ abbrev: abbr, chapter: 1 })
      });

      if (response.status === 404) return;

      expect(response.status).toBe(200);
      const data = await response.json();
      
      const { data: dbBook } = await supabase.from('bible_books').select('id').eq('abbrev', abbr).single();
      const { data: dbCh } = await supabase.from('bible_chapters').select('id').eq('book_id', dbBook?.id).eq('number', 1).single();
      const { data: dbVerses } = await supabase.from('bible_verses').select('number, text').eq('chapter_id', dbCh?.id).order('number');

      const apiText = data.verses.map((v: any) => v.text).join(' ');
      const dbText = dbVerses?.map((v: any) => v.text).join(' ') || '';

      const apiHash = hashContent(apiText);
      const dbHash = hashContent(dbText);

      if (apiHash !== dbHash) {
        failures.push({
          test_id: context.task.id,
          correlationId,
          timestamp: Date.now(),
          abbr, ch: 1,
          error: 'DIVERGÊNCIA DE HASH (INTEGRIDADE VIOLADA)',
          api_hash: apiHash,
          db_hash: dbHash,
          api_content: apiText.substring(0, 150) + "...",
          db_content: dbText.substring(0, 150) + "..."
        });
      }
      expect(apiHash).toBe(dbHash);
    });
  });

  test('Anti-Leak Guard: Deuterocanonical MUST fail if not in DB', async () => {
     const response = await fetch("https://gpwrpmoniglarqwfyryp.supabase.co/functions/v1/bible-text", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abbrev: '1Mc', chapter: 999 })
      });
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.isDeutero).toBe(true);
      expect(data.metadata?.source).toBeUndefined(); // Garante que não houve fallback
  });
});



