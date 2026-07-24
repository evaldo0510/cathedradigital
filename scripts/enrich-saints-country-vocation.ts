/**
 * enrich-saints-country-vocation.ts
 *
 * Preenche automaticamente os campos `country` e `vocation` na tabela
 * `saints` para registros que ainda não possuem esses dados.
 *
 * Estratégia:
 *  1. Consulta santos com country IS NULL OR vocation IS NULL.
 *  2. Aplica heurística determinística sobre nome, título, categoria
 *     e biografia para inferir país e vocação.
 *  3. Opcionalmente (--ai) usa o Lovable AI Gateway como fallback
 *     quando a heurística falhar, com prompt estrito (nunca inventar).
 *  4. Escreve em lotes (batch UPDATE via upsert individual).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   bun run scripts/enrich-saints-country-vocation.ts [--limit=200] [--ai] [--dry]
 *
 * Requisitos:
 *   - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   - LOVABLE_API_KEY (apenas se --ai for passado)
 *
 * O script é idempotente: sempre pula quem já tem country e vocation.
 */

import { createClient } from '@supabase/supabase-js';

interface EnrichCandidate {
  id: string;
  name: string;
  title: string | null;
  category: string | null;
  century: number | null;
  country: string | null;
  vocation: string | null;
  full_bio: string | null;
  historical_context: string | null;
  patron_of: string[] | null;
}

const argv = process.argv.slice(2);
const flag = (name: string) => argv.some((a) => a === `--${name}`);
const value = (name: string, fallback = '') => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

const LIMIT = Number(value('limit', '200'));
const USE_AI = flag('ai');
const DRY = flag('dry');

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
  process.exit(1);
}
if (USE_AI && !LOVABLE_API_KEY) {
  console.error('❌ --ai requer LOVABLE_API_KEY no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Heurísticas ─────────────────────────────────────────────

const COUNTRY_MAP: Array<[RegExp, string]> = [
  [/\b(assis|padu[ao]|rom[ao]|napol|siena|florenç|it[áa]li)/i, 'Itália'],
  [/\b(lisieux|paris|par[íi]s|fran[çc]|lyon|marselha|avinh[ãa]o)/i, 'França'],
  [/\b([áa]vila|sevilha|toledo|espanha|castela|granada)/i, 'Espanha'],
  [/\b(cracovia|polônia|polonia|varsóvia|wadowice)/i, 'Polônia'],
  [/\b(alemanha|munique|colônia|colonia|bavária|bavaria)/i, 'Alemanha'],
  [/\b(irlanda|dublin)/i, 'Irlanda'],
  [/\b(inglaterra|londres|canterbury)/i, 'Inglaterra'],
  [/\b(portugal|lisboa|coimbra|braga|porto)/i, 'Portugal'],
  [/\b(brasil|s[ãa]o paulo|rio de janeiro|bahia|anchieta)/i, 'Brasil'],
  [/\b(m[ée]xic|guadalupe)/i, 'México'],
  [/\b(argentina|buenos aires)/i, 'Argentina'],
  [/\b(gr[ée]cia|atenas|bizant|constantinop|éfeso|efeso)/i, 'Grécia'],
  [/\b(egito|alexandria|nitria|tebaida)/i, 'Egito'],
  [/\b(sí?ria|antioquia|damasco)/i, 'Síria'],
  [/\b(palestin|jerusalé|nazaré|belé)/i, 'Palestina'],
  [/\b(turqui|capadócia|capadocia|smir|niceia)/i, 'Turquia'],
  [/\b(hungria|budapeste)/i, 'Hungria'],
  [/\b(áustria|austria|viena)/i, 'Áustria'],
  [/\b(su[íi]ç|zurique|genebra)/i, 'Suíça'],
  [/\b(b[ée]lgic|bruxelas)/i, 'Bélgica'],
  [/\b(holanda|amsterdã|amsterda)/i, 'Holanda'],
  [/\b(r[úu]ssia|moscou|kiev)/i, 'Rússia'],
  [/\b(estados unidos|eua|nova york|filadélfia)/i, 'Estados Unidos'],
];

const VOCATION_MAP: Array<[RegExp, string]> = [
  [/\b(papa|sumo pontífice)\b/i, 'Papa'],
  [/\b(bispo|arcebispo|patriarca|metropolita)\b/i, 'Bispo'],
  [/\b(cardeal)\b/i, 'Cardeal'],
  [/\b(padre|presbítero|sacerdote|pároco)\b/i, 'Sacerdote'],
  [/\b(diácono)\b/i, 'Diácono'],
  [/\b(monge|monja|eremita|anacoreta|abade|abadessa)\b/i, 'Vida Monástica'],
  [/\b(freir[ao]|religios[ao]|carmelita|dominican|francisc|jesuít|beneditin|clariss|salesian|redentorist)/i, 'Vida Religiosa'],
  [/\b(fundador|fundadora)\b/i, 'Fundador(a)'],
  [/\b(mártir)\b/i, 'Mártir'],
  [/\b(doutor da igreja|doutora da igreja)\b/i, 'Doutor(a) da Igreja'],
  [/\b(virgem|virgindade consagrada)\b/i, 'Virgem consagrada'],
  [/\b(missionári[ao])\b/i, 'Missionário(a)'],
  [/\b(rei|rainha|imperador|imperatriz|príncipe|princesa)\b/i, 'Nobreza cristã'],
  [/\b(leig[ao]|casad[ao]|mãe de família|pai de família)\b/i, 'Leigo(a)'],
  [/\b(profeta|patriarca do antigo testamento)\b/i, 'Patriarca / Profeta'],
  [/\b(apóstolo|evangelista)\b/i, 'Apóstolo'],
];

const CATEGORY_TO_VOCATION: Record<string, string> = {
  pope: 'Papa',
  martyr: 'Mártir',
  doctor: 'Doutor(a) da Igreja',
  apostle: 'Apóstolo',
  founder: 'Fundador(a)',
  virgin: 'Virgem consagrada',
  bishop: 'Bispo',
  monk: 'Vida Monástica',
  religious: 'Vida Religiosa',
  layperson: 'Leigo(a)',
};

function inferHeuristic(c: EnrichCandidate) {
  const haystack = [
    c.name,
    c.title,
    c.historical_context,
    c.full_bio,
    (c.patron_of || []).join(' '),
  ].filter(Boolean).join(' \n ');

  let country: string | null = c.country ?? null;
  if (!country) {
    for (const [re, name] of COUNTRY_MAP) {
      if (re.test(haystack)) { country = name; break; }
    }
  }

  let vocation: string | null = c.vocation ?? null;
  if (!vocation) {
    for (const [re, name] of VOCATION_MAP) {
      if (re.test(haystack)) { vocation = name; break; }
    }
  }
  if (!vocation && c.category && CATEGORY_TO_VOCATION[c.category]) {
    vocation = CATEGORY_TO_VOCATION[c.category];
  }

  return { country, vocation };
}

// ── AI fallback (opcional) ───────────────────────────────────

async function inferWithAI(c: EnrichCandidate): Promise<{ country: string | null; vocation: string | null }> {
  const prompt = `Você é um historiador católico. Com base APENAS nos dados fornecidos,
retorne JSON com dois campos: country (país de origem ou principal atuação, em português)
e vocation (uma vocação eclesial curta: Papa, Bispo, Sacerdote, Fundador(a),
Mártir, Doutor(a) da Igreja, Vida Monástica, Vida Religiosa, Leigo(a), Apóstolo,
Missionário(a), Virgem consagrada, Nobreza cristã). Se não houver base
suficiente para um campo, retorne null nele. NUNCA invente.

Santo: ${c.name}
Título: ${c.title ?? '-'}
Categoria: ${c.category ?? '-'}
Século: ${c.century ?? '-'}
Contexto: ${(c.historical_context ?? '').slice(0, 400)}
Biografia: ${(c.full_bio ?? '').slice(0, 1200)}
Padroados: ${(c.patron_of ?? []).join(', ') || '-'}`;

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Lovable-API-Key': LOVABLE_API_KEY!,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Responda apenas com JSON válido: {"country": string|null, "vocation": string|null}. Sem markdown, sem comentários.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    console.warn(`   ⚠ AI ${res.status} para ${c.name}`);
    return { country: null, vocation: null };
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    return {
      country: parsed.country && typeof parsed.country === 'string' ? parsed.country.trim() : null,
      vocation: parsed.vocation && typeof parsed.vocation === 'string' ? parsed.vocation.trim() : null,
    };
  } catch {
    return { country: null, vocation: null };
  }
}

// ── Runner ──────────────────────────────────────────────────

async function main() {
  console.log(`🧭 Enriquecimento de country/vocation (limit=${LIMIT}, ai=${USE_AI}, dry=${DRY})`);

  const { data, error } = await supabase
    .from('saints')
    .select('id, name, title, category, century, country, vocation, full_bio, historical_context, patron_of')
    .or('country.is.null,vocation.is.null')
    .order('name')
    .limit(LIMIT);

  if (error) {
    console.error('❌ Erro ao ler saints:', error);
    process.exit(1);
  }

  const candidates = (data ?? []) as EnrichCandidate[];
  console.log(`📚 ${candidates.length} candidatos.`);

  let heuristicHits = 0;
  let aiHits = 0;
  let updated = 0;
  let skipped = 0;

  for (const c of candidates) {
    const h = inferHeuristic(c);
    let country = h.country;
    let vocation = h.vocation;

    if ((!country || !vocation) && USE_AI) {
      const ai = await inferWithAI(c);
      if (!country && ai.country) { country = ai.country; aiHits++; }
      if (!vocation && ai.vocation) { vocation = ai.vocation; aiHits++; }
      // rate-limit gentil
      await new Promise((r) => setTimeout(r, 400));
    }

    const patch: Record<string, string> = {};
    if (!c.country && country) patch.country = country;
    if (!c.vocation && vocation) patch.vocation = vocation;

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }
    heuristicHits++;

    if (DRY) {
      console.log(`  · ${c.name} →`, patch);
      continue;
    }

    const { error: updErr } = await supabase.from('saints').update(patch).eq('id', c.id);
    if (updErr) {
      console.warn(`   ⚠ update falhou para ${c.name}:`, updErr.message);
    } else {
      updated++;
    }
  }

  console.log(`\n✅ Finalizado.`);
  console.log(`   heurística:  ${heuristicHits}`);
  console.log(`   ai fallback: ${aiHits}`);
  console.log(`   atualizados: ${updated}`);
  console.log(`   pulados:     ${skipped}`);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
