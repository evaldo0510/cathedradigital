# Cathedra 2.0 — Wireframes de Baixa Fidelidade

Cinco telas principais. ASCII wireframes intencionalmente crus (baixa fidelidade = decisões de estrutura, não de estética).
Cada tela mapeada às **jornadas** e à **arquitetura da informação**.
Alta fidelidade só depois do Design System v2 aplicado.

Legenda: `[ Ação ]` botão · `« … »` campo · `▸` toque expande · `°` âncora Nexus · `━` divisor · `↩` retomar.

---

## Tela 1 — ÁTRIO (mobile 360)

Jornadas atendidas: **J1, J3, J6**.
AI: cômodo raiz do sitemap.

```text
┌────────────────────────────────┐
│ Cathedra              ⌘  ↩  👤 │  header
├────────────────────────────────┤
│ ═══════════════════════════════│  linha 2px cor litúrgica
│                                │
│   Pax et bonum, João           │  saudação (Cormorant 30)
│   Tempo Comum · sexta-feira    │  meta (Work Sans 14, muted)
│                                │
│  ╭──────────────────────────╮  │  Cartão de Ação principal
│  │  RITUAL DO DIA           │  │
│  │  ● Escuta   · Sl 23      │  │
│  │  ○ Leitura  · Jo 15      │  │
│  │  ○ Exame                 │  │
│  │  [ Iniciar ]             │  │
│  ╰──────────────────────────╯  │
│                                │
│  Ofício de hoje                │  seção secundária
│   Laudes · Missa · Vésperas    │
│   [ Rezar Laudes ]             │
│                                │
│  Santo do dia                  │
│   S. Boaventura, D.I.          │
│                                │
│  ↩ Retomar                     │  Continuidade (J6)
│   • Jo 15:12                   │
│   • CIC §1234                  │
│   • Jornada Introdução (4/14)  │
│                                │
│  Nexus sugere °                │  opt-out global
│   "Videira" atravessa 6 fontes │
│                                │
├────────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤          │  bottom-nav
└────────────────────────────────┘
```

**Notas de decisão**
- Uma única CTA primária ("Iniciar" do Ritual). Todo o resto é secundário.
- Sem streak/XP na entrada (moram em Formar-se).
- "Retomar" é seção fixa, não card sumível.
- Anônimo vê a mesma estrutura, com dados genéricos.

---

## Tela 2 — BIBLIOTECA (Estudar → Por Tema, mobile 360)

Jornada atendida: **J2** (experiência-assinatura).
AI: `/estudar/tema`.

```text
┌────────────────────────────────┐
│ ← Estudar             ⌘  ↩  👤 │
├────────────────────────────────┤
│ [ Por Tema ]  Por Fonte  Test. │  abas horizontais
├────────────────────────────────┤
│                                │
│  « estudar…                  » │  campo de busca de tema
│                                │
│  Em destaque hoje (Tempo Com.) │
│  ┌──────────┐  ┌──────────┐    │  Cartões de Ação
│  │ Perdão   │  │ Videira  │    │
│  │ 6 fontes │  │ 6 fontes │    │
│  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐    │
│  │ Cruz     │  │ Reino    │    │
│  │ 6 fontes │  │ 5 fontes │    │
│  └──────────┘  └──────────┘    │
│                                │
│  ─── ou ───                    │
│                                │
│  Explorar por Fonte      ▸     │
│  Testemunhos             ▸     │
│  Verbete (A–Z)           ▸     │
│                                │
├────────────────────────────────┤
│ ⛪  [📖] 🕯️   🧭   👤           │
└────────────────────────────────┘
```

### Tela 2b — Estudo Composto (após escolher "Perdão")

```text
┌────────────────────────────────┐
│ ← Perdão              ⌘  ↩  👤 │  breadcrumb temático persistente
├────────────────────────────────┤
│  Perdão                        │  Cormorant 30
│  6 fontes · ~18 min            │
│                                │
│  1 · Escritura                 │  Cartão de Leitura
│  Mt 18,21-35 · Lc 15           │
│  "Setenta vezes sete…"°        │
│                                │
│  2 · Catecismo                 │
│  §§ 1422-1470                  │
│                                │
│  3 · Magistério                │
│  Misericordiae Vultus §§21-22  │
│                                │
│  4 · Padres                    │
│  Agostinho · Sermão 83°        │
│                                │
│  5 · Concílio                  │
│  Trento · sessão XIV           │
│                                │
│  6 · Cânones                   │
│  cân. 959-964                  │
│                                │
│  ─── Aplicação prática ───     │
│  Convite ao Sacramento         │
│  Roteiro de exame              │
│                                │
├────────────────────────────────┤
│  [ Salvar ] [ Anotar ] [ ↗ ]  │  barra de ação sticky
├────────────────────────────────┤
│                                │
│  Continuar amanhã?             │
│  → Vira Jornada de 7 dias      │
│                                │
└────────────────────────────────┘
```

**Notas**
- Breadcrumb temático persiste ao entrar em qualquer fonte (evita fluxo quebrado citado na Revisão §6).
- Se fonte não tem cobertura, seção mostra "Ainda não temos Padres para este tema" — não omite silenciosamente.
- Barra de ação é **sticky**, não flutuante (evita conflito com Logos).

---

## Tela 3 — LEITOR UNIVERSAL (mobile 360)

Jornadas atendidas: **J2, J3 (Lectio), J4 (destino de busca), J5, J6**.
AI: usado por Bíblia, CIC, Magistério, Padres, Concílios, Cânon, Aquino (mesma casca).

```text
┌────────────────────────────────┐
│ ← João  15         ⌘  🔗  👤   │  header + Nexus toggle
│ NVI-PT ▾   ↕ tamanho           │  seletor tradução + tipografia
├════════════════════════════════┤  ambient litúrgico
│                                │
│  15                            │  Cormorant 40 (número)
│                                │
│  1  Eu sou a videira°          │  Cormorant 18, leading-relaxed
│     verdadeira, e meu Pai      │
│     é o agricultor.            │
│                                │
│  2  Todo ramo que, estando     │
│     em mim, não dá fruto,      │
│     ele corta…°                │
│                                │
│  ┌── popover Nexus ─────────┐  │  não-modal, sob demanda
│  │ Ver também:              │  │
│  │ • CIC §755-757           │  │
│  │ • Lumen Gentium 6        │  │
│  │ • ST III q.8             │  │
│  │ • Cân. 204               │  │
│  │ • Agostinho, Tract. 81   │  │
│  └──────────────────────────┘  │
│                                │
│  … …                           │
│                                │
├────────────────────────────────┤
│ 🤍  ✎ Anotar   ↗ Compartilhar  │  barra contextual
├────────────────────────────────┤
│ [ ◀ Jo 14 ]        [ Jo 16 ▶ ] │
└────────────────────────────────┘

           ● Logos (canto inf. dir., flutuante)
```

**Notas**
- Mesmo componente serve para CIC, Padres, etc. — muda cabeçalho e paginação.
- Toggle 🔗 desliga **todos** os popovers Nexus globalmente.
- Modo Prece transforma esta tela: bottom-nav some, Logos some, barra some, cromia escurece.
- Botão ✎ Anotar é o gesto transversal do Diário.

---

## Tela 4 — PESQUISA (⌘K overlay, mobile 360)

Jornada atendida: **J4**.
AI: `/pesquisar` como cômodo + `⌘K` como camada.

```text
┌────────────────────────────────┐
│ « videira verdadeira         ✕ │  campo autofocus
├────────────────────────────────┤
│                                │
│  Sugestões de sintaxe          │  quando query curta
│  • jo 15         → João 15     │
│  • cic 1234      → CIC §1234   │
│  • cân 204       → Cânon 204   │
│                                │
│  ─── Resultados ───            │
│                                │
│  Bíblia (3)                    │  agrupado por fonte
│  ▸ Jo 15,1     "Eu sou…"       │
│  ▸ Jo 15,5     "… nada…"       │
│  ▸ Sl 80,9     "Do Egito…"     │
│                                │
│  Catecismo (2)                 │
│  ▸ §755        A Igreja é…°    │
│  ▸ §787        Comunhão…       │
│                                │
│  Padres (4)                    │
│  ▸ Agostinho · Tract. 81°      │
│  ▸ Cirilo Alex. · Comm. Jo°    │
│                                │
│  Magistério (1) · Cânon (0)    │
│  Orações (1) · Jornadas (1)    │
│                                │
├────────────────────────────────┤
│  Filtros: [Tempo] [Fonte] [PT] │  filtros sticky
└────────────────────────────────┘
```

**Notas**
- Overlay, não fullscreen — usuário vê a tela anterior por trás.
- Cada resultado mostra ° se tiver Nexus (≥1 fonte relacionada).
- Contagem por fonte visível mesmo quando zero (honestidade).
- `Esc` fecha; `Enter` abre o primeiro; `↑↓` navega.

---

## Tela 5 — FORMAÇÃO (Jornada em andamento, mobile 360)

Jornadas atendidas: derivada de J2 quando estudo vira Jornada.
AI: `/formar-se`.

```text
┌────────────────────────────────┐
│ ← Formar-se           ⌘  ↩  👤 │
├────────────────────────────────┤
│ [ Em andamento ] Recom. Catál. │
├────────────────────────────────┤
│                                │
│  Introdução à Fé               │  Cormorant 24
│  Dia 4 de 14                   │
│  ████████░░░░░░░░░░  28%       │
│                                │
│  Hoje: Credo, artigo 3         │
│   • Ler Jo 1,1-18              │
│   • CIC §§ 456-478             │
│   • Reflexão guiada (Logos)    │
│   • Anotar no Diário           │
│  [ Continuar ]                 │
│                                │
│  ─── Próximos dias ───         │
│  ○ 5 · Encarnação              │
│  ○ 6 · Nascimento              │
│  ○ 7 · Vida oculta             │
│                                │
│  ─── Outras jornadas ativas ─  │
│  ▸ 40 dias com S. Agostinho    │
│    Dia 12/40                   │
│                                │
├────────────────────────────────┤
│ ⛪   📖   🕯️   [🧭]  👤         │
└────────────────────────────────┘
```

**Notas**
- Progresso é o herói da tela — Cormorant grande + barra.
- Conquistas/XP existem em aba própria dentro deste cômodo, nunca no Átrio.
- Ao concluir a jornada, tela de conclusão com sugestão da próxima (não é celebração barulhenta — é retrato, data, próximo passo).

---

## Padrões transversais (aparecem em todas)

| Elemento | Onde | Comportamento |
|---|---|---|
| Bottom-nav (5) | mobile, todas exceto Modo Prece | fixo, safe-area |
| ⌘ (busca) | header, todas | abre overlay Pesquisa |
| ↩ (retomar) | header, todas | último item aberto |
| 👤 (perfil) | header, todas | vai para Minha Jornada |
| 🔗 (Nexus) | header quando há âncoras | liga/desliga popovers globais |
| ● Logos | canto inf. direito | verbo muda por contexto |
| Ambient litúrgico | linha 2px topo | cor do dia, auto |
| ✎ Anotar | após leitura/oração | escreve no Diário |

---

## Cobertura de jornadas × wireframes

| Jornada | Tela(s) principal(is) |
|---|---|
| J1 Primeiro acesso | Tela 1 (Átrio anônimo) |
| J2 Primeiro estudo | Tela 2 → 2b → 3 |
| J3 Primeira oração | Tela 1 → Tela 3 (Modo Prece) |
| J4 Pesquisa | Tela 4 → Tela 3 |
| J5 Favoritos | Tela 3 (🤍) → Minha Jornada (fora deste set) |
| J6 Continuação | Tela 1 (↩) → Tela 3 |

---

## O que estes wireframes propositalmente **não** definem

- Escolha final de tipografia display (fica no Design System v2).
- Micro-animações (ficam no protótipo navegável).
- Estados de erro/vazio (próxima iteração).
- Telas de Minha Jornada, Rezar (índice), Testemunhos, Verbete — próximo lote.
- Console técnico — não é produto ao usuário.

Próxima etapa: **protótipo navegável clicável** dessas 5 telas + validação com os 3 arquétipos, antes de qualquer código.
