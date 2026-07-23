# Sprint — Nexus 2.0 + Catecismo 2.0

Elevar Catecismo e Nexus ao padrão da Bíblia, transformando a Bíblia em **Template Mestre** reutilizado por todos os módulos de leitura.

## Preflight
- COS ativo · Plugins: `knowledge` + `ux` + `editorial`
- Skills co-ativados: Guardian, Knowledge Graph, Design System Guardian, Prayer Engine (referência)
- Risco: **médio-alto** (refatoração cross-módulo, toca leitor bíblico que é padrão-ouro)

## Escopo

### 1. Auditoria e extração do padrão Bíblia (fase 0)
Mapear na Bíblia o que já é reutilizável e o que está acoplado:
- Drawer/leitor (`BibleReader`, chrome, header, hero, filete dourado)
- Nexus (componente(s) de bolha, filtragem por bucket)
- Hooks: cache, favoritos, notas, histórico, compartilhamento
- Navegação anterior/próximo/voltar
- Skeletons, loading, mobile behavior

Entregável: `docs/reader-template-master.md` listando primitivos extraíveis e pontos de acoplamento.

### 2. Extrair `ReaderShell` (Template Mestre)
Componente genérico consumido por Bíblia, Catecismo, Glossário, Santos, Missal, Liturgia, Orações, Jornadas, Coleções.

Consome `ReaderContent` (contrato já existente em `src/core/content/contracts/ReaderContent.ts`).

Slots:
- Header + Hero editorial (filete dourado, título, metadata)
- Navigation bar (voltar / anterior / próximo / histórico)
- Body (renderizador de `sections`)
- Actions (favoritar, notas, compartilhar)
- Nexus panel (rodapé)
- Skeleton, loading, drawer mobile

### 3. Unificar Nexus em `NexusPanel`
Um único componente. Hoje há variantes por módulo — consolidar em `src/components/nexus/NexusPanel.tsx` alimentado pelo contrato `ReaderAutoNexus` que já existe (`bibleAutoNexus`, `catechismAutoNexus`, `glossaryAutoNexus`, etc.).

Ordem canônica dos buckets no Catecismo:
`explicação → bíblia → glossário → santos → padres → magistério → orações → coleções → jornadas`

Remover: drawers/bolhas paralelas por módulo.

### 4. Migrar Catecismo para `ReaderShell` + `NexusPanel`
- Página `/catechism` passa a montar `ReaderShell` com adapter `catechismReaderContent`
- Reutiliza mesmos hooks da Bíblia: cache, favoritos, notas, histórico, share
- Bolha do §N tem os mesmos gestos, animações e visual da bolha do versículo
- Navegação §anterior / §próximo / voltar / histórico

### 5. Nexus inteligente do Catecismo
`catechismAutoNexus` já existe — enriquecer:
- Cruzar `excerpt` com glossário (matching por termo canônico)
- Sugerir Padres/Doutores comentaristas do parágrafo
- Usar `nexus_relations` curadas quando existirem, cair em heurística semântica quando não
- Zero configuração manual por parágrafo

### 6. Migração dos demais módulos (progressiva, mesma sprint)
Migrar para `ReaderShell` + `NexusPanel` sem quebrar rotas:
- Glossário (termo)
- Santos (santo individual)
- Missal / Liturgia (respeitando `PrayerPortal` — Reader interno usa Shell)
- Orações
- Jornadas
- Coleções

Cada migração: 1 PR interno, com screenshot antes/depois.

### 7. Validação
- `tsgo` limpo
- Testes E2E existentes: `nexus-bible-multi-viewport`, `bible-cic-helpers`, glossary-seo — todos verdes
- Novo E2E: `catechism-reader-parity.spec.ts` compara UX Bíblia vs Catecismo (mesmos seletores, mesmos gestos)
- Perf: `nexus-perf-guardrail` não regride
- Baseline a11y (axe) mantido em zero

## Detalhes técnicos

```text
src/components/reader/
  ReaderShell.tsx          # template mestre
  ReaderHeader.tsx
  ReaderHero.tsx
  ReaderNavigation.tsx
  ReaderActions.tsx        # fav, notas, share
  ReaderBody.tsx
  ReaderSkeleton.tsx

src/components/nexus/
  NexusPanel.tsx           # único ponto de entrada
  NexusBucket.tsx
  NexusItem.tsx

src/hooks/reader/
  useReaderFavorites.ts    # extraído da Bíblia
  useReaderNotes.ts
  useReaderHistory.ts
  useReaderShare.ts
  useReaderCache.ts

src/core/content/adapters/
  bibleReaderContent.ts
  catechismReaderContent.ts
  glossaryReaderContent.ts
  saintReaderContent.ts
  ...
```

Cada adapter transforma dados do módulo em `ReaderContent` — nada de UI conhece o módulo.

## Fora de escopo
- Redesign visual (mantém identidade da Bíblia)
- Novos campos editoriais no CIC
- Reescrever `PrayerPortal` (só o Reader interno passa por Shell)

## Entrega
Relatório final com:
- Componentes reutilizados vs criados
- Código deletado (LOC)
- Duplicação eliminada (grep antes/depois)
- Performance antes/depois (`nexus-perf-guardrail`)
- Cobertura de módulos migrados

## Faseamento sugerido (aprovar 1 por vez ou tudo)
- **Fase A** — Auditoria + `ReaderShell` + `NexusPanel` + Catecismo (núcleo da sprint)
- **Fase B** — Migração Glossário + Santos
- **Fase C** — Migração Liturgia/Missal/Orações
- **Fase D** — Migração Jornadas + Coleções + cleanup final

Pergunta antes de executar: aprovar sprint inteira (A→D) ou começar só pela **Fase A** e revisar antes de seguir?
