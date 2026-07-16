# BIBLE-STATE-MAP — R1.2.2 Fase 1

**Componente:** `src/components/cathedra/Bible.tsx`
**Tamanho atual:** 2.329 linhas · **30 `useState`** (contagem exata via `grep useState<|useState\(`).
**Objetivo desta fase:** classificar cada estado *antes* de extrair hooks, para que a refatoração da Fase 2 seja arquitetural — não estética. A meta final (`< 400 linhas`, `≤ 8 useState`) só é aceita se cada eliminação estiver justificada nesta tabela.

## Legenda de destinos

| Código | Significado |
|---|---|
| **Local** | Permanece em `Bible.tsx` (estado puramente de UI local, sem consumidores externos) |
| **`hooks/bible/<hook>`** | Migra para hook de domínio dedicado |
| **Context** | Sobe para `ReadingSettingsContext` ou novo `BibleNavigationContext` |
| **`useMemo` / derivado** | Não é estado — é função de outros estados |
| **`useSearchParams`** | Estado de rota (URL como fonte de verdade) |
| **`useRef`** | Valor mutável que não dispara re-render |
| **Eliminar** | Redundante, morto, ou substituível por estado remoto (React Query / Supabase) |

---

## Tabela de classificação

| # | Estado (linha) | Tipo atual | Destino proposto | Justificativa |
|---|---|---|---|---|
| 1 | `isConnectionEditorOpen` (104) | UI local | **Local** | Modal fechado por padrão, sem consumidores externos. |
| 2 | `navHistory` (105) | Array de navegação | **`hooks/bible/useBibleHistory`** | Domínio de histórico de leitura; hoje é escrito em vários pontos sem contrato claro. |
| 3 | `viewMode` (115) | Enum de rota (`home/chapters/reading/search/notes/monthly_recap`) | **`useSearchParams`** (`?view=`) | É rota disfarçada de estado — quebra deep-link, back button e SEO. Migrar elimina 6+ `setViewMode` espalhados. |
| 4 | `selectedBook` (116) | Seleção de leitura | **`hooks/bible/useBibleNavigation`** + `useSearchParams` (`?book=`) | Deve ser derivado da URL para permitir compartilhamento. Hook expõe `{book, chapter, setBook, setChapter}`. |
| 5 | `selectedChapter` (117) | Seleção de leitura | **`hooks/bible/useBibleNavigation`** + `useSearchParams` (`?ch=`) | Idem #4. |
| 6 | `verses` (118) | Dados remotos | **Eliminar → React Query** (`useBibleChapter(book, chapter)`) | Já existe camada de cache/edge; manter em `useState` duplica fonte de verdade e impede invalidação por chave. |
| 7 | `isLoading` (119) | Flag de fetch | **Eliminar** | Deriva de `useBibleChapter().isLoading`. |
| 8 | `connectionsLoading` (120) | Flag de fetch | **Eliminar** | Deriva de `useBibleConnections().isLoading`. |
| 9 | `sourceInfo` (121) | String de diagnóstico | **`hooks/bible/useBibleDiagnostics`** | Só é lido em painel diagnóstico admin; não pertence ao componente principal. |
| 10 | `invalidationStats` (122) | Contadores de cache | **`hooks/bible/useBibleDiagnostics`** | Idem #9 — telemetria, não UI. |
| 11 | `cacheSyncVersion` (123) | Versão de schema de cache | **`useRef`** ou constante em `lib/biblePerf` | Nunca dispara re-render útil; leitura única no boot. |
| 12 | `diagnosticLogs` (124) | Buffer de logs | **`useRef`** dentro de `useBibleDiagnostics` | Append-only; re-render por log é desperdício. |
| 13 | `sessionId` (125) | ID estável de sessão | **`useRef`** + `sessionStorage` | Nunca muda no ciclo do componente. |
| 14 | `searchQuery` (126) | Input de busca | **`hooks/bible/useBibleSearch`** + `useSearchParams` (`?q=`) | Deep-link de busca; hoje se perde ao recarregar. |
| 15 | `lastRead` (129) | Progresso do usuário | **`hooks/bible/useBibleReadingMarks`** (existe `useReadingMarks` — consolidar) | Duplica leitura que `useReadingMarks` já faz. |
| 16 | `dailyReading` (130) | Cálculo determinístico do dia | **`useMemo` / derivado** | `getDailyReading()` é puro em função da data; não precisa de estado. |
| 17 | `isDailyCompleted` (131) | Flag derivada | **`useMemo`** | Deriva de `lastRead` vs `dailyReading` — hoje sincronizado manualmente. |
| 18 | `isNoteModalOpen` (132) | UI modal | **Local** | Modal transitório. |
| 19 | `activeVerse` (133) | Contexto do modal | **`hooks/bible/useBibleSelection`** | Domínio de seleção; compartilhado com HighlightMenu, NoteModal, ConnectionEditor. |
| 20 | `expandedConnection` (134) | UI de sheet | **`hooks/bible/useBibleConnections`** | Emparelhar com dados de conexões. |
| 21 | `isFeedbackOpen` (135) | UI modal | **Local** | Transitório. |
| 22 | `isGraphOpen` (136) | UI modal | **Local** | Transitório. |
| 23 | `isScanning` (137) | Flag admin de scan | **`hooks/bible/useBibleAudit`** (admin only) | Fluxo admin isolado — não deveria pesar no bundle do leitor. |
| 24 | `scanResults` (138) | Dados admin | **`hooks/bible/useBibleAudit`** | Idem #23. `groupedScanResults` (linha 140) já é `useMemo` correto. |
| 25 | `highlights` (157) | Grifos por versículo | **`hooks/bible/useBibleHighlights`** | Domínio próprio; consumido por Reader + HighlightMenu. |
| 26 | `showKnowledgePanel` (488) | UI de painel | **Local** | Transitório. |
| 27 | `activeThemeFilter` (489) | Filtro semântico | **`hooks/bible/useBibleConnections`** | Faz par com dados de conexões — filtro sem dados não faz sentido. |
| 28 | `isHighlightMenuOpen` (500) | UI de menu | **`hooks/bible/useBibleSelection`** | Abre a partir de `activeVerse`; acoplado à seleção. |
| 29 | `dynamicConnections` (946) | Dados remotos | **Eliminar → React Query** (`useBibleConnections`) | Fetch manual com `setState`; deve ser cache-key. |
| 30 | `isDiagnosticOpen` (1168) | UI admin | **`hooks/bible/useBibleDiagnostics`** | Painel admin isolado. |

---

## Consolidação por destino

### Estados que permanecem locais (5)
`isConnectionEditorOpen`, `isNoteModalOpen`, `isFeedbackOpen`, `isGraphOpen`, `showKnowledgePanel` — todos modais/sheets puramente transitórios.

### Estados eliminados (5)
`verses`, `isLoading`, `connectionsLoading`, `dynamicConnections`, `isDailyCompleted` — substituídos por React Query e `useMemo`.

### Estados derivados / `useRef` (4)
`dailyReading` (`useMemo`), `cacheSyncVersion`, `diagnosticLogs`, `sessionId` (`useRef`).

### Estados migrados para URL (`useSearchParams`) (4)
`viewMode`, `selectedBook`, `selectedChapter`, `searchQuery` — habilitam deep-link e back button nativo.

### Estados migrados para hooks de domínio (12)
| Hook | Estados absorvidos |
|---|---|
| `hooks/bible/useBibleNavigation` | `selectedBook`, `selectedChapter` (leitura da URL + setters que gravam na URL) |
| `hooks/bible/useBibleHistory` | `navHistory` |
| `hooks/bible/useBibleSelection` | `activeVerse`, `isHighlightMenuOpen` |
| `hooks/bible/useBibleHighlights` | `highlights` |
| `hooks/bible/useBibleSearch` | `searchQuery` (via URL) + resultados |
| `hooks/bible/useBibleConnections` | `dynamicConnections` (React Query), `expandedConnection`, `activeThemeFilter` |
| `hooks/bible/useBibleDiagnostics` | `sourceInfo`, `invalidationStats`, `diagnosticLogs`, `isDiagnosticOpen` |
| `hooks/bible/useBibleAudit` (admin) | `isScanning`, `scanResults` |
| `hooks/bible/useBibleReadingMarks` (thin wrapper sobre `useReadingMarks`) | `lastRead` |

### Contexto global
Nenhum novo `Context` necessário nesta sprint. `ReadingSettingsContext` já cobre preferências (fonte, tema, tamanho). Se `useBibleNavigation` precisar ser lido por header/breadcrumbs fora do componente, avaliar promoção em sprint futura — não nesta.

---

## Contagem-alvo pós-refatoração

| Métrica | Antes | Depois |
|---|---|---|
| Linhas em `Bible.tsx` | 2.329 | < 400 |
| `useState` no componente principal | 30 | **5** (só modais locais) |
| Fontes de verdade para posição atual | 3 (`selectedBook`, `selectedChapter`, URL) | 1 (URL) |
| Fetches manuais com `setState` | 2 (`verses`, `dynamicConnections`) | 0 (React Query) |
| Hooks de domínio dedicados | 0 | 9 |

---

## Escopo preservado (não muda nesta refatoração)

Conforme homologação R1.2.2:
- Navegação (comportamento idêntico, apenas fonte muda para URL)
- Favoritos, destaques, histórico, conexões
- Cache local e React Query (chaves e TTLs mantidos)
- Contratos de `bible-text` edge function
- `ReadingSettingsContext`

## Gate para Fase 2 (extração)

Só executar a extração após:
1. ✅ Este mapa homologado.
2. Bateria de testes de regressão de `Bible.tsx` verde: `src/components/cathedra/__tests__/Bible.regression.test.tsx`, `BibleAccessibility.test.tsx`, `e2e/bible-language.spec.ts`.
3. Snapshot de comportamento (screenshot Playwright de `/bible`, `/bible?view=chapters`, `/bible?view=reading`) para diff pós-refatoração.

Fase 2 será dividida em ondas curtas (1 hook por commit) para permitir bisect em caso de regressão.
