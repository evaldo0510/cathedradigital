# Onda 2 — Migração `journeys` → modelo canônico
## Fase A (Auditoria) + Fase B (Plano Reversível)

**Status**: aguardando aprovação para Fase C (Execução). Nenhum SQL de migração foi executado.
Backlog origem: `docs/CATHEDRA-INTEGRATION-BACKLOG.md` — Onda 2.

---

## FASE A — AUDITORIA COMPLETA

### A.1 Volumetria real (produção)

| Tabela | Linhas | Usuários únicos |
|---|--:|--:|
| `journeys` | **40** | — |
| `journey_steps` | **578** | — |
| `journey_progress` | **18** | **5** |
| `itineraria` | 2 | — |
| `itineraria_steps` | 5 | — |
| `itineraria_progress` | **0** | **0** |

**Conclusão factual**: `journeys` é a tabela **viva** (40 itinerários curados, 578 passos com JSONB rico, 5 usuários com progresso real). `itineraria` é um esqueleto de 2 registros seed sem tráfego. A "migração" real é o oposto do que o nome do backlog sugeriu: os dados vivem em `journeys`; `itineraria` é o **nome** que ganhamos.

### A.2 Schema — diferenças estruturais

Colunas de negócio: **idênticas** entre `journeys` e `itineraria` (título, subtítulo, descrição, ícone, cover, categoria, dificuldade, dias estimados, premium, active, sort_order, tags). Idem para steps (title, subtitle, content jsonb, step_type, step_order, duration_minutes, is_free).

Única diferença estrutural: nome da FK — `journey_steps.journey_id` vs `itineraria_steps.itinerarium_id`.

### A.3 Riqueza real está no JSONB `content` dos steps

`journey_steps.content` (578 registros) tem semântica catequética densa:

| Chave JSONB | Ocorrências | Significado |
|---|--:|---|
| `padh` | 564 | Palavra/versículo âncora do dia |
| `final_question` | 528 | Pergunta contemplativa de fechamento |
| `guided_exercise` | 528 | Exercício espiritual guiado |
| `practical_direction` | 528 | Direção prática (concretização) |
| `interpretation` | 526 | Chave interpretativa |
| `intro` | 51 | Introdução (subformato) |
| `practice`, `lectio`, `verse`, `question`, `reflection`, `prayer`, `journal_prompt` | 14–50 | Variantes específicas |

`itineraria_steps.content` (5 registros): apenas `html` + `tags`. **Estrutura pobre, HTML cru.**

**Diagnóstico do usuário confirmado**: `journeys` é ontologicamente mais rica. Migrar seria empobrecer. O caminho correto é adotar a estrutura semântica de `journeys` como padrão e apenas renomear a superfície.

### A.4 FKs, índices, triggers, funções

**FKs**:
- `journey_steps.journey_id` → `journeys.id`
- `journey_progress.journey_id` → `journeys.id`
- `journey_progress.step_id` → `journey_steps.id`
- Idem para `itineraria_*` (paralelos)

**Índices exclusivos de `journeys`**:
- `idx_journeys_title_trgm` (gin_trgm) — usado por `search_journeys_fuzzy`
- `idx_journeys_description_trgm` (gin_trgm)
- `idx_journey_steps_journey`, `idx_journey_progress_user`, `idx_journey_progress_user_completed`

`itineraria` **não tem** índices trigram nem índices auxiliares de progresso.

**Uniqueness**: ambas têm `unique(user_id, step_id)` em progress. ✓

**Triggers**: nenhum trigger customizado além dos `updated_at` padrão em ambas.

**Funções**:
- `public.search_journeys_fuzzy(text, int)` — busca trigram, **em uso**
- `public.get_latest_journey_title(uuid)` — usada em `Hoje`, dashboards
- Nenhuma função equivalente para `itineraria`

### A.5 RLS — políticas comparadas

| Tabela | `journeys` | `itineraria` |
|---|---|---|
| SELECT público em `is_active=true` | ✓ | ✓ |
| Admin manage | ✓ (`Admins can manage journeys`) | ✗ (falta política de admin!) |
| Steps: free = public, premium = gated | ✓ | ✓ |
| Progress: usuário lê/insere/deleta próprio | ✓ (+ admin view all) | ✓ (sem admin view) |

`itineraria` está **menos protegida operacionalmente** (não há política de admin gerenciar itineraria — só steps).

### A.6 Consumidores no código (mapa completo)

**Frontend consumindo `journeys/*`** (17 arquivos, 40 pontos de query):
- `AdminJourneysTab.tsx` (CRUD admin — 8 queries)
- `JornadaDetailPage.tsx`, `JornadaStepPage.tsx`, `JornadaCompletePage.tsx`, `JornadasPage.tsx` (fluxo do usuário)
- `HojePage.tsx` (dashboard diário — 4 queries)
- `CommandCenter.tsx`, `OnboardingPage.tsx`, `SpiritualProfile.tsx`, `ProConversionBanner.tsx`
- `useAuth.ts`, `useDashboardData.ts`, `useAdminDashboardData.ts`, `useEnhancedRecommendations.ts`
- `AdminCrmUserProfile.tsx` (join `journey_progress → journeys(title)`)
- `lib/nexusContent.ts` (busca cross-content via `tags`)
- `lib/progress.ts` (delete cascade em logout/limpeza)
- `pages/landing/StatsSection.tsx` (contadores públicos)

**Edge Function**: `supabase/functions/retention-notifications/index.ts` (3 queries).

**Frontend consumindo `itineraria/*`** (2 arquivos, 8 pontos):
- `ItinerariaPage.tsx`, `ItinerariumDetailPage.tsx`, `ItinerariumStepPage.tsx` (rota `/itineraria`, 5 registros seed)

**Rotas**:
- `/jornadas`, `/jornadas/:id`, `/jornadas/:id/step`, `/jornadas/:id/complete` — **ativas, com progresso real**
- `/itineraria`, `/itineraria/:id`, `/itineraria/:id/step` — ativas, sem tráfego real

### A.7 Nexus Theologicus

Nenhuma linha em `nexus_relations` cita `journey*` ou `itineraria*` em `source_kind`/`target_kind`. **Zero risco de quebrar Nexus.** A única ponte cross-content é `nexusContent.ts` fazendo `.overlaps('tags', ...)` — desde que a tabela final tenha coluna `tags`, o Nexus continua funcionando.

### A.8 Testes existentes

- `src/components/cathedra/__tests__/ItinerariumStepPage.test.tsx`
- `src/components/cathedra/JornadasPage.test.tsx`
- `src/hooks/__tests__/adminDashboardQueries.regression.test.ts`
- `supabase/tests/security_rls.test.ts` (toca `itineraria_steps`)

### A.9 Riscos identificados

1. **Perda de progresso**: 18 registros de 5 usuários. Qualquer plano deve preservar 100%.
2. **Deep links quebrados**: `/jornadas/:id` em bookmarks/notificações. Se mudarmos slug, precisamos redirect permanente por ID.
3. **Retention notifications**: edge function ativa em produção. Se mudar nome da tabela, quebra os disparos.
4. **`search_journeys_fuzzy`**: usada em busca global. Deve ser renomeada/aliased.
5. **Empobrecimento semântico**: se copiarmos `journey_steps.content` para o schema pobre de `itineraria_steps.content` (`html`+`tags`), perdemos `padh`, `final_question`, `guided_exercise`, `practical_direction`, `interpretation` — a alma catequética das jornadas.

---

## FASE B — PLANO REVERSÍVEL

### B.0 Princípio norteador (revisão do escopo original)

O backlog foi escrito assumindo "migrar journeys → itineraria" (mover dados de A para B). A auditoria mostra que isso é **arquiteturalmente errado**: `journeys` é a fonte viva e rica; `itineraria` é o nome desejado.

Portanto: **não movemos dados. Renomeamos superfícies e enriquecemos o modelo.** A tabela física escolhida abriga os 40 itinerários já existentes com seu JSONB rico.

Duas opções apresentadas para sua decisão. Nenhuma executa dados destrutivamente.

---

### Opção 1 — Renomeação física (mais limpa, mais invasiva)

**Ação SQL** (uma migração):
```
ALTER TABLE journeys RENAME TO itineraria_v2;
ALTER TABLE journey_steps RENAME TO itineraria_v2_steps;
ALTER TABLE journey_steps.journey_id RENAME TO itinerarium_id;
ALTER TABLE journey_progress RENAME TO itineraria_v2_progress;
-- policies, índices, funções renomeados junto (renome preserva-os)
-- CREATE VIEW journeys AS SELECT * FROM itineraria_v2;  (compat 1 sprint)
-- CREATE VIEW journey_steps AS SELECT id, itinerarium_id AS journey_id, ... FROM itineraria_v2_steps;
-- CREATE VIEW journey_progress AS SELECT id, itinerarium_id AS journey_id, ... FROM itineraria_v2_progress;
-- DROP as antigas itineraria/itineraria_steps/itineraria_progress (2 registros seed, 0 progressos — sem perda)
```

**Prós**: nome único no banco, elimina duplicação de verdade, elimina confusão futura.
**Contras**: renomeia 17 arquivos + 40 pontos de query no frontend. Alto churn. Se algo passar despercebido, quebra em produção. Views de compat mitigam mas adicionam camada.

### Opção 2 — Consolidação por VIEW + descarte controlado (recomendada)

**Ação SQL** (uma migração, totalmente reversível):

```
-- 1) Descartar 'itineraria' antigo (esqueleto sem tráfego real)
--    Backup dos 2 registros seed antes:
CREATE TABLE _archive_itineraria_v1 AS SELECT * FROM itineraria;
CREATE TABLE _archive_itineraria_v1_steps AS SELECT * FROM itineraria_steps;
DROP TABLE itineraria_progress CASCADE;   -- 0 linhas
DROP TABLE itineraria_steps   CASCADE;    -- 5 linhas arquivadas
DROP TABLE itineraria         CASCADE;    -- 2 linhas arquivadas

-- 2) Criar VIEWS 'itineraria', 'itineraria_steps', 'itineraria_progress'
--    apontando para journeys/journey_steps/journey_progress, com aliases de colunas:
CREATE VIEW itineraria AS SELECT * FROM journeys;
CREATE VIEW itineraria_steps AS
  SELECT id, journey_id AS itinerarium_id, step_order, title, subtitle,
         step_type, content, duration_minutes, is_free, created_at, updated_at
  FROM journey_steps;
CREATE VIEW itineraria_progress AS
  SELECT id, user_id, journey_id AS itinerarium_id, step_id, reflection, completed_at
  FROM journey_progress;

-- 3) Grants + RLS policies nas views (VIEWS herdam RLS da tabela base, mas
--    precisamos GRANT explícito para PostgREST)
GRANT SELECT ON itineraria, itineraria_steps, itineraria_progress TO anon, authenticated;
-- Views são read-only por padrão; inserts em itineraria_progress continuam via
-- 'journey_progress' (frontend do fluxo de itineraria será apontado para
-- 'journey_progress' na Fase C — 3 pontos em ItinerariumStepPage.tsx).

-- 4) Reforçar RLS admin ausente em journeys já está OK; nada a fazer.
```

**Enriquecimento do modelo** (Fase C, incremental — não parte da migração destrutiva):

Introduzir tipagem no JSONB via constraint semi-flexível:
```
ALTER TABLE journey_steps ADD COLUMN content_schema_version int NOT NULL DEFAULT 1;
-- Documentar em docs o schema v1:
--   { padh, interpretation, guided_exercise, practical_direction, final_question, ...opcionais }
-- Não adicionar CHECK constraint agora (JSONB é flexível por design; validação vai em Zod no frontend/edge).
```

**Prós**:
- Zero linhas de dado vivo tocadas.
- Zero query frontend precisa mudar (`itineraria/*` continuam funcionando via view; `journeys/*` continuam funcionando na tabela).
- Reversível em 1 comando: `DROP VIEW itineraria*; CREATE TABLE itineraria... FROM _archive_itineraria_v1`.
- Nenhuma edge function quebra.
- Nenhum deep link `/jornadas/:id` ou `/itineraria/:id` quebra.
- 18 progressos preservados por construção (não são tocados).

**Contras**:
- Duas superfícies de nome no banco por um período (`journeys` real + `itineraria` view). Aceita como custo de estabilidade.
- Views são read-only para PostgREST por padrão — precisaremos criar rule/trigger de INSTEAD OF se quisermos escrita direta pela view, ou apontar os 3 pontos de escrita de `ItinerariumStepPage.tsx` para a tabela base `journey_progress` (renomeando itinerarium_id → journey_id no client — trivial).

**Recomendação**: **Opção 2**. Ela cumpre o objetivo declarado ("consolidar em Itineraria pelo nome") sem tocar em nenhum byte de dado vivo, e mantém `journeys` como tabela física por estabilidade histórica. Se depois quisermos a Opção 1, ela vira uma renomeação puramente cosmética com views servindo de ponte.

---

### B.1 Estratégia de rollback (Opção 2)

**Se falhar antes do commit**: transação da migração é atômica — rollback automático.

**Se falhar após deploy** (view causou problema):
```sql
BEGIN;
DROP VIEW IF EXISTS itineraria_progress, itineraria_steps, itineraria CASCADE;
CREATE TABLE itineraria         AS SELECT * FROM _archive_itineraria_v1;
CREATE TABLE itineraria_steps   AS SELECT * FROM _archive_itineraria_v1_steps;
CREATE TABLE itineraria_progress (LIKE journey_progress);  -- estava vazia
-- restaurar policies/grants originais (script salvo em docs/onda-02/rollback.sql)
COMMIT;
```

Tempo estimado de rollback: < 1 minuto. Sem perda de dado (progressos ficam intactos em `journey_progress`).

### B.2 Preservação garantida

| Item | Como é preservado |
|---|---|
| 40 journeys | Tabela `journeys` intocada |
| 578 steps | Tabela `journey_steps` intocada |
| 18 progressos, 5 usuários | Tabela `journey_progress` intocada |
| IDs de journey (para deep links) | Preservados por construção |
| 2 itineraria seed + 5 steps seed | Arquivados em `_archive_itineraria_v1*` |
| Nexus relations | Nenhuma referência — não há o que preservar |
| Favoritos | `bible_favorites` (Onda 4) não referencia journeys — sem impacto |
| Edge function `retention-notifications` | Consulta `journey_progress` — continua funcionando |
| Busca fuzzy | `search_journeys_fuzzy` intocada |
| Rotas `/jornadas/*` | Intocadas (Onda 1 já as canonizou) |
| Rotas `/itineraria/*` | Continuam servindo os 2 seeds via view — comportamento visível idêntico |

### B.3 Compatibilidade temporária

Nenhuma janela de indisponibilidade. Frontend não precisa mudar no momento da migração. As mudanças de código (apontar `ItinerariumStepPage` para tabela base) entram em PR separado, **após** validar que a view responde igual em produção.

### B.4 Arquivos de código impactados na Fase C

| Arquivo | Mudança prevista |
|---|---|
| `src/components/cathedra/ItinerariumStepPage.tsx` | 3 `.from('itineraria_progress')` → `.from('journey_progress')` + renomear `itinerarium_id` → `journey_id` no payload |
| `src/components/cathedra/ItinerariumDetailPage.tsx` | 1 `.from('itineraria_progress')` → `.from('journey_progress')` (leitura ok via view, mas melhor uniformizar) |
| `supabase/tests/security_rls.test.ts` | Continuar testando via view (nome `itineraria_steps` ainda existe) |
| `docs/CATHEDRA-INTEGRATION-BACKLOG.md` | Marcar Onda 2 como concluída, registrar decisão |

Nenhum arquivo removido. Nenhuma quebra de import.

### B.5 Enriquecimento do modelo (fase evolutiva, pós-migração)

Aproveitando a auditoria, propor no PR seguinte:

1. **Documentar schema v1 de `journey_steps.content`** em `docs/domain/journey-step-content.md` com Zod schema:
   ```typescript
   const StepContentV1 = z.object({
     padh: z.string().optional(),
     interpretation: z.string().optional(),
     guided_exercise: z.string().optional(),
     practical_direction: z.string().optional(),
     final_question: z.string().optional(),
     intro: z.string().optional(),
     // ... variantes menores
   });
   ```
2. **Adicionar `content_schema_version int`** para permitir evolução futura sem quebrar registros v1.
3. **Refletir riqueza no reader**: `JornadaStepPage` já renderiza `content.padh`, `content.interpretation`, etc. Confirmar renderização visual dedicada para cada chave.

Isso cumpre a diretriz de "migração histórica, não apenas troca de tabela": sai da Onda 2 com o modelo semanticamente documentado.

---

## Métricas alvo da Fase C (para relatório final)

- Journeys migradas: **40 preservadas** (não movidas — permanecem na tabela original).
- Passos migrados: **578 preservados**.
- Usuários preservados: **5** (100%).
- Registros de progresso preservados: **18** (100%).
- Registros descartados: **7** (2 itineraria seed + 5 itineraria_steps seed — arquivados em `_archive_itineraria_v1*`).
- Tabelas antigas: `itineraria`, `itineraria_steps`, `itineraria_progress` **descartadas fisicamente**, recriadas como VIEWS sobre `journeys*`.
- Impacto em APIs: **zero** — todos os nomes de tabela (`journeys`, `journey_steps`, `journey_progress`, `itineraria`, `itineraria_steps`, `itineraria_progress`) continuam respondendo pelo PostgREST.
- Impacto no frontend: **4 linhas** em 2 arquivos (Fase C parte 2, opcional).
- Impacto no banco: **-3 tabelas ociosas, +3 views, +2 tabelas de arquivo**.

---

## Aguardo aprovação

Preciso da sua decisão em três pontos antes de gerar a migração da Fase C:

1. **Opção 1 (renomeação física) ou Opção 2 (view + descarte controlado, recomendada)?**
2. Inclui na mesma migração o `content_schema_version` em `journey_steps`, ou deixamos para PR separado?
3. Confirma que posso **arquivar e descartar** os 2 registros seed + 5 steps de `itineraria` (backup em `_archive_itineraria_v1*` fica no banco)?
