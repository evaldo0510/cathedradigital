## Sprint E2 — Migração de Heros com Fidelidade Visual (Caminho B)

Objetivo: mover TODOS os heros das páginas de conteúdo para `EditorialHero`, **preservando exatamente** o visual atual de cada página. Zero regressão visual. Nenhuma mudança de lógica ou rotas.

### 1. Extensão do EditorialHero (fundação)

Adicionar props ao `EditorialHero` em `src/components/editorial/index.tsx` sem quebrar chamadas atuais:

- `variant?: 'editorial' | 'legacy'` — default `editorial` (Cormorant italic + kicker dourado). `legacy` = Sans (Karla) sem italic, para páginas que ainda usam o visual antigo.
- `align?: 'left' | 'center'` — default `left`.
- `icon?: React.ReactNode` — ícone Lucide opcional exibido ao lado/acima do kicker.
- `badges?: React.ReactNode` — slot para pílulas/tags já usadas na Home, Jornadas, About.
- `background?: 'none' | 'parchment' | 'gradient'` — permite reproduzir gradientes atuais (About, Jornadas).
- `size?: 'sm' | 'md' | 'lg'` — controla escala de título e padding vertical.
- `titleClassName`, `subtitleClassName`, `kickerClassName` — escapes tipográficos por página.

Chamadas atuais (BibliotecaPage, Readers) continuam funcionando sem alteração.

### 2. Inventário e classificação dos 14 heros

Cada hero é classificado como **editorial** (já no padrão Logos 2030) ou **legacy** (visual atual preservado via `variant="legacy"`).

| # | Arquivo | Rota | Variante |
|---|---------|------|----------|
| 1 | `AboutPage.tsx` | `/sobre` | legacy + gradient |
| 2 | `BibleHome.tsx` | `/bible` | legacy |
| 3 | `BibliotecaPage.tsx` | `/biblioteca` | editorial (já feito — só normalizar) |
| 4 | `JornadasPage.tsx` | `/jornadas` | legacy + gradient + badges |
| 5 | `Magisterium.tsx` | `/magisterio` | legacy |
| 6 | `CheckoutPage.tsx` | `/checkout` | legacy sm |
| 7 | `formacao/FormacaoHero.tsx` | `/formacao` | legacy + badges |
| 8 | `HomeUnified.tsx` (hero interno autenticado) | `/` | legacy + badges |
| 9 | `SearchPage` / `/buscar` | `/buscar` | legacy sm |
| 10 | `SaintsPage` | `/santos` | legacy |
| 11 | `PrayerPage` | `/oracoes` | legacy |
| 12 | `LiturgyPage` | `/liturgia` | legacy |
| 13 | `NexusHub` / atalhos | `/nexus` | legacy sm |
| 14 | `AdminSEO` / painéis admin | `/admin/seo` | legacy sm |

Confirmar cada um durante a migração (arquivos podem variar de nome).

### 3. Batches de execução

**Batch A — Fundação + páginas de conteúdo principal (5 heros):**
Biblioteca (normalizar), BibleHome, Magisterium, SaintsPage, PrayerPage.

**Batch B — Fluxos verticais (5 heros):**
AboutPage, JornadasPage, FormacaoHero, LiturgyPage, HomeUnified.

**Batch C — Utilitários (4 heros):**
CheckoutPage, SearchPage, NexusHub, AdminSEO.

Cada batch:
1. Ler o hero atual.
2. Substituir markup pela chamada `<EditorialHero variant="legacy" ...>` mantendo tokens e classes existentes via `titleClassName`/`subtitleClassName`.
3. Rodar o dev server e comparar visualmente via Playwright (desktop 1280 + mobile 375).
4. Anotar diffs no relatório `docs/reskin/E2-migration.md`.

### 4. Critérios de aceite

- Diff visual ≤ 2px em cada hero (mesma fonte, mesmo padding, mesmas cores).
- Zero mudança de rota, zero mudança de dados, zero remoção de badges/CTAs.
- `EditorialHero` continua funcionando nas chamadas atuais sem alteração.
- Relatório com screenshots antes/depois por página em `docs/reskin/E2-migration.md`.

### 5. Fora de escopo

- Landing `HeroSection` cinematográfica (partículas/parallax) — permanece intocada.
- Nenhum reskin visual novo (isso é o Batch D da Sprint E3, fora desta sprint).
- Nenhuma refatoração de lógica de página.

### Detalhes técnicos

- Todos os tokens continuam `stitch-*`. Nenhuma cor hardcoded.
- `variant="legacy"` aplica `font-stitch-sans`, `not-italic`, kicker sem tracking exagerado.
- `background="gradient"` reutiliza o gradiente que já existe em `index.css` (não cria novo).
- Testes: adicionar smoke test em `tests/e2e/editorial-hero-migration.spec.ts` verificando que cada rota renderiza `<section data-editorial-hero>` sem erro de console.

Quer que eu execute agora começando pelo **Batch A**?
