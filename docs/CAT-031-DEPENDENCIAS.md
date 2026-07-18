# CAT-031 — Auditoria de Dependências
## Mapa completo de consumidores das tabelas de Jornadas/Itineraria

**Escopo**: read-only. Nenhum código, nenhum SQL executado. Insumo obrigatório antes da Fase C da Onda 2.

**Método**: varredura `grep -rn "from('<tabela>')" src supabase` sobre todas as 6 tabelas em disputa, classificação por domínio funcional e por operação (leitura/escrita).

---

## 1. Decisões congeladas (input da revisão do usuário)

| Item | Decisão |
|---|---|
| Tabela oficial | `journeys` (motor da Formação 2.0, deixa de ser "legado") |
| Compat itineraria | Camada VIEW/adapter apontando para `journeys` |
| Seeds de itineraria | Tratados como **demo**, congelados, removidos quando não houver mais consumidor direto |
| Domínio interno (código) | **Journey** (singular, PascalCase para tipos) |
| Nome do banco | `journeys`, `journey_steps`, `journey_progress` |
| Nome de interface (UI) | **Formação** (ou "Caminhos de Formação") |
| Nomes proibidos na UI | ~~Journey~~, ~~Itineraria~~, ~~Trilhas~~ |

---

## 2. Volumetria (recall da Fase A)

| Tabela | Linhas | Usuários |
|---|--:|--:|
| journeys | 40 | — |
| journey_steps | 578 | — |
| journey_progress | 18 | **5** (reais) |
| itineraria | 2 (seeds demo) | — |
| itineraria_steps | 5 (seeds demo) | — |
| itineraria_progress | 0 | 0 |

---

## 3. Mapa por domínio funcional

Cada nó lista os arquivos consumidores, número de operações e tabelas tocadas.

```
                             ┌────────────────────────────────────────┐
                             │        DOMÍNIO OFICIAL: journeys        │
                             │        Interface pública: FORMAÇÃO      │
                             └───────────────────┬────────────────────┘
                                                 │
     ┌────────────────┬────────────────┬─────────┴────────┬─────────────────┬──────────────────┐
     ▼                ▼                ▼                   ▼                 ▼                  ▼
FORMAÇÃO (fluxo)  HOJE           ADMIN            ONBOARDING       RECOMENDAÇÕES    NEXUS/BUSCA
```

### 3.1 FORMAÇÃO — fluxo do usuário (rotas `/jornadas/*`)
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/JornadasPage.tsx` | 1 | journey_progress |
| `src/components/cathedra/JornadaDetailPage.tsx` | 4 | journeys, journey_steps, journey_progress |
| `src/components/cathedra/JornadaStepPage.tsx` | 6 | journeys, journey_steps, journey_progress |
| `src/components/cathedra/JornadaCompletePage.tsx` | 7 | journeys, journey_steps, journey_progress |
**Subtotal**: 4 arquivos, 18 ops. **Núcleo do produto.**

### 3.2 HOJE — dashboard diário
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/HojePage.tsx` | 5 | journeys, journey_steps, journey_progress |
| `src/hooks/useDashboardData.ts` | 6 | journeys, journey_steps, journey_progress |

### 3.3 ADMIN
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/AdminJourneysTab.tsx` | 9 | journeys, journey_steps (CRUD completo) |
| `src/components/cathedra/AdminCrmUserProfile.tsx` | 1 | journey_progress (join com `journeys(title)`) |
| `src/components/cathedra/CommandCenter.tsx` | 1 | journeys |
| `src/hooks/useAdminDashboardData.ts` | 2 | journey_progress (contadores) |
| `src/hooks/__tests__/adminDashboardQueries.regression.test.ts` | 2 | journey_progress |

### 3.4 ONBOARDING
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/OnboardingPage.tsx` | 1 | journeys (sugestão inicial) |

### 3.5 PERFIL / MONETIZAÇÃO
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/SpiritualProfile.tsx` | 1 | journey_progress |
| `src/components/cathedra/ProConversionBanner.tsx` | 1 | journey_progress (heurística de conversão) |
| `src/hooks/useAuth.ts` | 1 | journey_progress (contagem no bootstrap) |

### 3.6 RECOMENDAÇÕES
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/hooks/useEnhancedRecommendations.ts` | 3 | journeys, journey_steps, journey_progress |

### 3.7 NEXUS / CROSS-CONTENT
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/lib/nexusContent.ts` | 1 | journeys (`.overlaps('tags', …)`) |

### 3.8 PROGRESS / SISTEMA
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/lib/progress.ts` | 1 | journey_progress (DELETE em limpeza total do usuário) |

### 3.9 LANDING (públicos, não-autenticado)
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/pages/landing/StatsSection.tsx` | 2 | journey_progress (contadores home) |

### 3.10 EDGE FUNCTIONS
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `supabase/functions/retention-notifications/index.ts` | 3 | journey_progress, journey_steps |

### 3.11 ROTA /itineraria (a ser desativada em fase futura)
| Arquivo | Ops | Tabelas |
|---|--:|---|
| `src/components/cathedra/ItinerariaPage.tsx` | 0* | (via ItinerariumDetailPage) |
| `src/components/cathedra/ItinerariumDetailPage.tsx` | 3 | itineraria, itineraria_steps, itineraria_progress |
| `src/components/cathedra/ItinerariumStepPage.tsx` | 6 | itineraria_steps, itineraria_progress |
| `supabase/tests/security_rls.test.ts` | 1 | itineraria_steps (teste de RLS) |

`*` `ItinerariaPage` faz apenas listagem via componente-filho.

### 3.12 Funções DB usadas
| Função | Consumidores |
|---|---|
| `search_journeys_fuzzy(text, int)` | busca global (a rastrear em `useFuzzySearch.ts`) |
| `get_latest_journey_title(uuid)` | `HojePage`, dashboards |

---

## 4. Ranking por criticidade (para ordenar migração)

| Prioridade | Domínio | Motivo |
|---|---|---|
| **P0** | Formação (fluxo `/jornadas/*`) | Produto principal; 18 progressos reais em risco |
| **P0** | Edge `retention-notifications` | Rodando em produção, dispara push aos usuários |
| **P0** | Hoje (dashboard) | Página inicial pós-login |
| **P1** | Admin (CRUD + CRM) | Único ponto de escrita de journeys/steps |
| **P1** | useAuth / SpiritualProfile / ProConversion | Hot path do bootstrap |
| **P2** | Recomendações / Nexus / Landing | Impacto contido, não bloqueia fluxo |
| **P3** | Rota `/itineraria` (3 arquivos) | Superfície inteira será removida — apontar temporariamente para adapter |

---

## 5. Superfície do `JourneyService` (contrato mínimo derivado do mapa)

Do agregado de queries reais acima, o serviço precisa oferecer:

**Leitura**
- `listActive(): Journey[]` — 3.7, 3.6, 3.4, `AdminJourneysTab` (list)
- `getById(id): Journey` — 3.1, 3.2, 3.3
- `listSteps(journeyId): JourneyStep[]` — 3.1, 3.2, 3.3
- `getStep(stepId): JourneyStep` — 3.1
- `countSteps(journeyId): number` — 3.1 (usa `count: 'exact', head: true`)
- `searchFuzzy(query, limit): Journey[]` — envolve `search_journeys_fuzzy`

**Progresso do usuário**
- `getProgress(userId, journeyId?): JourneyProgress[]` — 3.1, 3.2, 3.5
- `getLatest(userId): { journey_id, step_id } | null` — 3.2
- `markStepDone(userId, journeyId, stepId, reflection?): void` — 3.1 (upsert)
- `countUserDoneSteps(userId, sinceIso?): number` — 3.5, 3.9
- `deleteAllForUser(userId): void` — 3.8

**Admin**
- `admin.create(journey)`, `admin.update(id, patch)`, `admin.delete(id)` — 3.3
- `admin.upsertStep(step)`, `admin.deleteStep(id)` — 3.3
- `admin.listAllWithStats(): (Journey & { stepCount, userCount })[]` — 3.3

**Agregados globais**
- `stats.totalStarted()`, `stats.totalCompleted()` — 3.9 (contadores landing)
- `stats.usersWithProgress()`, `stats.completedUsers()` — 3.3

**Nexus**
- `findByTags(tags: string[], limit): Journey[]` — 3.7

**Retenção (edge)**
- versão server-side: `edge.getStalledUsers(daysSinceLastStep): {userId, journeyId, nextStep}[]`

---

## 6. Adapter `itineraria → Journey` (mapa de campos)

Quando migrar `ItinerariumDetailPage` e `ItinerariumStepPage`, o adapter converte:

| Campo Itineraria (público) | Campo Journey (interno) |
|---|---|
| `itinerarium_id` | `journey_id` |
| `itineraria_progress.step_id` | `journey_progress.step_id` |
| `itineraria.*` (title, subtitle, etc.) | idem `journeys.*` |
| `itineraria_steps.content.html` | promovido para `journey_steps.content.interpretation` na leitura (fallback quando `content.interpretation` está vazio) |

Nada é reescrito no banco. Adapter roda em memória, no `JourneyService`.

---

## 7. Cobertura de testes existentes (o que já cobre a migração)

- `src/components/cathedra/JornadasPage.test.tsx` — cobre listagem
- `src/components/cathedra/__tests__/ItinerariumStepPage.test.tsx` — cobre step page da rota /itineraria
- `src/hooks/__tests__/adminDashboardQueries.regression.test.ts` — regressão de admin
- `supabase/tests/security_rls.test.ts` — RLS de itineraria_steps

Cobertura **suficiente para P0-P1** com pequenos ajustes. **Falta**: E2E de `/jornadas/:id/step` → conclusão e persistência em `journey_progress`.

---

## 8. Ordem de execução aprovada

Da mensagem do usuário:

1. ✅ **CAT-031** — este documento.
2. ⏳ Criar `JourneyService` como API única (frontend, TypeScript). Zero mudança de banco.
3. ⏳ Fase C.1 — Migração de banco: dropar `itineraria*` (backup em `_archive_itineraria_v1*`), criar views `itineraria`, `itineraria_steps`, `itineraria_progress` sobre `journeys*`.
4. ⏳ Migrar consumidores para `JourneyService`, em ondas por prioridade (P0 → P3).
5. ⏳ Remover artefatos antigos (rota `/itineraria`, componentes `Itinerarium*`, views de compat) quando `grep` mostrar zero consumidor direto.

---

## 9. Regras de execução (invariantes)

Durante toda a Fase C:

- **Nenhum registro em `journey_progress` é apagado** (18 registros, 5 usuários).
- **Nenhum ID de journey muda** (deep links preservados).
- **Nenhuma rota pública muda** (`/jornadas/*` e `/itineraria/*` continuam respondendo).
- **`retention-notifications` continua funcionando a cada passo** (validar após cada PR).
- **Rótulos de UI**: nenhuma tela nova usa "Journey", "Itineraria" ou "Trilhas". Só **Formação** ou **Caminhos de Formação**.

---

## 10. Aguardo aprovação para o próximo passo

Solicito confirmação de dois pontos antes de escrever o `JourneyService`:

1. **Localização do serviço**: `src/services/journey/JourneyService.ts` + `src/services/journey/adapter.ts` + `src/services/journey/types.ts` — OK?
2. **Estilo do contrato**: funções puras exportadas (`export async function listActive()`) ou objeto único (`export const JourneyService = { listActive, … }`)? O restante do projeto usa objeto único quando há adapter (Nexus, Reader). Recomendo manter o padrão.
