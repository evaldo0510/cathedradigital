# Sprint 1.0 — Prayer Engine Unificado

Objetivo: eliminar o Rosário legado, transformar o Reader em motor genérico hierárquico (`PrayerReader → PrayerEngine → Section → Mystery → Block`) e migrar 100% do conteúdo hardcoded para o banco. Após a sprint, `/rosary` e `/oracao/rosario` renderizam o **mesmo** componente com dados exclusivamente do backend.

## Fase A — Arquitetura do Motor (código)

Criar em `src/prayer-engine/`:

- `types.ts` — `Prayer`, `PrayerSection`, `PrayerMystery`, `PrayerBlock`, `PrayerVariant`, `PrayerMode`.
- `PrayerEngine.ts` — máquina hierárquica (navegação section → mystery → block, próximo/anterior, salto, cálculo de progresso, seleção por dia da semana).
- `usePrayerEngine.ts` — hook que carrega estrutura + hidrata sessão + expõe API de navegação.
- `PrayerReader.tsx` — componente único (substitui `RosaryReader`), com slots para arte, meditação, áudio, referências.
- Sub-componentes reutilizáveis migrados do legado:
  - `PrayerArt.tsx` (SVG dos mistérios, extensível a Via Sacra/LH).
  - `PrayerProgress.tsx` (barra + timeline hierárquica).
  - `PrayerMysteryHeader.tsx` (título, evangelho, meditação).
  - `PrayerBlockRenderer.tsx` (renderiza cada tipo: texto, ave-maria contada, meditação, fátima, silêncio).
- Plugins: `PrayerModeSelector`, `PrayerAudioPlayer`, `PrayerFavoriteButton`, `ReaderContinuation` (já existem, apenas conectam).

## Fase B — Schema hierárquico (migration)

Novas tabelas em `public` (com GRANT + RLS pública de leitura, escrita apenas admin):

- `prayers` (já existe — adicionar coluna `engine_version int default 2`).
- `prayer_sections` — `id, prayer_id, slug, title, subtitle, order_index, weekday[]`.
- `prayer_mysteries` — `id, section_id, slug, title, subtitle, order_index, image_key, gospel_ref, meditation, weekday`.
- `prayer_blocks` — `id, mystery_id NULL, section_id NULL, type, content jsonb, count int, audio_key, order_index`. (Blocos podem pertencer direto à seção quando não há mistério — Via Sacra usará seção→estação→blocos; LH usará seção→hora→blocos.)
- `prayer_assets` — `id, key unique, kind (svg|image|audio), url, alt`.
- `prayer_references` — `id, block_id, kind (bible|catechism|glossary|saint), ref, label`.

RLS: `SELECT` público em todas; `INSERT/UPDATE/DELETE` apenas via `has_role(admin)`. GRANTs completos (`anon+authenticated` SELECT, `service_role` ALL).

Trigger `updated_at` em todas.

## Fase C — Seed do Rosário (insert)

Migrar de `src/features/rosary/data/mysteries.ts` + `PRAYER_TEXT` para linhas no banco:

- 1 `prayer` (rosario).
- 4 `prayer_sections` (Gozosos, Luminosos, Dolorosos, Gloriosos) com `weekday[]`.
- 20 `prayer_mysteries` com evangelho, meditação, imagem.
- Blocos por mistério: Anúncio, Pai Nosso, 10× Ave-Maria (bloco `type=repeat count=10`), Glória, Oração de Fátima, Meditação.
- Blocos globais de abertura/encerramento na seção.
- `prayer_assets` com as SVGs atuais (arquivos permanecem em `src/assets` referenciados por `key`).

## Fase D — Persistência 100% no banco

- `prayer_sessions` ganha `current_section_id`, `current_mystery_id`, `current_block_id`, `completed_block_ids uuid[]`.
- `usePrayerEngine` grava progresso a cada avanço (debounced) e restaura no retorno.
- Remover TODA leitura/gravação em `localStorage` do Rosário (favoritos continuam via `prayer_favorites` existente).

## Fase E — Integrações

- Cada `prayer_mystery.meditation` e cada `prayer_block.content` roda pelo Nexus automático (glossário/bíblia/santos) via componente existente.
- `ReaderContinuation` conectado ao novo `current_*_id`.
- IA (Logos) recebe contexto do mistério/bloco atual.

## Fase F — Remoção do legado

- Deletar: `src/features/rosary/data/mysteries.ts`, `RosarySession.tsx`, `RosaryTimeline.tsx` legado, `PRAYER_TEXT`, `RosaryReader.tsx` (substituído por `PrayerReader`).
- Rota `/rosary` passa a redirecionar para `/oracao/rosario` **ou** renderizar `<PrayerReader slug="rosario" />` — decisão: **redirect 301** para consolidar SEO.

## Ordem de execução

1. Migration Fase B (aprovação do usuário necessária).
2. Após aprovação: seed Fase C via insert tool.
3. Código Fases A/D/E em paralelo.
4. Remoção Fase F + smoke test Playwright (`/rosary` → redireciona; `/oracao/rosario` renderiza mistério do dia, avança blocos, persiste sessão).

## Riscos & mitigação

- **Perda visual**: SVGs preservados via `prayer_assets`, `PrayerArt` mantém 100% do design atual.
- **Sessões antigas**: adicionar migração de dados — sessões existentes recebem `current_*_id` NULL e reiniciam graciosamente.
- **Outras orações** (Via Sacra hoje em `ViaCrucis.tsx`): NÃO tocar nesta sprint. Migração acontece na Sprint 1.1 usando o mesmo schema.

## Entregáveis

- 1 migration (Fase B).
- 1 insert grande (Fase C — seed Rosário).
- ~10 arquivos novos em `src/prayer-engine/`.
- ~6 arquivos deletados (legado).
- 1 E2E `tests/e2e/rosario-prayer-engine.spec.ts`.

Confirma para eu **iniciar pela migration da Fase B**?
