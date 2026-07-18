
# Sprint 3.1 — Biblioteca Viva

**Duração estimada:** 1 sprint focada, entrega única.
**Escopo:** apenas `/biblioteca` e componentes visuais associados.
**Ousadia:** 3/5 — refinar com força a linguagem Logos 2030 já existente, sem reescrever componentes do zero nem trocar bibliotecas.

---

## Regras da sprint (invioláveis)

1. Zero mudanças em services, rotas, tabelas, adapters ou lógica de dados.
2. Zero novas dependências.
3. Só edito arquivos de apresentação (`BibliotecaPage.tsx`, `BookCover.tsx`, `ContinueReadingHero.tsx`, tokens em `index.css`).
4. Nenhuma alteração fora de `/biblioteca` — se algo puxar mudança em outra tela, vira débito.
5. Entrega inclui prova visual em 3 viewports (375 / 768 / 1440).

---

## O que muda (5 movimentos)

### 1. Primeira dobra: mesa de novidades, não catálogo
- Remover qualquer resquício de "grid uniforme" acima da dobra.
- `ContinueReadingHero` ganha peso de página aberta: tipografia maior, respiro lateral, indicação sutil de progresso como marca de leitura (fio dourado vertical à esquerda), não barra.
- Ao lado (desktop) ou abaixo (mobile), 2–3 "obras em destaque" com tratamento tipográfico distinto — não card, mas evocação de lombada.

### 2. Capas com peso editorial real
- `BookCover` recebe variações por obra (Bíblia, Catecismo, Magistério, Santos, Padres) usando paletas identitárias já definidas.
- Textura de papel sutil (já existe token) aplicada com mais presença.
- Tipografia da capa: Cormorant em versaletes, número/sigla em destaque, autor/tradição em Karla pequena.
- Sombra editorial (não drop-shadow SaaS): sombra lateral direita simulando profundidade de livro em pé.

### 3. Ritmo da página: seções como capítulos
- Substituir divisores atuais por `editorial-rule` curto (160px, já existe) + eyebrow tipográfico em versaletes ("Continuar", "Descubra", "Coleções").
- Espaçamento vertical entre seções aumenta (respiração de livro), não diminui.
- Remover qualquer título de seção genérico ("Livros", "Categorias") — trocar por copy curatorial ("O que você procura hoje?", "Leituras para este tempo").

### 4. Seção "Descubra" como curadoria humana
- Layout assimétrico: 1 destaque grande + 2 secundários, não grid 3x3.
- Cada item traz uma linha curatorial curta ("Um caminho para começar pela Misericórdia") em vez de descrição técnica.
- Hover/tap: leve deslocamento vertical + fio dourado aparecendo à esquerda. Sem escala, sem sombra colorida.

### 5. Microinterações contemplativas
- Transições de entrada: fade + translate-y de 8px, duração 400ms, easing suave (já disponível via framer-motion existente).
- Sem parallax, sem scroll-jacking, sem reveals dramáticos. O objetivo é serenidade, não espetáculo.
- Focus states: fio dourado 2px, sem outline azul do navegador.

---

## O que NÃO muda nesta sprint

- Estrutura de dados de obras, coleções, progresso.
- Rotas, navegação, deep links.
- Reader, Pesquisa, Formação, Nexus, Footer.
- Header/identidade global (já foi tratada em CAT-032R).
- Qualquer coisa em `/admin`.

---

## Detalhes técnicos

**Arquivos previstos para edição:**
- `src/pages/BibliotecaPage.tsx` — reorganização de seções, copy curatorial, layout assimétrico da "Descubra".
- `src/components/biblioteca/BookCover.tsx` — variações tipográficas por obra, sombra lateral, textura.
- `src/components/biblioteca/ContinueReadingHero.tsx` — tratamento de página aberta, marca de leitura vertical.
- `src/index.css` — apenas se faltar algum token (sombra lateral editorial, fio dourado de foco). Sem novos tokens de cor.

**Validação:**
- Playwright: 3 screenshots (375/768/1440) antes e depois, salvos em `/tmp/browser/sprint-3-1/`.
- Checklist acessibilidade: contraste, tap targets 44px, navegação por teclado, focus visível.
- Sem regressão em `/biblioteca` — links, filtros e navegação continuam funcionais.

---

## Entrega

Relatório antes×depois com:
- 6 screenshots (3 viewports × antes/depois).
- Diff de arquivos tocados (esperado: 3–4 arquivos, ~200–350 linhas).
- Checklist de regras da sprint cumpridas.
- Nota perceptiva estimada por superfície.

Se aprovar este plano, começo pela captura do estado atual da `/biblioteca` nos 3 viewports antes de tocar em qualquer arquivo.
