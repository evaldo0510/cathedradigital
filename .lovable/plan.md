# Sprint 1.0 · Fase E — Persistência Hierárquica + Nexus Automático

Consolidar o Prayer Engine v2 como motor único de todas as devoções, partindo do Rosário. Zero conteúdo hardcoded, retomada exata, Nexus automático por bloco, marcadores espirituais e resumo pós-sessão.

## Escopo desta entrega (ondas curtas, uma por vez)

Cada onda entra em um único ciclo de aprovação → build → verificação, sem começar a próxima antes da anterior estar validada.

### Onda 1 — Persistência hierárquica (backend + hook)

- Aproveitar as colunas já existentes em `prayer_sessions` (`current_section_id`, `current_mystery_id`, `current_block_id`, `completed_block_ids`, `completed_mystery_ids`, `completed_section_ids`, `started_at`, `updated_at`, `finished_at`).
- Migration mínima só para o que faltar: `bookmarks jsonb default '[]'` (marcadores espirituais unificados: favorito, reflexão, intenção, palavra tocada) e índice `(user_id, prayer_id) where finished_at is null` para retomada rápida.
- Novo hook `usePrayerEngineSession(prayerId)`:
  - `resume()` — devolve a sessão aberta mais recente ou cria uma nova.
  - `advance(blockId)` — marca bloco concluído, avança cursor, dispara mystery/section conclusion quando todos os filhos concluem.
  - `addBookmark(kind, data)` / `removeBookmark(id)`.
  - `finish()` — grava `finished_at`, congela estatísticas.
  - Autosave debounced (500ms) para não martelar o banco.

### Onda 2 — Reader consome sessão hierárquica

- `RosaryReader` (hoje state local) passa a hidratar do `usePrayerEngineSession`.
- Ao entrar em `/oracao/rosario`: se houver sessão aberta, exibe **card de retomada** (“Você parou aqui · Mistério Doloroso III · Retomar / Recomeçar / Trocar mistérios”) — não recomeça sozinho.
- Cada `PrayerBlock` renderizado dispara `advance(blockId)` quando o usuário conclui.
- Barra de progresso passa a refletir `completed_block_ids.length / total`.

### Onda 3 — Marcadores espirituais no leitor

- Componente `PrayerBookmarkBar` (⭐ favorito · 📝 reflexão · 🙏 intenção · 📖 palavra) ancorado por bloco.
- Editor curto (bottom sheet) para reflexão/intenção/palavra; favorito é toggle.
- Todos gravados em `prayer_sessions.bookmarks` com `{id, block_id, kind, text?, created_at}`.

### Onda 4 — ReaderContinuation via Nexus automático

- Adapter `prayerBlockAutoNexus(block, mystery, section)` sobre `KnowledgeRegistry` + `KnowledgeResolver` (mesmo padrão de `glossaryAutoNexus` / `journeyAutoNexus`), com cache LRU + métricas para o `NexusMetricsOverlay`.
- Fonte das relações: `prayer_blocks.content.refs`, `prayer_mysteries.gospel_ref`, tags automáticas do texto do bloco (glossário + catecismo por regex já disponível no resolver).
- `ReaderContinuation` no fim de cada bloco: Bíblia · Catecismo · Glossário · Santo · Próxima oração — 100% resolvido pelo KnowledgeGraph, com `NexusSourceBadge` já existente.
- Zero string de rota hardcoded no reader — auditoria via `scripts/audit-glossary-hardcoded.ts` estendida para o diretório do reader.

### Onda 5 — Resumo pós-sessão + próxima sugestão

- Ao chamar `finish()`, tela `PrayerSessionSummary`:
  - blocos, mistérios, minutos, reflexões, favoritos, intenções.
  - “Próxima sugestão” — vem do KnowledgeGraph (relação `next_devotion`), fallback: próxima oração da mesma categoria ainda não concluída hoje.

### Onda 6 — Analytics espiritual (leve, sem dashboard novo)

- View SQL `prayer_stats_user`: orações concluídas, mistério mais rezado, tempo médio, sequência (streak) por dia, top 5 blocos revisitados.
- Hook `usePrayerStats()` consumido no perfil espiritual existente (não cria página nova).

## Fora do escopo desta fase

- Áudio sincronizado por bloco (Fase F).
- Modo offline (Fase G).
- Gamificação / metas (Fase H).
- Refatoração dos demais módulos (Orações, Glossário, Jornadas, Trilhas, Portal Litúrgico, Santos).

O motor será testado no Rosário; as demais devoções passam a consumi-lo apenas após Fase E validada.

## Detalhes técnicos

- Tabelas tocadas: só `prayer_sessions` (add `bookmarks jsonb`, índice parcial de retomada). Nenhuma nova tabela.
- RLS: `prayer_sessions` já é `auth.uid() = user_id`; policies mantidas.
- Autosave: `advance()` faz `upsert` em uma única linha por sessão; debounced 500ms + flush no `beforeunload`.
- Nexus adapter reutiliza `KnowledgeRegistry` — não vamos duplicar o resolver.
- Contract test: `tests/e2e/rosary-resume.spec.ts` — reza 5 blocos, recarrega, valida retomada exata + `ReaderContinuation` visível + badge `kind · id`.
- Auditoria de hardcoded estendida: `scripts/audit-rosary-hardcoded.ts` falha CI se houver `href=/biblia|/catecismo|/santos` fora do adapter.

## Como isso destrava as próximas fases

Depois de Fase E validada, adicionar uma nova devoção (Via Sacra, LH, Novena, Ladainha) vira **puramente seed de conteúdo** em `prayer_sections/mysteries/blocks` + tags no `KnowledgeRegistry`. Sem código novo de leitor, sem novo state, sem novo Nexus.

## Começo

Se aprovar, abro **Onda 1** já em seguida: migration mínima (`bookmarks` + índice de retomada) + hook `usePrayerEngineSession`. Nada de reader ainda — só a fundação persistente.
