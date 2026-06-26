// Diagnóstico read-only dos 73 livros do cânon católico.
// Actions:
//   run             → executa diagnóstico (admin OU cron via x-cron-secret)
//   list_runs       → últimas execuções
//   get_findings    → findings filtráveis por run_id/abbrev/type/severity
//   export          → CSV ou JSON dos findings + resumo por tipo/livro
//
// Verificações (todas read-only):
//   1. Livro existe em bible_books
//   2. Quantidade de capítulos vs cânon esperado
//   3. Capítulos faltantes (ranges)
//   4. Capítulos vazios (sem versículos)
//   5. Capítulos duplicados (mesmo number, mesmo book)
//   6. Idioma (amostra) — verifica palavras-chave PT
//   7. Metadata (testament + canonical_type) em bible_books

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { BIBLE_CANON } from "../_shared/bibleCanon.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? SUPABASE_SERVICE_ROLE_KEY;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Contagem canônica de capítulos (Bíblia católica PT, NAA + deuterocanônicos)
const EXPECTED_CHAPTERS: Record<string, number> = {
  Gn: 50, Ex: 40, Lv: 27, Nm: 36, Dt: 34, Js: 24, Jz: 21, Rt: 4,
  '1Sm': 31, '2Sm': 24, '1Rs': 22, '2Rs': 25, '1Cr': 29, '2Cr': 36,
  Ed: 10, Ne: 13, Et: 10, Jó: 42, Sl: 150, Pv: 31, Ec: 12, Ct: 8,
  Is: 66, Jr: 52, Lm: 5, Ez: 48, Dn: 14,
  Os: 14, Jl: 3, Am: 9, Ab: 1, Jn: 4, Mq: 7, Na: 3, Hc: 3, Sf: 3, Ag: 2, Zc: 14, Ml: 4,
  Mt: 28, Mc: 16, Lc: 24, Jo: 21, At: 28, Rm: 16, '1Co': 16, '2Co': 13,
  Gl: 6, Ef: 6, Fp: 4, Cl: 4, '1Ts': 5, '2Ts': 3, '1Tm': 6, '2Tm': 4,
  Tt: 3, Fm: 1, Hb: 13, Tg: 5, '1Pe': 5, '2Pe': 3, '1Jo': 5, '2Jo': 1, '3Jo': 1, Jd: 1, Ap: 22,
  Tb: 14, Jdt: 16, Sb: 19, Eclo: 51, Br: 6, '1Mc': 16, '2Mc': 15,
};

// Heurística simples PT: presença de caracteres acentuados típicos ou palavras-função
function isLikelyPortuguese(text: string): boolean {
  if (!text || text.length < 20) return false;
  const sample = text.slice(0, 1000).toLowerCase();
  const ptHints = /\b(que|de|os|as|do|da|com|para|não|e o |senhor|deus|disse)\b/g;
  const matches = sample.match(ptHints);
  return (matches?.length ?? 0) >= 3;
}

interface Finding {
  abbrev: string;
  book_name: string;
  chapter: number | null;
  finding_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, unknown>;
}

async function runDiagnostic(
  admin: ReturnType<typeof createClient>,
  triggeredBy: string,
  triggeredUser: string | null,
): Promise<{ run_id: string; total_findings: number; total_books: number; total_chapters: number; duration_ms: number; status: string }> {
  const startAt = Date.now();

  const { data: runRow, error: insErr } = await admin
    .from('bible_diagnostic_runs')
    .insert({ status: 'running', triggered_by: triggeredBy, triggered_user: triggeredUser })
    .select('id')
    .single();
  if (insErr || !runRow) throw new Error(insErr?.message ?? 'failed to create run');
  const runId = runRow.id as string;

  const findings: Finding[] = [];
  let totalChapters = 0;

  try {
    // Carrega todos os livros + capítulos em uma só consulta
    const { data: books, error: bookErr } = await admin
      .from('bible_books')
      .select('id, abbrev, name, testament, canonical_type, chapters_count');
    if (bookErr) throw bookErr;

    const byAbbrev = new Map<string, { id: string; abbrev: string; name: string; testament: string | null; canonical_type: string | null; chapters_count: number }>();
    for (const b of (books ?? []) as Array<{ id: string; abbrev: string; name: string; testament: string | null; canonical_type: string | null; chapters_count: number }>) {
      byAbbrev.set(b.abbrev, b);
    }

    for (const canon of BIBLE_CANON) {
      const book = byAbbrev.get(canon.abbr);
      if (!book) {
        findings.push({
          abbrev: canon.abbr, book_name: canon.name, chapter: null,
          finding_type: 'missing_book', severity: 'critical',
          message: `Livro ${canon.abbr} (${canon.name}) ausente em bible_books`,
        });
        continue;
      }

      // Metadata
      const expectedTestament = canon.testament === 'OT' ? 'antigo' : 'novo';
      const expectedCanonType = canon.deuterocanonical ? 'deuterocanonico' : 'protocanonico';
      if (book.testament !== expectedTestament || book.canonical_type !== expectedCanonType) {
        findings.push({
          abbrev: canon.abbr, book_name: canon.name, chapter: null,
          finding_type: 'metadata_invalid', severity: 'warning',
          message: `Metadados divergentes (testament=${book.testament}/${expectedTestament}, canonical_type=${book.canonical_type}/${expectedCanonType})`,
          metadata: { expected: { testament: expectedTestament, canonical_type: expectedCanonType }, actual: { testament: book.testament, canonical_type: book.canonical_type } },
        });
      }

      // Capítulos do livro
      const { data: chapters } = await admin
        .from('bible_chapters')
        .select('id, number')
        .eq('book_id', book.id)
        .order('number', { ascending: true });

      const chapterNums = (chapters ?? []).map(c => c.number as number);
      totalChapters += chapterNums.length;

      const expected = EXPECTED_CHAPTERS[canon.abbr] ?? book.chapters_count;
      if (chapterNums.length !== expected) {
        findings.push({
          abbrev: canon.abbr, book_name: canon.name, chapter: null,
          finding_type: 'chapter_count_mismatch', severity: 'error',
          message: `Capítulos: ${chapterNums.length} encontrados / ${expected} esperados`,
          metadata: { found: chapterNums.length, expected, declared: book.chapters_count },
        });
      }

      // Duplicados
      const seen = new Set<number>();
      const dups = new Set<number>();
      for (const n of chapterNums) {
        if (seen.has(n)) dups.add(n); else seen.add(n);
      }
      for (const d of dups) {
        findings.push({
          abbrev: canon.abbr, book_name: canon.name, chapter: d,
          finding_type: 'duplicate_chapter', severity: 'error',
          message: `Capítulo ${d} duplicado`,
        });
      }

      // Capítulos faltantes
      for (let i = 1; i <= expected; i++) {
        if (!seen.has(i)) {
          findings.push({
            abbrev: canon.abbr, book_name: canon.name, chapter: i,
            finding_type: 'missing_chapter', severity: 'error',
            message: `Capítulo ${i} ausente`,
          });
        }
      }

      // Amostra: cap 1 + último → checa versículos + idioma
      const sampleNums = [1, expected].filter((n, idx, arr) => arr.indexOf(n) === idx);
      for (const n of sampleNums) {
        const ch = (chapters ?? []).find(c => c.number === n);
        if (!ch) continue;
        const { data: verses } = await admin
          .from('bible_verses')
          .select('text')
          .eq('chapter_id', ch.id)
          .order('number', { ascending: true })
          .limit(50);
        const vs = (verses ?? []) as Array<{ text: string }>;
        if (vs.length === 0) {
          findings.push({
            abbrev: canon.abbr, book_name: canon.name, chapter: n,
            finding_type: 'empty_chapter', severity: 'critical',
            message: `Capítulo ${n} sem versículos`,
          });
          continue;
        }
        const joined = vs.map(v => v.text).join(' ');
        if (!isLikelyPortuguese(joined)) {
          findings.push({
            abbrev: canon.abbr, book_name: canon.name, chapter: n,
            finding_type: 'language_mismatch', severity: 'warning',
            message: `Capítulo ${n} não parece estar em português`,
            metadata: { sample: joined.slice(0, 120) },
          });
        }
      }
    }

    // Persistir findings em lote
    if (findings.length > 0) {
      const payload = findings.map(f => ({ ...f, run_id: runId }));
      const chunkSize = 200;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await admin.from('bible_diagnostic_findings').insert(chunk);
        if (error) throw error;
      }
    }

    const duration = Date.now() - startAt;
    const status = findings.some(f => f.severity === 'critical' || f.severity === 'error') ? 'warning' : 'ok';

    await admin.from('bible_diagnostic_runs').update({
      status, completed_at: new Date().toISOString(),
      total_books_checked: BIBLE_CANON.length,
      total_chapters_checked: totalChapters,
      total_findings: findings.length,
      duration_ms: duration,
    }).eq('id', runId);

    return { run_id: runId, total_findings: findings.length, total_books: BIBLE_CANON.length, total_chapters: totalChapters, duration_ms: duration, status };
  } catch (e) {
    const duration = Date.now() - startAt;
    await admin.from('bible_diagnostic_runs').update({
      status: 'error', completed_at: new Date().toISOString(),
      duration_ms: duration, error: (e as Error).message,
      total_findings: findings.length,
    }).eq('id', runId);
    throw e;
  }
}

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]): string {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const out = [headers.join(",")];
  for (const r of rows) out.push(headers.map(h => esc(r[h])).join(","));
  return out.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    let params: Record<string, unknown> = {};
    if (req.method === "POST") {
      try { params = await req.json(); } catch { params = {}; }
    } else {
      params = Object.fromEntries(url.searchParams.entries());
    }
    const action = (params.action as string) ?? 'list_runs';

    // Auth: aceita cron secret OU admin user
    const cronSecret = req.headers.get('x-cron-secret');
    const isCron = cronSecret && cronSecret === CRON_SECRET;
    let userId: string | null = null;

    if (!isCron) {
      const authHeader = req.headers.get('Authorization') ?? '';
      if (!authHeader.startsWith('Bearer ')) return json({ error: 'Unauthorized', code: 'no_token' }, 401);
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
      if (cErr || !claims?.claims?.sub) return json({ error: 'Unauthorized', code: 'invalid_token' }, 401);
      userId = claims.claims.sub as string;
      const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
      if (!roleRow) return json({ error: 'Forbidden', code: 'not_admin' }, 403);
    }

    // ----- run -----
    if (action === 'run') {
      const result = await runDiagnostic(admin, isCron ? 'cron' : 'manual', userId);
      return json({ action, ...result });
    }

    // ----- list_runs -----
    if (action === 'list_runs') {
      const limit = Math.max(1, Math.min(50, Number(params.limit ?? 20) | 0));
      const { data, error } = await admin
        .from('bible_diagnostic_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) return json({ error: error.message }, 500);
      return json({ action, rows: data ?? [] });
    }

    // ----- get_findings / export -----
    if (action === 'get_findings' || action === 'export') {
      const runId = params.run_id as string | undefined;
      let q = admin.from('bible_diagnostic_findings').select('*').order('created_at', { ascending: true });
      if (runId) q = q.eq('run_id', runId);
      if (params.abbrev) q = q.eq('abbrev', String(params.abbrev));
      if (params.finding_type) q = q.eq('finding_type', String(params.finding_type));
      if (params.severity) q = q.eq('severity', String(params.severity));
      const { data, error } = await q.limit(5000);
      if (error) return json({ error: error.message }, 500);
      const rows = (data ?? []) as Array<Record<string, unknown>>;

      // Resumos
      const byType: Record<string, number> = {};
      const byBook: Record<string, number> = {};
      for (const r of rows) {
        byType[String(r.finding_type)] = (byType[String(r.finding_type)] ?? 0) + 1;
        byBook[String(r.abbrev)] = (byBook[String(r.abbrev)] ?? 0) + 1;
      }

      if (action === 'export') {
        const fmt = (params.format as string ?? 'json').toLowerCase();
        if (fmt === 'csv') {
          const headers = ['run_id','abbrev','book_name','chapter','finding_type','severity','message','metadata','created_at'];
          const csv = toCsv(rows, headers);
          const summaryCsv = toCsv(
            [
              ...Object.entries(byType).map(([k, v]) => ({ group: 'by_type', key: k, count: v })),
              ...Object.entries(byBook).map(([k, v]) => ({ group: 'by_book', key: k, count: v })),
            ],
            ['group','key','count'],
          );
          return json({ action, run_id: runId ?? null, total: rows.length, files: { findings_csv: csv, summary_csv: summaryCsv } });
        }
        return json({ action, run_id: runId ?? null, total: rows.length, summary: { by_type: byType, by_book: byBook }, findings: rows });
      }

      return json({ action, run_id: runId ?? null, total: rows.length, summary: { by_type: byType, by_book: byBook }, rows });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    console.error('[bible-canon-diagnose]', e);
    return json({ error: (e as Error).message ?? 'Internal error' }, 500);
  }
});
