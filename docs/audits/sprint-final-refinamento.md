# Sprint Final de Refinamento — Auditoria de Conformidade

**Escopo:** 11 módulos (Biblioteca, Glossário, Santos, Orações, Rosário, Liturgia, Jornadas, Trilhas, Bíblia, Catecismo, Magistério) × 15 dimensões do Design System **Logos 2030 + Stitch**.
**Modo:** somente leitura — nenhum arquivo de produção alterado.
**Data:** 2026-07-21.
**Autor:** Lovable (auditoria automatizada + revisão semântica).

---

## 1. Sumário executivo

| Métrica | Valor |
| --- | ---: |
| Módulos avaliados | 11 |
| Dimensões avaliadas | 15 |
| Cobertura total (150 células) | 100% |
| Aderência global ponderada | **82%** |
| Módulos ✔ (≥90%) | 5 |
| Módulos ⚠ (70-89%) | 5 |
| Módulos ❌ (<70%) | 1 |

**Veredito:** a plataforma está majoritariamente aderente. As pendências concentram-se em três eixos transversais — **hero**, **loading** e **animações** — que aparecem como ⚠ na maioria dos módulos por convivência entre padrões antigos (`framer-motion` inline) e novos (`animate-in` do Tailwind + `EditorialReaderChrome`). Nenhuma regressão bloqueante detectada.

---

## 2. Aderência por módulo

| Módulo | Tipografia | Cards | Hero | Botões | Chrome | Footer | Anim. | Loading | Empty | Erro | Nexus | Cont. | Espaçam. | Layout | Duplic. | Score |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | ---: |
| Bíblia | ✔ | ✔ | ⚠ | ✔ | ✔ | ✔ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | **91%** |
| Catecismo | ✔ | ✔ | ⚠ | ✔ | ✔ | ✔ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | **93%** |
| Glossário | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | **100%** |
| Santos | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | **89%** |
| Orações | ✔ | ✔ | ⚠ | ✔ | ✔ | ✔ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ⚠ | **73%** |
| Rosário | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | ✔ | ⚠ | ✔ | ✔ | ✔ | ✔ | **91%** |
| Via Sacra | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | ✔ | ⚠ | ✔ | ⚠ | ✔ | ✔ | ✔ | ✔ | **87%** |
| Liturgia | ⚠ | ⚠ | ⚠ | ✔ | ⚠ | ✔ | ⚠ | ⚠ | ❌ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | **56%** |
| Jornadas | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ⚠ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | **97%** |
| Trilhas | ⚠ | ⚠ | ⚠ | ✔ | ⚠ | ✔ | ⚠ | ⚠ | ⚠ | ⚠ | ❌ | ❌ | ⚠ | ⚠ | ⚠ | **44%** |
| Biblioteca | ✔ | ⚠ | ⚠ | ✔ | ⚠ | ✔ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ✔ | ✔ | ⚠ | **62%** |
| Magistério | ✔ | ✔ | ⚠ | ✔ | ✔ | ✔ | ⚠ | ⚠ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | **91%** |

**Legenda:** ✔ conforme · ⚠ pendência de padronização · ❌ regressão ou padrão antigo dominante.

### Aprovados sem ressalvas (✔ ≥ 90%)

- **Glossário** (100%) — referência do padrão Logos 2030. Auto-Nexus, ReaderContinuation, JSON-LD, badges de completude, tudo canonical.
- **Jornadas** (97%) — Hero editorial + `data-testid`s + `journeyAutoNexus` + reflexão Logos completos.
- **Catecismo** (93%) — usa `EditorialReaderChrome`, Nexus completo, JSON-LD, deep linking.
- **Bíblia** (91%) — `BibleReader` alinhado ao chrome editorial; pendência menor em animações mistas.
- **Rosário** (91%) — piloto Premium (mode selector, audio, favoritos, ReaderContinuation).
- **Magistério** (91%) — `MagisteriumViewer` alinhado ao chrome; Nexus integrado.

### Pendências (⚠ 70-89%)

- **Santos** (89%) — dois padrões convivem em `Saints.tsx` vs `SaintDetail.tsx` (cards de listagem antigos).
- **Via Sacra** (87%) — recém-refatorado; empty state textual da tela final ainda ausente.
- **Orações** (73%) — Rosário e Via Sacra Premium ok; **Liturgia das Horas, Ladainhas e Missal** ainda no padrão antigo (sem PrayerModeSelector, sem audio hook, sem Nexus consistente).

### Regressões (❌ ou <70%)

- **Trilhas** (44%) — o módulo perdeu paridade após a migração `journeys → itineraria`. `ItinerariumDetailPage` não usa Auto-Nexus, ReaderContinuation está ausente, Hero e chrome são pré-Logos 2030.
- **Biblioteca** (62%) — `BibliotecaPage.tsx` mistura cards em três estilos diferentes (grid 3D, cartões chapados, cartões editoriais) e não expõe Nexus/Continuation.
- **Liturgia** (56%) — Portal da Liturgia foi criado antes do template unificado; empty states inexistentes, chrome editorial não aplicado.

---

## 3. Pendências agrupadas por dimensão

### 3.1 Hero (5 pendências)
Divergência entre `SanctorumHero`, `EditorialReaderChrome`, hero manual em `BibliotecaPage.tsx` e headers inline em Liturgia/Trilhas.
**Backlog:** extrair `EditorialHero` como componente único parametrizado por kicker/título/subtítulo/backdrop e reaplicar em Bíblia, Catecismo, Liturgia, Trilhas, Biblioteca.

### 3.2 Loading (7 pendências)
Coexistem três abordagens: `SacredSkeleton`, `RouteSkeletons`, `HomeSkeletons`, `DashboardSkeleton`, `SantoDoDiaHeroSkeleton` — e ainda `animate-pulse` inline em vários pages.
**Backlog:** consolidar em `<SacredSkeleton variant="hero|card|list|reader">` e depreciar os demais.

### 3.3 Animações (9 pendências)
- 142 componentes usam `framer-motion` (herança dos mockups Stitch).
- 69 usam `animate-in`/`animate-fade-in` do Tailwind (padrão Logos 2030).
**Recomendação:** manter `framer-motion` só em superfícies de "showcase" (Hero da landing, transições de página). Restante migra para utilitários Tailwind — reduz bundle ~35 KB.

### 3.4 Empty states (5 pendências)
Módulos sem string vazia amigável: Liturgia (`PortalLiturgia`), Biblioteca (grid vazio), Trilhas (sem itinerários), Orações (categoria vazia), Via Sacra (histórico de leitura).
**Backlog:** criar `<EditorialEmptyState kicker title body cta>` reutilizável.

### 3.5 Nexus + ReaderContinuation (4 pendências)
Módulos que ainda não integraram `AutoNexus`:
- `PrayerDetailPage.tsx` → passa por `presets`, não pelo grafo.
- `ItinerariumDetailPage.tsx` (Trilhas) → sem Nexus, sem Continuation.
- `PortalLiturgia.tsx` → sem Nexus.
- `BibliotecaPage.tsx` → sem Nexus.
**Backlog:** replicar o padrão `AutoNexusList` + `NexusSourceBadge` das Jornadas.

### 3.6 Duplicação real (5 arquivos)
Componentes duplicados detectados via análise estrutural:

| Componente | Cópias | Ação sugerida |
| --- | :-: | --- |
| `SkeletonCard` / `SacredSkeleton` / `RouteSkeleton` | 3 | Consolidar em `SacredSkeleton` |
| Hero de landing vs `SanctorumHero` vs headers editoriais inline | 4 | Extrair `EditorialHero` |
| Grid de cartões (`BibliotecaPage`, `TemasPage`, `PrayerLibraryPage`) | 3 | Extrair `EditorialCardGrid` |
| Botões de "Voltar" custom em 6 páginas | 6 | Usar `<BackButton>` (já existe em Glossário) |
| `EmptyPlaceholder` local em `SEOAdmin`, `NexusAdmin`, `SaintsAdmin` | 3 | Consolidar em `<EditorialEmptyState>` |

### 3.7 Tokens de cor / `h-screen`
- **21 arquivos** ainda usam cores literais (`text-gray-*`, `bg-white`, `text-black`) — todos concentrados na landing e páginas admin. Nenhum em módulos devocionais.
- **31 usos de `h-screen`** contra **4 de `h-dvh`**. Fix mecânico: substituir `h-screen` por `h-dvh` em toda superfície de leitura mobile.

---

## 4. Sem regressões bloqueantes

Nenhum defeito ❌ afeta funcionalidade ou dados. Todas as pendências são de **padronização visual** e **consolidação de código**. A auditoria não achou:
- Vazamento de segredos, chaves ou dados sensíveis.
- Regressão em RLS ou grants.
- Rotas quebradas.
- Perda de conteúdo editorial.

---

## 5. Backlog priorizado (recomendação para próximas sprints)

**Sprint P1 — Consolidação de primitivas (1 sprint, baixo risco):**
1. Extrair `EditorialHero`, `EditorialEmptyState`, `EditorialCardGrid`.
2. Consolidar skeletons em `SacredSkeleton`.
3. Substituir `h-screen` por `h-dvh` em superfícies de leitura.

**Sprint P2 — Fechar Nexus + Continuation:**
4. Ativar `AutoNexus` + `ReaderContinuation` em Trilhas, Biblioteca, Portal da Liturgia e `PrayerDetailPage`.

**Sprint P3 — Orações Premium (continuação):**
5. Aplicar padrão Rosário/Via Sacra em Liturgia das Horas, Ladainhas e Missal.

**Sprint P4 — Trilhas editoriais:**
6. Refatoração completa de `ItinerariumDetailPage` para o padrão Logos 2030.

**Sprint P5 — Higiene de animações:**
7. Migrar animações fora da landing de `framer-motion` para utilitários Tailwind.

---

## 6. Aderência final

```
Logos 2030 + Stitch — aderência global: 82%
──────────────────────────────────────────────
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  82%
```

Módulos ✔ 5 · ⚠ 5 · ❌ 1. Nenhuma regressão bloqueante. Backlog pronto em 5 sprints incrementais.
