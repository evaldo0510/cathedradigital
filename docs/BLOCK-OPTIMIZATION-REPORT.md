# BLOCK-OPTIMIZATION-REPORT — Sprint R1.1 (Auditoria Somente Leitura)

Data: 2026-07-15
Escopo: Frontend (React/hooks), Edge Functions (Supabase), duplicações e estados redundantes.
Fonte de dados: `wc -l`, `rg` sobre `src/` e `supabase/functions/`.
Regra: nenhum arquivo de código alterado nesta fase.

---

## 1. Sumário Executivo

| Métrica | Valor |
|---|---|
| Arquivos TS/TSX em `src` (excl. testes) | ~350 |
| Total linhas frontend | 99.199 |
| Componentes em `src/components/cathedra/*.tsx` | 229 |
| Edge Functions (`index.ts`) | 38 |
| Total linhas edge functions | 12.040 |
| Arquivos frontend >500 linhas | 42 |
| Edge Functions >250 linhas | 6 |
| Uso de `React.memo` (arquivos) | 11 (⚠ muito baixo p/ 229 componentes) |
| Componentes com >15 `useState` | 15 |
| `supabase.from()` em componentes (fora de hooks) | ainda alto — ver §4 |

Conclusão: dívida técnica concentrada em (a) mega-componentes Bible/Magisterium/Bible*Admin, (b) duplicação em Mercado Pago, (c) baixa memoização, (d) queries Supabase espalhadas em páginas.

---

## 2. Top 20 Blocos Priorizados

| # | Bloco | Linhas | Problema principal | Impacto | Prioridade |
|---|---|---|---|---|---|
| 1 | `src/components/cathedra/Bible.tsx` | 2.329 | Mega-componente; 31 `useState`, 5 `useEffect`, 5 `supabase.from`, lógica+UI+dados juntos | Alto | 🔴 |
| 2 | `src/components/cathedra/BibleKnowledgeAudit.tsx` | 2.019 | 37 `useState` (recordista), 5 `useEffect`, mistura auditoria+visualização | Alto | 🔴 |
| 3 | `supabase/functions/bible-text/index.ts` | 858 | Edge fn muito longa, 27 blocos de função no arquivo único | Alto | 🔴 |
| 4 | `src/pages/BibleSourcesAudit.tsx` | 1.261 | 28 `useState`, sem split por tab | Alto | 🔴 |
| 5 | `src/pages/BiblePerfBreakdown.tsx` | 1.222 | 26 `useState`, 5 `useEffect`, 9 `supabase.from` (mais queries que qualquer hook) | Alto | 🔴 |
| 6 | Mercado Pago webhooks duplicados (`mercado-pago-webhook` 289 + `mercadopago-webhook` 270 + `mercadopago-sync-payment` 249) | 808 | Dois webhooks com nomes quase idênticos; risco de rota morta + código duplicado | Alto | 🔴 |
| 7 | `src/components/cathedra/Magisterium.tsx` | 768 | 20 hooks; deve extrair `useMagisteriumSearch` | Médio | 🟡 |
| 8 | `src/components/cathedra/MagisteriumViewer.tsx` | 730 | 9 `useEffect` (recordista), 17 `useState`; risco de re-render em cascata | Alto | 🔴 |
| 9 | `src/components/cathedra/TransactionsPage.tsx` | 751 | 35 `useState` — segundo maior; extrair reducer/`useReducer` | Alto | 🔴 |
| 10 | `src/components/cathedra/UpgradePage.tsx` | 750 | Página monolítica; lógica de pricing+UI+MP juntas | Médio | 🟡 |
| 11 | `src/components/cathedra/JornadasPage.tsx` | 721 | UI+fetch+filtros; sem hook dedicado | Médio | 🟡 |
| 12 | `src/App.tsx` | 659 | 8 `useEffect` no root; provider hell candidato a splitting | Médio | 🟡 |
| 13 | `src/components/cathedra/NavigationErrorInspector.tsx` | 803 | Dev tool grande, 14 `useState`; mover p/ `src/components/dev/` e lazy-load | Baixo | 🟢 |
| 14 | `src/components/dev/ContrastInspector.tsx` | 1.084 | Idem — dev-only, já isolado, garantir tree-shake em prod | Baixo | 🟢 |
| 15 | `src/pages/admin/PgStatStatements.tsx` | 963 | Admin, 18 `useState`; extrair painéis (padrão já existe em `components/admin/pg-stats/`) | Médio | 🟡 |
| 16 | `src/components/cathedra/CatechismPendingPanel.tsx` | 603 | 7 `useEffect` — verificar deps e evitar refetch loop | Médio | 🟡 |
| 17 | `src/components/cathedra/LogosAI.tsx` | 562 | 6 `useEffect`; lógica de streaming + UI juntas | Médio | 🟡 |
| 18 | `src/contexts/ReadingSettingsContext.tsx` | 429 | 8 `useEffect` num context — cada mudança propaga p/ toda árvore | Alto | 🔴 |
| 19 | `src/components/cathedra/NexusBubbles.tsx` | 602 | Alto custo de render; candidato #1 a `React.memo` + `useMemo` de tags | Médio | 🟡 |
| 20 | `src/components/cathedra/Dashboard.tsx` (via `useDashboardData` = 13 `supabase.from`) | — | Hook faz 13 queries; consolidar em RPC ou paralelizar melhor | Alto | 🔴 |

---

## 3. Padrões Sistêmicos Detectados

### 3.1 Baixa memoização
Apenas 11 arquivos usam `React.memo` em 229 componentes cathedra. Componentes de lista (`NexusBubbles`, `PremiumAuditTimeline`, `SpiritualQuiz`, cards do `Dashboard`) re-renderizam a cada mudança de contexto pai.

### 3.2 Mega-componentes (God Components)
Todos os arquivos >700 linhas concentram: estado local + fetch + parsing + UI. Não seguem o padrão que já existe em `components/admin/pg-stats/` (painéis pequenos + hook dedicado). O padrão certo já existe no projeto, só não foi aplicado consistentemente.

### 3.3 Duplicação de infraestrutura
- **Mercado Pago**: `mercado-pago-webhook` vs `mercadopago-webhook` (hífen vs sem hífen). Um deles é código morto ou rota legacy. Confirmar qual está listado em `supabase/config.toml` e no dashboard MP; remover o outro.
- **Bible edge**: `bible-text/index.ts` (858L) tem cache L1, singleflight, canon, schema e handler tudo no mesmo arquivo — mas `_shared/` já tem `bibleCanon.ts`, `bibleChapterNormalize.ts`, `bibleTextSchema.ts`. Faltou extrair L1 e singleflight (que já têm testes `_l1_test.ts` e `_singleflight_test.ts` no mesmo diretório).

### 3.4 Estados redundantes
- `BibleKnowledgeAudit.tsx`: 37 `useState` — quase certamente convertível em `useReducer` com ≤5 ações.
- `TransactionsPage.tsx`: 35 `useState` — idem.
- `Bible.tsx`: 31 `useState` — parte disso é filter state que deveria estar em URL (`useSearchParams`).

### 3.5 Queries fora de hooks
9 páginas invocam `supabase.from()` diretamente em componentes. Isso quebra a estratégia de cache/observabilidade centralizada e impede reuso. Alvos: `BiblePerfBreakdown` (9), `AdminThemesTab` (8), `ProfilePage` (7), `JornadaStepPage` (7), `Bible.tsx` (5), `CommandCenter` (5).

### 3.6 Tailwind hardcoded (viola ESLint rule)
20+ componentes ainda usam `p-4`, `text-sm`, `rounded-lg` diretos apesar da rule `no-restricted-syntax` no `eslint.config.js`. Concentração em `Bible*`, `Premium*`, `Magisterium*`. Rodar `bunx eslint src/components/cathedra --rule 'no-restricted-syntax: error'` para lista exata.

---

## 4. Edge Functions — Refino Recomendado

| Função | Linhas | Ação sugerida |
|---|---|---|
| `bible-text` | 858 | Extrair `l1Cache.ts`, `singleflight.ts`, `handler.ts`. Testes já existem em paralelo. |
| `bible-cache-admin` | 488 | Split por rota admin (list/purge/warm). |
| `bible-canon-diagnose` | 389 | Verificar sobreposição com `_shared/bibleCanon.ts`. |
| `mercado-pago-webhook` vs `mercadopago-webhook` | 289 + 270 | Consolidar em 1; deprecar o outro após confirmar tráfego zero. |
| `mercadopago-sync-payment` | 249 | Compartilhar client MP com `create-preference` via helper em `_shared/`. |

---

## 5. Priorização Recomendada (ondas de execução R1.2+)

**Onda 1 — Impacto alto, risco baixo (feature flag / isolado):**
1. Extrair `useBibleSearch`, `useBibleFilters` de `Bible.tsx`; mover filters para `useSearchParams`.
2. Modularizar `bible-text/index.ts` para 3 arquivos + handler.
3. Consolidar duplicata Mercado Pago (remover a rota não usada após auditoria de tráfego).

**Onda 2 — Redução de re-renders:**
4. `React.memo` em `NexusBubbles`, `RitualDoDia`, cards do `Dashboard`, itens de `PremiumAuditTimeline`.
5. Refatorar `ReadingSettingsContext` (8 `useEffect`) em contexto dividido (config vs estado transitório).
6. Consolidar `useDashboardData` (13 queries) numa RPC única.

**Onda 3 — Reduções pontuais:**
7. `TransactionsPage` e `BibleKnowledgeAudit`: `useState` → `useReducer`.
8. `MagisteriumViewer`: consolidar `useEffect`s dependentes numa única sync.
9. Aplicar ESLint auto-fix onde possível para tokens de spacing/typography.

**Onda 4 — Limpeza:**
10. Auditar dev tools (`ContrastInspector`, `NavigationErrorInspector`, `devInspector.ts` — 1.025 linhas) e garantir exclusão do bundle de produção via dynamic `import.meta.env.DEV`.

---

## 6. Métricas Baseline (para comparação pós-refino)

- Bundle inicial (a medir na R1.2 antes/depois).
- Média de re-renders por navegação (via `useRenderPerf` já existente).
- Tempo médio de resposta `bible-text` (já em `docs/PERFORMANCE-BASELINE-v2.md`).
- Linhas totais frontend: **99.199**. Meta pós-R1: −8% (~91k) sem perda de funcionalidade.

---

## 7. Pendências antes de abrir R1.2

- [ ] Confirmar qual dos webhooks Mercado Pago está ativo (checar `supabase/config.toml` + config do MP).
- [ ] Decidir se `useReducer` vs Zustand para os estados >30 (o projeto ainda não tem Zustand — não introduzir sem aprovação).
- [ ] Aprovar Onda 1 antes de qualquer edição de código.

---

**Somente leitura — nenhum arquivo do código-fonte foi alterado.**
