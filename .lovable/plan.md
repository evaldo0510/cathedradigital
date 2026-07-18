
# Nexus Editorial — Sprint 3.1.6

## Princípio inegociável

Nada da inteligência muda. **Zero** alteração em `KnowledgeGraph`, `KnowledgeResolver`, `ContinuationEngine`, `ThemeRegistry`, `RouteRegistry`, `useNexus`, ou nas Edge Functions.

Só muda: **o componente de apresentação, a microcopy e a interação de abertura.**

O Nexus deixa de ser um popover ancorado (Radix) e passa a ser um **painel editorial lateral** — a "margem do livro" onde a Tradição comenta a passagem que está sendo lida.

---

## O que muda visualmente

### 1. Contêiner

- Desktop (≥ 1024px): `Sheet` lateral direito, largura fixa `min(460px, 38vw)`, altura total, sombra editorial suave à esquerda, sem overlay escuro cheio — apenas um véu de `background/40` para não ocultar o texto que está sendo comentado.
- Tablet/Mobile: `Sheet` bottom (full width, altura `90vh`, arrasto para fechar), preservando o gesto natural de leitura vertical.
- Fecha com Esc, clique fora, e botão "Fechar" com tap-target 44×44.
- Rolagem do body do Reader **continua funcionando** enquanto o painel está aberto (regra herdada do teste E2E atual).

### 2. Cabeçalho editorial

```
✦ NEXUS
Esta passagem conversa com a Tradição
—— Catecismo §1817 · A Esperança
```

- Eyebrow em versaletes douradas (`text-secondary`, tracking 0.32em).
- Título italic serif (Cormorant), 2 linhas, contemplativo — não descritivo.
- Fio dourado curto (`editorial-rule`) abaixo.

### 3. Corpo narrativo — não lista, capítulos

Cada bloco é uma **seção editorial** com um verbo relacional em voz ativa:

| Fonte no grafo | Título editorial (microcopy) |
|---|---|
| `scripture` | "Esta verdade nasce da Escritura" |
| `catechism` | "A Igreja a formulou assim" |
| `magisterium` | "Foi aprofundada pelo Magistério" |
| `fathers` | "Os Padres a contemplaram" |
| `saints` | "Foi vivida por" |
| `theme` | "Continue este caminho" |
| `journey` | "Percorra passo a passo" |

Estrutura de cada seção:

```
Foi aprofundada pelo Magistério
────────────────────────────────
Spe Salvi
Bento XVI · 2007

Uma linha de citação em italic, quando existir,
                                     tirada do trecho relacionado.

[Ler documento →]
```

- Título: eyebrow `text-secondary/80` versaletes.
- Nome da obra: `font-serif italic text-xl`.
- Meta (autor · ano): `text-primary/50 text-xs uppercase tracking-wider`.
- Citação (quando disponível): `font-serif italic text-primary/65`, deslocada, sem aspas curvas — pull-quote editorial.
- CTA: link com borda inferior dourada no hover, nunca botão sólido.
- Separador entre seções: `editorial-rule--hair` (fio de 40px centralizado), não `<hr>` cheio.

### 4. Rodapé "Continue este caminho"

Última seção, sempre presente, alimentada pelo `ContinuationEngine`:

```
Continue este caminho
─────────────
Esperança — Estudo composto
Sete parágrafos, três documentos, dois santos.

[Entrar no percurso →]
```

Se o motor não devolver sugestão, cai em fallback estático por tema.

### 5. Estados

- **Carregando**: shimmer editorial — três linhas de "gathering references..." em versaletes cinza, sem spinner.
- **Vazio** (sem conexões): não some. Mostra card único:
  > "Este trecho ainda repousa em silêncio. Volte em breve — o Nexus continua a tecer."
  Com CTA para o tema mais próximo do parágrafo.
- **Erro**: idem vazio, com opção "Tentar novamente".

### 6. Microcopy — banidos

Nunca mais no Nexus:
- "Relacionados"
- "Ver mais"
- "Links"
- "Referências" (só usado em citação bibliográfica, não como header)
- "Recursos relacionados"

Substituídos por: *Ecos desta leitura · A mesma luz em outros textos · Esta página conversa com · Caminhos desta verdade · Continue este estudo*.

### 7. Ancoragem semântica

O botão que abre o Nexus permanece exatamente onde está hoje (ao lado do parágrafo). O que muda: em vez de abrir Popover ancorado, dispara o painel lateral. Ancoragem visual é substituída por **contexto no cabeçalho do painel** ("Catecismo §1817"), que responde à pergunta "de onde vim?".

---

## Arquitetura de arquivos

Criar (todos apresentacionais):
- `src/components/nexus/NexusPanel.tsx` — Sheet + layout editorial.
- `src/components/nexus/NexusSection.tsx` — seção narrativa reutilizável.
- `src/components/nexus/NexusContinuation.tsx` — última seção, plugada no `ContinuationEngine` existente.
- `src/components/nexus/nexus.presets.ts` — mapa `kind → { eyebrow, verb, icon }`.

Refatorar:
- `src/components/nexus/NexusTrigger.tsx` (ou o botão atual) — só troca o handler: em vez de `openPopover`, chama `openNexusPanel(nodeId)`.
- `src/hooks/useNexus.ts` — adicionar apenas `isPanelOpen` / `openPanel` / `closePanel`. Nenhuma mudança de fetch.

Aposentar (mover para `_legacy/`, não deletar ainda):
- `NexusPopover.tsx` — mantém 1 sprint para rollback rápido.

---

## Testes

E2E novos (`tests/e2e/nexus-panel-*.spec.ts`):
1. `nexus-panel-opens.spec.ts` — clica em Nexus, painel aparece à direita em desktop, body continua rolável.
2. `nexus-panel-mobile.spec.ts` — em 390×844, abre como bottom sheet ocupando 90vh, arrasto fecha.
3. `nexus-panel-narrative.spec.ts` — valida que os títulos editoriais aparecem ("nasce da Escritura", "foi aprofundada", "foi vivida por"), não "Relacionados".
4. `nexus-panel-empty.spec.ts` — força um parágrafo sem conexões e valida a copy contemplativa.
5. `nexus-panel-continuation.spec.ts` — valida que "Continue este caminho" leva ao percurso certo.
6. Snapshot visual em light e dark, dois breakpoints.

Regressão: os testes `nexus-popover-*.spec.ts` antigos são renomeados para `_legacy/` até a Sprint fechar.

---

## Critério de aceitação (o único que importa)

Um leitor que **nunca ouviu falar do Cathedra** abre um parágrafo, clica no Nexus, e reage com:

> "Não sabia que esses textos estavam ligados assim."

Se a reação for "ah, um painel de links relacionados", a sprint não foi cumprida — mesmo que tudo compile.

---

## Escopo travado

- Não mexer no Knowledge Engine.
- Não adicionar novas fontes de dados.
- Não redesenhar o Reader nesta sprint (fica para 3.2).
- Não adicionar animações além do slide de entrada (300ms `easeOut`) e fade das seções (`stagger 80ms`).
- Não adicionar novas dependências. Usar o `Sheet` de shadcn já instalado.

---

## Entrega

1. Snapshot antes (Playwright) do popover atual.
2. Implementação em uma única passada.
3. Snapshot depois nos mesmos parágrafos.
4. Relatório curto antes×depois com as duas imagens lado a lado.
