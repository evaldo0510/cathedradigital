/**
 * Descobre automaticamente uma jornada ativa e uma etapa com pergunta final
 * para alimentar os testes E2E de /jornadas/:id/step e /jornadas/:id/conclusao.
 *
 * Uso:
 *   bun run scripts/discover-journey-ids.ts            # imprime export ... shell
 *   bun run scripts/discover-journey-ids.ts --json     # imprime JSON
 *   eval "$(bun run scripts/discover-journey-ids.ts)"  # exporta no shell atual
 *
 * Não requer service role — usa a anon key pública. Depende de RLS permitir
 * SELECT em journeys/journey_steps (o padrão do projeto).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://gpwrpmoniglarqwfyryp.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd3JwbW9uaWdsYXJxd2Z5cnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1ODYxNDMsImV4cCI6MjA4ODE2MjE0M30.wvD9JCiH1edvigTFg6RP3EFNIqXF7T9GPC01hTTiTTw';

const asJson = process.argv.includes('--json');
const log = (msg: string) => process.stderr.write(`${msg}\n`);

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: journeys, error: jErr } = await supabase
    .from('journeys')
    .select('id, title')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(20);

  if (jErr) throw new Error(`Falha ao listar jornadas: ${jErr.message}`);
  if (!journeys?.length) throw new Error('Nenhuma jornada ativa encontrada.');

  // Procura a primeira jornada com um step que tenha final_question/journal_prompt.
  for (const journey of journeys) {
    const { data: steps, error: sErr } = await supabase
      .from('journey_steps')
      .select('id, title, content, step_order')
      .eq('journey_id', journey.id)
      .order('step_order', { ascending: true });

    if (sErr || !steps?.length) continue;

    const stepWithPrompt = steps.find((s) => {
      const c = (s.content ?? {}) as Record<string, unknown>;
      return !!(c.final_question || c.journal_prompt || c.question);
    });

    if (!stepWithPrompt) continue;

    const payload = {
      E2E_JOURNEY_ID: journey.id,
      E2E_JOURNEY_STEP_ID: stepWithPrompt.id,
      _meta: {
        journey_title: journey.title,
        step_title: stepWithPrompt.title,
        step_order: stepWithPrompt.step_order,
      },
    };

    if (asJson) {
      process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      log(`✓ Jornada: ${journey.title}`);
      log(`✓ Etapa:   #${stepWithPrompt.step_order} — ${stepWithPrompt.title}`);
      process.stdout.write(`export E2E_JOURNEY_ID="${journey.id}"\n`);
      process.stdout.write(`export E2E_JOURNEY_STEP_ID="${stepWithPrompt.id}"\n`);
    }
    return;
  }

  throw new Error(
    'Nenhuma jornada ativa possui etapa com final_question/journal_prompt/question.',
  );
}

main().catch((err) => {
  log(`✗ ${err.message}`);
  process.exit(1);
});
