
# Cathedra 2.0 — Revisão Crítica + Plano v2 (por experiências)

Sem código. Revisão do `.lovable/plan.md` v1 sob AI, UX, Design de Produto e Formação Católica, seguida da versão 2.0 reorganizada por experiências (verbos do usuário), preservando toda funcionalidade.

---

## Parte I — Revisão Crítica do v1

### Redundâncias
- **Enciclopédia + A-Z Faith + Glossário + Dogmas + Temas** disputam o mesmo espaço mental ("verbete curto"). Hoje são 5 rotas; no v1 continuam 5 abas dentro do Scriptorium.
- **Jornadas + Itinerários + Trilhas** são três nomes para a mesma coisa (formação sequencial guiada).
- **Missal + Breviário + Liturgia + Calendário Litúrgico** — quatro entradas para "o que a Igreja reza hoje".
- **Santos + Papas + Aparições** foram jogados no Oratório, mas são conteúdo de *estudo/testemunho*, não de oração.
- **Busca (⌘K) + Nexus** operam camadas separadas fazendo trabalho parecido: descobrir conexões.

### Módulos excessivos
- `/design-system`, `/guia-modulos`, `/a11y-audit`, `/security-audit`, `/visual-audit`, `/telemetry`, `/cache-manager`, `/offline`, `/diagnostico`, `/bible-recovery`, `/catechism-health`, `/seo-verify` — **12+ rotas técnicas tratadas como rotas de produto**. Poluem o mapa mental. Devem morar dentro de `/admin/*`.
- `/upgrade`, `/pricing`, `/checkout`, `/transactions` — três estágios do mesmo funil, expostos como rotas independentes.

### Lacunas de navegação
- **Não existe entrada por tema/assunto.** Só por fonte (livro bíblico, número do CIC…). Quem quer estudar *perdão*, *sofrimento*, *casamento* não tem porta.
- **Não existe modo "estudo composto"** — a experiência de um tema atravessando Bíblia → CIC → Padres → Concílios → Aplicação, que é *o* diferencial do Cathedra.
- **Padres da Igreja e Concílios** não aparecem nem no v1 nem no código atual.
- **Continuidade** existe só no Átrio. Deveria ser universal (barra flutuante "retomar").
- **Modo offline / leitura sem rede** existe como rota, não como estado de UI.

### Inconsistências de fluxo
- **Logos IA** vive em Caminho (v1), mas é invocado no Scriptorium (dúvidas), Oratório (guiar oração) e Átrio (sugestões). É camada, não cômodo.
- **Nexus** o v1 já reconhece como camada, mas ainda o pinta como popover só do Scriptorium. Precisa ser primeira classe em todo lugar.
- **Diário** foi para Cela, mas o gesto de "escrever no diário" nasce no Oratório e no Scriptorium. É destino transversal, não cômodo isolado.

### Oportunidades de simplificação
- Colapsar Enciclopédia/A-Z/Glossário/Dogmas em uma entidade única: **Verbete** (unidade atômica de conhecimento).
- Colapsar Jornadas/Itinerários/Trilhas em **Formação**.
- Colapsar Missal/Breviário/Liturgia/Calendário em **Ofício**.
- Mover Santos/Papas/Aparições para Estudar → Testemunhos.
- Fundir Busca ⌘K + Nexus em um único **Sistema de Conexões** (mesma engine, duas superfícies).

---

## Parte II — Plano v2 (por experiências)

### Fase 1 — Manifesto

**O que é o Cathedra?**
Uma casa digital onde a fé católica é vivida como um só ato: rezar, estudar, formar-se e testemunhar. Não é um app de Bíblia, nem de orações, nem de cursos — é o lugar onde essas coisas deixam de ser separadas.

**Para quem existe?**
- **Peregrino** — chega buscando, não sabe por onde começar.
- **Discípulo** — já reza, quer ritmo diário.
- **Estudioso** — quer profundidade sem sair da unidade da fé.

**Qual transformação entrega?**
Deixar de consumir conteúdo religioso solto e passar a viver uma **vida interior organizada**: ritmo diário, um tema por vez, todas as fontes convergindo, memória do caminho.

**Pilares inegociáveis:**
1. **Unidade** — Escritura, Tradição, Magistério, Cânon, Padres, Concílios são *uma só voz*.
2. **Ritmo** — o dia litúrgico dita a experiência, não o cardápio de features.
3. **Profundidade sem fricção** — clique não interrompe oração; verbete não substitui estudo.
4. **Soberania** — banco local é fonte da verdade; nada depende de terceiro para funcionar.
5. **Mobile primeiro, silêncio depois** — projetado para o polegar e para o silêncio (sem gamificação na entrada).

---

### Fase 2 — Arquitetura da Informação

Cinco **experiências**, não módulos. Nome de cada cômodo é o verbo que o usuário usa.

```text
CATHEDRA
│
├── HOJE            — "quero começar / retomar"
│   ├── Ritual do Dia (Escuta · Leitura · Exame)
│   ├── Ofício de hoje (Missa · Horas)
│   ├── Santo & tempo litúrgico
│   ├── Continuidade (retomar leitura/oração/jornada)
│   └── Sugestão do Nexus
│
├── ESTUDAR         — "quero entender"
│   ├── Por Tema           (perdão, sofrimento, casamento…)   ← porta principal
│   ├── Por Fonte
│   │   ├── Bíblia
│   │   ├── Catecismo
│   │   ├── Magistério
│   │   ├── Código Canônico
│   │   ├── Padres da Igreja      (novo)
│   │   ├── Concílios              (novo)
│   │   └── Suma / Aquino
│   ├── Testemunhos        (Santos · Papas · Aparições)
│   └── Verbete            (Enciclopédia + A-Z + Glossário + Dogmas unificados)
│
├── REZAR           — "quero rezar"
│   ├── Ofício (Missa · Laudes · Vésperas · Completas)
│   ├── Rosário · Via-Sacra · Ladainhas
│   ├── Orações tradicionais
│   ├── Lectio Divina
│   ├── Exame de consciência · Confissão
│   └── Adoração silenciosa (timer)
│
├── FORMAR-SE       — "quero crescer"
│   ├── Jornadas ativas
│   ├── Jornadas recomendadas
│   ├── Certamen (quiz semanal)
│   ├── Progresso e conquistas
│   └── Logos como tutor guiado
│
└── MINHA JORNADA   — "meu caminho / minhas coisas"
    ├── Diário espiritual
    ├── Favoritos
    ├── Notas
    ├── Histórico e continuidade
    ├── Perfil & assinatura
    └── Comunidade
```

**Camadas transversais (não são cômodos, atravessam todos):**

- **⌘K Conexões** — busca unificada + Nexus fundidos. Um só campo, uma só engine, presente em qualquer tela.
- **Logos IA** — invocável em qualquer contexto ("explique", "guie", "monte estudo sobre X"). Nunca rota.
- **Diário rápido** — botão flutuante "anotar" após qualquer leitura ou oração.
- **Modo Prece** — quando o usuário reza, a interface silencia (esconde bottom-nav, escurece cromia, desativa popovers).
- **Console técnico** — todas as 12+ rotas de auditoria/health colapsam em `/admin` com abas internas. Fora do mapa do usuário.

#### Mapeamento antigo → novo (nada removido)

| Rotas atuais | Novo endereço |
|---|---|
| `/hoje`, `/dashboard` | HOJE |
| `/bible`, `/catechism`, `/magisterium`, `/aquinas` | ESTUDAR → Por Fonte |
| `/dogmas`, `/glossary`, `/encyclopedia`, `/az-faith` | ESTUDAR → Verbete (unificado) |
| `/temas` | ESTUDAR → Por Tema (promovido a porta principal) |
| `/santos`, `/papas`, `/aparicoes` | ESTUDAR → Testemunhos |
| *(novo)* Padres, Concílios | ESTUDAR → Por Fonte |
| `/liturgia`, `/missal`, `/breviary`, `/calendar` | REZAR → Ofício |
| `/rosary`, `/viacrucis`, `/litanies`, `/oracao`, `/lectio`, `/confession` | REZAR |
| `/jornadas`, `/itineraria`, `/trilhas`, `/quiz`, `/achievements` | FORMAR-SE |
| `/logos` | camada transversal |
| `/buscar`, `/search` | ⌘K Conexões (transversal) |
| `/profile`, `/diario`, `/favorites`, `/notes`, `/community`, `/pricing`, `/upgrade`, `/checkout`, `/transactions`, `/partners`, `/transparencia`, `/about`, `/terms`, `/privacy` | MINHA JORNADA |
| `/admin/*`, `/telemetry`, `/security`, `/design-system`, `/guia-modulos`, `/a11y-audit`, `/visual-audit`, `/cache-manager`, `/offline`, `/diagnostico`, `/bible-recovery`, `/catechism-health`, `/seo-verify` | Console técnico |

**Diferença crítica vs. v1:** o v1 tinha "Scriptorium" como fonte-primeiro. O v2 tem **Estudar por Tema** como porta principal e "Por Fonte" como porta secundária. É a diferença entre biblioteca (v1) e formação (v2).

---

### Fase 3 — Jornadas do Usuário

#### 3.1 Primeiro acesso (Peregrino)
```
Abre app
   ↓
HOJE (sem login) — Ritual do Dia genérico + tempo litúrgico
   ↓
Toca "Iniciar Escuta" → 1 salmo curto guiado
   ↓
Ao final: "Quer salvar seu caminho?" → login opcional
   ↓
Sugestão: Jornada de 7 dias "Introdução à Fé"
```
Zero decisão obrigatória para experimentar.

#### 3.2 Primeiro estudo (Estudioso) — experiência-assinatura
```
Abre app → ESTUDAR
   ↓
Escolhe "Por Tema" → digita "perdão"
   ↓
Cathedra monta automaticamente:
   • Bíblia:   Mt 18, 21-35 · Lc 15
   • CIC:      §§ 1422-1470
   • Padres:   Agostinho, Sermão 83
   • Concílio: Trento, ses. XIV
   • Magist.:  Misericordiae Vultus §§ 21-22
   • Cânon:    cân. 959-964
   • Aplicação: reflexão + convite ao Sacramento
   ↓
Barra lateral: [Salvar estudo] [Anotar no diário] [Compartilhar]
   ↓
"Continuar amanhã?" → vira Jornada personalizada
```

#### 3.3 Primeira oração (Discípulo)
```
Notificação 6h → HOJE
   ↓
Toca "Laudes" → tela entra em Modo Prece (bottom-nav some, cromia escurece)
   ↓
Reza (áudio opcional)
   ↓
Ao terminar: botão único "Anotar" → 1 frase no diário
   ↓
Volta ao HOJE com Ritual marcado ✓
```

#### 3.4 Pesquisa (⌘K)
```
Qualquer tela → ⌘K
   ↓
Digita "videira verdadeira"
   ↓
Resultados agrupados: Bíblia(3) · CIC(2) · Padres(4) · Magist.(1) · Orações(1)
   ↓
Toca resultado → abre no leitor com Nexus já ativo mostrando as outras fontes
```

#### 3.5 Favoritos e continuidade
```
Qualquer conteúdo tem 🤍 (favoritar) e ↩ (retomar depois)
   ↓
HOJE sempre mostra "Retomar: [último item]"
   ↓
MINHA JORNADA agrupa favoritos por fonte e por tema
```

---

### Fase 4 — Design System (princípios, valores exatos na fase seguinte)

- **Grid:** base 4pt, container fluido, breakpoints 360 · 768 · 1024 · 1440.
- **Tipografia:** um par — serifada de leitura litúrgica para corpos longos, sem-serifa geométrica para UI. Nunca Inter/Poppins. Escala modular 1.25.
- **Cores:** primária `#0B1F3A`, secundária `#C8A96A` (memória do projeto). Cada experiência com *acento sutil* (temperatura, não paleta): Hoje = quente, Estudar = neutra, Rezar = fria/escura, Formar-se = âmbar, Minha Jornada = neutra.
- **Cor litúrgica:** *ambient light* (linha superior 2px), nunca fundo dominante.
- **Espaçamento:** xs/sm/md/lg/xl/2xl. Nada arbitrário.
- **Cartões:** dois tipos apenas — **Leitura** (foco no texto, sem sombra) e **Ação** (foco em toque, sombra sutil).
- **Ícones:** Lucide solid, um peso, tamanho por contexto.
- **Navegação:** bottom-nav 5 (mobile) / sidebar 5 (desktop) / header universal com ⌘K + Nexus toggle + Perfil.
- **Modo Prece:** contraste reduzido, bottom-nav oculto, toques secundários desabilitados, sem notificações.
- **Acessibilidade:** contraste AAA em corpo litúrgico; foco visível sempre; teclado obrigatório.
- **Tokens:** todos semânticos (`--surface-reading`, `--accent-prayer`, `--liturgical-color`) — nunca cor crua em componente.

---

### Fase 5 — Wireframes (ordem de maior ROI)

1. **HOJE** — ritual + continuidade + ofício + sugestão.
2. **ESTUDAR por Tema** — busca de tema + tela de estudo composto (experiência-assinatura).
3. **Leitor universal** — bíblia/CIC/magistério/padres com Nexus lateral, igual em toda fonte.
4. **⌘K Conexões** — overlay global.
5. **REZAR — Ofício** — laudes/missa/vésperas/completas num só fluxo.
6. **FORMAR-SE — Jornada em curso** — dia N/M, próximo passo.
7. **MINHA JORNADA** — diário + favoritos + histórico.
8. **Modo Prece** — estado da UI, não tela nova.

---

## Parte III — v1 × v2

| Dimensão | v1 (atual) | v2 (esta revisão) |
|---|---|---|
| Organização de topo | 5 ambientes (Átrio/Scriptorium/Oratório/Caminho/Cela) | 5 experiências (Hoje/Estudar/Rezar/Formar-se/Minha Jornada) — verbos |
| Porta do estudo | Por fonte | Por tema primeiro, por fonte segundo |
| Enciclopédia/Glossário/A-Z/Dogmas | 4 abas | 1: Verbete |
| Jornadas/Itinerários/Trilhas | 3 nomes | 1: Formar-se |
| Missal/Breviário/Liturgia/Calendário | 4 abas | 1: Ofício |
| Santos/Papas/Aparições | Oratório | Estudar → Testemunhos |
| Logos IA | cômodo | camada transversal |
| Nexus + Busca | 2 sistemas | 1: ⌘K Conexões |
| Diário | cômodo | destino transversal + Minha Jornada |
| Rotas admin/audit/health | misturadas ao topo | Console Técnico fora do mapa |
| Padres e Concílios | ausentes | primeira classe em Estudar |
| Modo Prece | mencionado | estado global especificado |
| Estudo composto (tema atravessa fontes) | ausente | experiência-assinatura |

---

## Parte IV — Próximos passos

1. Aprovar/ajustar este v2.
2. ADR-011 "Cathedra 2.0 — 5 experiências" registrando a decisão.
3. Mapa rota-a-rota (`ARC-MAP-v2.md`) com redirects de cada rota atual → novo endereço.
4. Design System v2 com valores concretos (tokens, escala, tipografia escolhida).
5. Wireframes na ordem acima.
6. Só então: implementação incremental — sprint 1 = HOJE + ⌘K, sprint 2 = Estudar por Tema, etc.

Nada foi codificado. Nada foi removido. Tudo foi renomeado pelo verbo do usuário.
