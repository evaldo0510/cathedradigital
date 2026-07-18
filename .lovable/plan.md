# Sprint R1 — Biblioteca (padrão visual do Cathedra)

Objetivo: transformar `/biblioteca` no **padrão de linguagem editorial** que R2..R7 herdarão, sem tocar arquitetura. Reskin puro sobre `src/components/cathedra/BibliotecaPage.tsx` (859 linhas), preservando `useBibliotecaState`, `useBibliotecaRecents`, `useFavorites` e a tela de eixos "O que você procura?".

## 5 regras absolutas (do usuário)

1. HTML Stitch é referência de experiência, não código-fonte.
2. Sem componentes paralelos — nada de `BibliotecaPageV2`. Edita o arquivo existente.
3. Todo componente novo é reutilizável (prefixo `Editorial*`, em `src/components/editorial/`).
4. Biblioteca é o padrão — nada específico da Biblioteca vira componente.
5. PR entrega diff antes/depois + o que ficou igual + o que é reutilizável.

## Fundação — primitivos `Editorial*`

Criados uma única vez em `src/components/editorial/`, consumidos por R1 e reutilizados em R2..R7. Cada um é um **wrapper visual** — sem estado de domínio, sem fetch, sem regra de negócio. Só recebe children/props de apresentação e aplica tokens `stitch-*`.

- **EditorialShell** — canvas full-bleed com container `max-w-[--stitch-container-max]`, padding responsivo (`--stitch-margin-mobile` → `--stitch-margin-edge`), fundo `bg-stitch-background`, textura sutil opcional.
- **EditorialHero** — hero de abertura: kicker (`font-stitch-label` uppercase), título display (`font-stitch-display` + `text-stitch-display-lg`), subtítulo, filete dourado (`bg-stitch-secondary`), slot para ação. Grande, respiração, imagem/textura opcional via prop.
- **EditorialSection** — bloco tipográfico: `<section>` com kicker + título `stitch-headline-md` + regra dourada fina + slot. Espaçamento vertical `var(--stitch-editorial-stack)`.
- **EditorialHeader** — cabeçalho de seção compacto (só kicker + título + "ver todos") para grids/listas dentro de uma tela.
- **EditorialDivider** — filete horizontal (variantes: `hair`, `gold`, `gold-fade`), usa `--rule-gold` já existente. Substitui `<hr>` cru.
- **EditorialSurface** — cartão base editorial: `bg-stitch-surface-container-low`, borda `border-stitch-outline-variant/40`, raio `--stitch-radius-xl`, hover suave. Base para EditorialCard.
- **EditorialCard** — cartão de conteúdo (capa + kicker + título + metadado). Aceita variantes `book` (proporção 2:3 estante), `wide` (2 colunas), `plain`.
- **EditorialGrid** — grid responsivo (`gap` = `--stitch-gutter`; colunas via prop `cols`). Não sabe o que contém.
- **EditorialShelf** — carrossel horizontal snap-scroll para "coleções em estante" (movimento 3). Reutilizável para "Continue lendo" e "Descobertas".
- **EditorialFooter** — rodapé minimalista: uma linha, kicker, muito espaço.

Nenhum destes pode importar hook de domínio, service ou registry. Zero lógica de conteúdo.

## Movimentos da Biblioteca

### Movimento 1 — Hero editorial

Substitui o cabeçalho atual pelo `EditorialHero` com kicker "Biblioteca Viva", título display "A tradição em suas mãos" (copy exata a confirmar com você), subtítulo espiritual curto, filete dourado, textura de pergaminho muito discreta (`opacity 0.06`, herda do padrão já existente `parchment-overlay`). Sem CTA duro — o Hero é atmosfera, não ação.

### Movimento 2 — Continue lendo (peça-mestre)

Maior elemento da tela abaixo do Hero. Usa `EditorialSurface` grande em split-screen: à esquerda, capa da obra em estilo "livro aberto" (proporção 2:3, spine dourado, textura sutil — reaproveita `CoverPalette` já existente em `BibliotecaPage.tsx`); à direita, kicker "Você parou em", título da obra, referência/percentual de progresso, botão primário "Continuar". Fonte dos dados: `useBibliotecaRecents()` (já existe). Se lista vazia, esconde o bloco.

### Movimento 3 — Coleções (estante)

Substitui o grid atual da aba "Coleções" por `EditorialShelf` horizontal com snap. Cada item é `EditorialCard variant="book"` com spine visível, título gravado, autor em `stitch-label-sm`. Sensação de estante física, não de dashboard. Aba "Coleções" existente permanece; muda só a apresentação.

### Movimento 4 — Descobertas (curadoria)

Nova seção editorial abaixo das coleções, alimentada pela mesma fonte já usada em "Temas"/"Escritos" (sem novo hook). Layout assimétrico: 1 destaque grande (`EditorialCard variant="wide"`) + 3 secundários em `EditorialGrid cols={3}`. Copy curatorial curta em vez de listagem. Sem paginação — é curadoria, não catálogo.

### Movimento 5 — Rodapé

`EditorialFooter` substitui o rodapé pesado atual da página. Uma linha: kicker "Cathedra · Biblioteca Viva", data litúrgica se disponível via hook existente, link discreto para "Sobre a Biblioteca". Muito espaço em branco. Sem múltiplas colunas.

## Preservado integralmente

- `useBibliotecaState`, `useBibliotecaRecents`, `useFavorites` — hooks intactos.
- Sistema de abas (`tabs`) e eixos (`axes`) — permanece; muda só o visual dos chips/tabs (`bg-stitch-secondary-container` no ativo, `text-stitch-on-surface-variant` no inativo, `border-stitch-outline-variant`).
- `ContemplativeLayout` — permanece como layout base.
- `CoverPalette` e sistema de capas — permanece; ganha apenas variante `variant="book"` no `EditorialCard`.
- Todas as rotas, links, deep-links e telemetria.

## Proibido tocar

Knowledge Engine, RouteRegistry, Continuation Engine, Nexus resolver, Supabase, ReaderService, ContentAdapters, EnvironmentRegistry, JourneyService, qualquer hook de domínio.

## Ícones

Manter Lucide (`Icons` de `@/constants`). Nenhum Material Symbols. Nenhum ícone novo em R1.

## Entregáveis do PR

1. `src/components/editorial/` com os 9 primitivos + `index.ts` + `README.md` curto documentando cada um.
2. `src/components/cathedra/BibliotecaPage.tsx` reescrito só na camada de apresentação (mesmo arquivo, mesmos imports de hook).
3. `docs/reskin/biblioteca.md` no formato do template R0: antes, depois, componentes reutilizados, componentes só redesenhados, componentes proibidos, diff de tokens, checklist de regressão.
4. Screenshots antes/depois (light + dark, desktop + mobile 375px) em `/tmp/reskin/biblioteca-*.png`, referenciados no doc.

## Critério de aceite (do usuário)

Abrir `/biblioteca` por 3 segundos deve transmitir "estou entrando em uma biblioteca de estudo da Igreja", não "estou entrando em um dashboard". Validação: comparar screenshots antes/depois lado a lado no PR e você aprovar.

## Checklist técnico (bloqueia merge)

- [ ] Zero cor hardcoded nova (só `stitch-*` e tokens semânticos existentes).
- [ ] E2E de `/biblioteca` verde sem alterar seletores.
- [ ] axe (contraste AA) verde em light e dark.
- [ ] Design-system audit verde.
- [ ] Lighthouse/perf-pr-guard sem regressão (Hero não carrega imagem pesada nova).
- [ ] Snapshot visual atualizado só da rota `/biblioteca`.
- [ ] Mobile 375px: Hero legível, Continue-lendo empilha, Estante rola horizontal sem overflow do body.
- [ ] Zero import de hook/service dentro de `src/components/editorial/`.

## Pergunta antes de começar

1. Copy do Hero: "A tradição em suas mãos" é chute meu — você tem uma linha oficial? (posso seguir com essa se preferir).
2. Textura de pergaminho no Hero: manter (herança Logos 2030) ou remover para ficar mais próximo do Stitch original?

Se responder as duas, abro R1 direto. Se não, uso os defaults e você ajusta no PR.
