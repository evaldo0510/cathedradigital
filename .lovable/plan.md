# Sprint 2 — Continuidade Inteligente via Knowledge Engine

**Regra da sprint:** nenhum CTA é decidido pelo componente. Toda sugestão vem do domínio. O `ReaderContinuation` apenas renderiza.

---

## Fase A — Contrato de domínio (sem UI)

Criar em `src/core/knowledge/`:

1. `ContinuationIntent = 'study' | 'deepen' | 'pray' | 'apply' | 'meet'`
2. `ContinuationSuggestion`:
   ```text
   { intent, eyebrow, label, target: ResolvedNode, weight }
   ```
3. `ContinuationContext`:
   ```text
   { currentKind, currentId, themeIds?, hints? }
   ```
4. `resolveContinuation(ctx): ContinuationSuggestion[]` — função pura, no máximo 4 sugestões, ordenadas por peso.

Fonte de dados: `KnowledgeGraph.neighbors` + `relationsFrom` filtradas por `KnowledgeRelationKind` (`develops`, `defined-in`, `commented-by`, `prayed-as`, `applies-to`).

Cobertura por testes unitários dos 5 kinds + fallback vazio.

---

## Fase B — Presets editoriais por kind

Arquivo único `ReaderContinuation.presets.ts` define título e ordem de intents por kind. Trocar copy = editar 1 arquivo.

| Kind | Título | Ordem de intents |
|---|---|---|
| bible | Continue na Palavra | study → deepen → pray |
| catechism | Aprofunde este ensinamento | study → deepen → apply |
| magisterium | Continue este estudo | deepen → meet → apply |
| saint | Inspirado por este santo? | meet → study → pray → apply |
| journey | (mantém fluxo atual) | — |

Ícones por intent: 📖 study · 📚 deepen · 🙏 pray · 🌿 apply · ✨ meet (via lucide, sem emoji real).

---

## Fase C — Refactor do `ReaderContinuation`

- Nova assinatura única: `<ReaderContinuation context={...} />`.
- Componente perde qualquer conhecimento de URL, capítulo, parágrafo.
- Chama `resolveContinuation(context)`, aplica o preset do kind, renderiza no layout editorial já homologado (Cormorant/Karla, 44px, aria-live).
- **Fallback obrigatório:** se `resolveContinuation` devolver `[]`, mantém comportamento atual (próximo §/capítulo/etapa) — zero regressão.

Migrar os 5 pontos de plug (Bíblia, Catecismo, Magistério, Santos, Jornada) para passar `context` em vez de props soltas.

Ordem de migração: Catecismo → Bíblia → Magistério → Santos → Jornada (Catecismo é o mais denso no grafo, valida o motor primeiro).

---

## Fase D — Telemetria

Instrumentar via `navigation-telemetry`:

- `reader.continuation.shown` — kind origem, intents oferecidas, se veio do grafo ou do fallback.
- `reader.continuation.click` — intent, kind origem, kind destino, posição.

Base para medir na Sprint 3 se o usuário realmente segue o caminho sugerido.

---

## Fase E — Validação

- Unit: `resolveContinuation` cobre 5 kinds + fallback + limite de 4.
- E2E: em cada leitor com conteúdo semeado, o bloco mostra ≥1 sugestão real do grafo (não fallback).
- Homologação visual nos 3 breakpoints (mobile/tablet/desktop) com screenshots.
- Acessibilidade: axe-core sem regressão.

---

## Critério de aceite

1. Nenhum leitor mostra CTA genérico quando o grafo tem vizinhos.
2. Copy e ordem variam por kind, decididas em `presets.ts`.
3. `ReaderContinuation` não importa nenhuma rota literal.
4. Telemetria registra exibição e clique.
5. Fallback preserva o comportamento da Sprint 1 quando o grafo está vazio.

---

## Fora de escopo (Sprint 3+)

- Personalização por histórico do usuário.
- Sugestões por humor / `spiritual_journal`.
- IA generativa escolhendo o próximo passo.
- Nexus visual (popover) reaproveitando o mesmo resolver.

---

## Detalhes técnicos

- `resolveContinuation` vive em `src/core/knowledge/continuation/` como função pura — testável sem React, sem Supabase.
- Presets em `src/components/shared/ReaderContinuation.presets.ts`.
- Tipos exportados via barrel `@/core/knowledge`.
- Nenhuma alteração em `RouteRegistry`, `JourneyService` ou adapters de conteúdo.
- Nenhuma nova dependência externa.
