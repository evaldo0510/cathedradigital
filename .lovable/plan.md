# CAT-13.1 — Refinamento editorial: Léxico + Jornadas (shell + editor)

Sprint única. Zero módulos novos. Sem conteúdo — só schema, leitura editorial e editor Admin. Você cola os textos depois e vê o render final.

## Escopo travado
- **Léxico:** verbete-piloto **Graça**.
- **Jornada:** piloto **Advento 2026** (jornada nativa em `journeys`, não legado `itineraria`).
- **Fora:** Santos, Padres, Liturgia, Missal, Calendário, Trilhas, Conteúdo (ficam para próximas sprints CAT-13.x).

## 1. Léxico Teológico

### 1a. Schema (`glossary`) — migração aditiva
Colunas novas (todas nullable, sem quebrar leitura atual):

| coluna | tipo | uso |
|---|---|---|
| `slug` | text unique | rota `/glossario/:slug` |
| `interpretation` | text | interpretação teológica aprofundada |
| `saints_refs` | text[] | ids/slugs de santos |
| `fathers_refs` | text[] | ids/slugs de padres |
| `prayer_refs` | text[] | ids/slugs de orações |
| `journey_refs` | uuid[] | jornadas sugeridas (substitui `journey_id` único, que fica marcado como legado) |
| `nexus_refs` | jsonb | array `{kind, target, note}` para o Nexus completo |
| `sections_order` | text[] | ordem editorial das 11 seções |
| `status` | text default 'draft' check in ('draft','review','published') |
| `published_at` | timestamptz | |

RLS: leitura pública mantém-se; escrita restrita a `admin` via `has_role`. GRANT no bloco padrão.

Backfill: `slug` gerado a partir de `term` (slugify). Sem tocar em `definition`, `deep_interpretation`, `practical_application`, `bible_verses`, `catechism_references`, `magisterium_references` — reaproveitados.

### 1b. Reader editorial — nova rota `/glossario/:slug`
- Usa `EditorialReaderChrome` + `EditorialHero` + `EditorialKicker` (padrão Logos 2030 já em uso em Bíblia/Catecismo/Santos).
- 11 seções renderizadas em ordem controlada por `sections_order`, com âncora e sumário lateral (desktop) / drawer (mobile):
  1. Definição • 2. Interpretação • 3. Aplicação prática • 4. Bíblia • 5. Catecismo • 6. Magistério • 7. Santos • 8. Padres • 9. Jornada sugerida • 10. Oração • 11. Nexus completo.
- Cada referência (Bíblia, CIC, santos etc.) usa componentes de link já existentes (Nexus popover, `BibleDictionaryPopover`).
- `ReaderContinuation` no rodapé com `kind: 'glossary-term'` (novo kind — adição mínima ao union type).
- Rota antiga `/glossary` (accordion) continua funcionando; novos links apontam para `/glossario/:slug`. Sem quebra.

### 1c. Editor Admin
- Nova aba `AdminGlossaryTab.tsx` (espelha padrão de `AdminJourneysTab.tsx`).
- Lista com filtro por status/categoria, ações CRUD.
- Editor: 11 campos correspondentes às seções + seletor de ordem + status (draft/review/published) + preview lado-a-lado do reader editorial.
- Referências (Bíblia/CIC/Magistério/Santos/Padres/Orações/Jornadas) via autocomplete que consulta as tabelas existentes.
- Nexus refs via editor de JSON assistido (linhas tipadas, não textarea cru).

## 2. Jornadas

### 2a. Schema (`journeys`) — migração aditiva
| coluna | tipo | uso |
|---|---|---|
| `slug` | text unique | rota `/jornadas/:slug` (mantém `/jornadas/:id`) |
| `hero_kicker` | text | versalete do hero editorial |
| `hero_quote` | text | citação de abertura |
| `hero_image_url` | text | imagem editorial hero |
| `narrative_intro` | text | narrativa que precede a lista de capítulos |
| `closing_message` | text | encerramento inspirador |
| `status` | text default 'draft' | igual ao glossário |

`journey_steps`: adicionar `reflection` (text), `exercise` (text), `closing` (text) — hoje tudo mora em `content` JSONB indistinto. Migração faz backfill lendo chaves `padh/interpretation/practical_direction/guided_exercise` para os novos campos, mantendo `content` intacto para retrocompat.

### 2b. Reader editorial — refactor de `JornadaDetailPage.tsx` e `JornadaStepPage.tsx`
- Substituir `CathedraCard` por `EditorialShell` + `EditorialHero` (usa `hero_kicker`, `hero_quote`, `hero_image_url`).
- Barra de progresso: `EditorialProgress` (já existe em `primitives.tsx`).
- Lista de capítulos: `EditorialChapterCard` + `EditorialTimeline` (já existem).
- Step: seções nomeadas (Reflexão, Exercício, Encerramento) em vez do map genérico `SECTION_CONFIG`.
- Continuidade: `ReaderContinuation` já está lá — só passar `closing_message` como fallback textual.
- Encerramento (`JornadaCompletePage.tsx`): hero editorial + `closing_message` + certificado existente + próxima jornada (via `resolveContinuation`, sem query direta).

### 2c. Adoção do `JourneyService`
Regra da própria camada é violada hoje. Migrar as 4 páginas (`JornadaDetailPage`, `JornadaStepPage`, `JornadaCompletePage`, `AdminJourneysTab`) para usar `JourneyService` — remove queries diretas a `journeys/journey_steps/journey_progress`.

### 2d. Editor Admin — melhorias no `AdminJourneysTab.tsx`
- Campos novos do hero + narrativa + encerramento no dialog de jornada.
- Step editor deixa de ser textarea JSON cru: 3 campos separados (`reflection`, `exercise`, `closing`) + campo opcional `content` avançado para casos legados.
- Botão "Ver no reader" abre preview em nova aba.
- Filtro por status.

## 3. Nexus
- Novo relation kind `glossary-term` registrado em `nexus_relation_types` (via migração seed).
- `ReaderContinuationKind` ganha `'glossary-term'`.
- `resolveContinuation` passa a considerar `journey_refs` do glossário e `nexus_refs` bidirecionais.

## 4. Testes e validação
- Migração roda com o schema real validado antes (checar `information_schema` — a auditoria usou `types.ts` gerado; posso confirmar rodando `supabase--read_query` antes de escrever o SQL).
- Vitest: unit tests do slugify + guards do editor.
- Playwright: 1 e2e por reader (Léxico e Jornada) validando render das seções, deep-link `/glossario/graca`, ancoragem do sumário, acessibilidade axe.
- Sem tocar em rotas legadas `/glossary` e `/jornadas/:id` — coexistem.

## Ordem de execução
1. Validar schema real (read-only query).
2. Migração Léxico + seed do relation type.
3. Reader editorial `/glossario/:slug`.
4. Admin Léxico.
5. Migração Jornadas + backfill.
6. Refactor Reader Jornadas + adoção do JourneyService.
7. Admin Jornadas atualizado.
8. Testes + axe.

## Fora deste plano (não fazer)
- Escrever conteúdo teológico (você fornece).
- Refinar Santos, Padres, Liturgia, Missal, Calendário, Trilhas.
- Migrar `itineraria` legado (adapter continua funcionando).
- Novos módulos, redesign global, mexer em tokens Logos 2030.

## Riscos
- Refactor de `JornadaStepPage` é a peça de maior superfície — muita lógica de UI (confetti, audio, reading marks). Vou preservar comportamento, só trocar o chrome visual e a estrutura de seções.
- `sections_order` do glossário: se ficar mal modelado, editor vira chato. Vou usar drag-and-drop simples (já temos `@dnd-kit` no projeto? verificar antes).

Aprovar para eu começar pela etapa 1 (validar schema real).
