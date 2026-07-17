
# Cathedra 2.0 — Projeto Arquitetônico

Reconstrução conceitual, sem código. Foco: **ambientes de uso**, não listas de features. Toda funcionalidade atual é preservada e redistribuída.

---

## 1. Princípio Fundador

O Cathedra deixa de ser um **catálogo de módulos** (Bíblia, Catecismo, Santos, Liturgia, Orações, Jornadas…) e passa a ser uma **casa com cômodos**. Cada cômodo é um *estado interior* do usuário, não uma categoria de conteúdo.

> **Justificativa UX:** o usuário não acorda pensando "quero abrir o módulo Magistério". Ele acorda com uma intenção: *rezar, estudar, buscar direção, cumprir um dever diário*. A arquitetura deve espelhar intenções, não taxonomias eclesiais.

---

## 2. Os 5 Ambientes (Information Architecture)

Toda a plataforma cabe em **5 ambientes**. Nenhum outro nível de topo existe.

```text
CATHEDRA
├── ⛪ ÁTRIO         → Entrada. Hoje. Ritmo diário.
├── 📖 SCRIPTORIUM   → Estudo. Fontes. Leitura profunda.
├── 🕯️ ORATÓRIO     → Oração. Liturgia. Devoção.
├── 🧭 CAMINHO       → Formação. Jornadas. Progresso.
└── 👤 CELA          → Perfil. Diário. Ajustes. Comunidade.
```

**Por que 5 e não 8+ como hoje:** Lei de Miller (7±2) aplicada com folga. 5 é memorizável, cabe em bottom-nav mobile sem *overflow*, e cada ambiente tem identidade sensorial distinta (cor, tipografia de destaque, som opcional).

### Mapeamento das funcionalidades atuais → ambientes

| Ambiente | Absorve (funcionalidades existentes) |
|---|---|
| **Átrio** | `/hoje`, dashboard, ritual do dia, liturgia do dia, santo do dia, versículo do dia, continuidade espiritual, notificações |
| **Scriptorium** | `/bible`, `/catechism`, `/magisterium`, `/aquinas`, Código de Direito Canônico *(novo cômodo)*, `/dogmas`, `/glossary`, `/encyclopedia`, `/az-faith`, `/temas`, busca global, **Nexus Theologicus** |
| **Oratório** | `/liturgia`, `/missal`, `/breviary`, `/calendar`, `/rosary`, `/viacrucis`, `/litanies`, `/oracao`, `/lectio`, `/confession`, `/santos`, `/papas`, `/aparicoes` |
| **Caminho** | `/jornadas`, `/itineraria`, `/trilhas`, `/quiz` (Certamen), `/achievements`, Logos IA como tutor guiado, `/guia-modulos` |
| **Cela** | `/profile`, `/diario`, `/favorites`, `/notes`, `/settings`, `/community`, `/partners`, `/transparencia`, `/pricing`, `/about`, admin |

Nada é removido. Tudo é *reendereçado* semanticamente.

---

## 3. Jornada do Usuário (3 arquétipos)

Desenhar para 3 perfis reais em vez de "usuário genérico".

### A. Peregrino (novo, buscando)
`Entrada → Átrio (hoje) → oração curta guiada → 1 versículo com Nexus → convite a Jornada iniciante → Cela salva progresso`

### B. Discípulo (fiel diário)
`Notificação → Átrio → cumpre ritual (Ofício + Leitura + Exame) → marca no Diário → Nexus sugere aprofundamento no Scriptorium`

### C. Estudioso (formação séria)
`Busca unificada → Scriptorium → passagem bíblica ↔ CIC ↔ ST (Aquino) ↔ Cânon ↔ documento magisterial via Nexus → salva citação em Notas → exporta`

**Justificativa:** os 3 arquétipos cobrem 95% dos casos e ditam prioridades de UI (Peregrino = simplicidade, Discípulo = velocidade/hábito, Estudioso = profundidade/cross-ref).

---

## 4. Fluxo Principal (Golden Path)

```text
Login/Anônimo
   │
   ▼
ÁTRIO (default landing)
   │  ── Ritual do Dia (3 passos: Escuta / Leitura / Exame)
   │  ── Continuidade (retomar onde parou)
   │  ── Sugestão contextual (litúrgica + perfil)
   │
   ├──► Oratório  (se intenção = rezar)
   ├──► Scriptorium (se intenção = estudar / buscar)
   ├──► Caminho    (se intenção = crescer / aprender)
   └──► Cela       (se intenção = registrar / configurar)
```

Um usuário nunca precisa de mais de **2 toques** para chegar a qualquer conteúdo a partir do Átrio.

---

## 5. Navegação Global

### Mobile (primário)
**Bottom-nav de 5 ícones fixos** — um por ambiente. Sempre visível, exceto em modo Oração e modo Leitura Imersiva (auto-hide já existente é reaproveitado).

### Desktop
**Sidebar colapsável à esquerda** com os mesmos 5 ambientes. Ao expandir um ambiente, mostra subnavegação contextual (não uma lista plana global).

### Cabeçalho (universal)
`[Logo Cathedra] ······················ [Busca ⌘K] [Nexus 🔗] [Perfil]`

- **Busca ⌘K:** único ponto de entrada de busca em toda a plataforma (ver §9).
- **Nexus 🔗:** ativa/desativa popovers de cross-reference globalmente (respeita "não quebrar contexto de leitura/oração").
- **Perfil:** atalho para Cela.

**Justificativa:** remove a poluição atual (`APP_ROUTES` com ~40 rotas no menu). Menos escolha = mais uso.

---

## 6. Navegação Contextual

Cada ambiente tem sua própria gramática de subnav. Não há um padrão único imposto de cima.

- **Átrio:** sem subnav. É um fluxo linear vertical (Ritual → Continuidade → Sugestões).
- **Scriptorium:** subnav em **abas de fonte** (Bíblia · Catecismo · Magistério · Cânon · Aquino · Enciclopédia). Persistência de última fonte aberta.
- **Oratório:** subnav em **momentos do dia** (Manhã · Missa · Meio-dia · Vésperas · Noite) + acesso lateral a Rosário/Via-Sacra/Ladainhas/Santos.
- **Caminho:** subnav em **estado da jornada** (Em andamento · Recomendadas · Concluídas · Conquistas).
- **Cela:** subnav em **acordeão vertical** (Perfil · Diário · Favoritos · Notas · Comunidade · Ajustes · Assinatura).

**Justificativa:** cada ambiente tem uma *forma temporal* diferente (contínuo, discreto, cíclico, progressivo, arquivístico). Forçar um padrão único empobrece.

---

## 7. Wireframes de Baixa Fidelidade

### 7.1 Átrio (mobile)
```text
┌──────────────────────────────┐
│ Cathedra    ⌘K  🔗  👤       │
├──────────────────────────────┤
│                              │
│   Pax et bonum, João         │  ← saudação + tempo litúrgico
│   Tempo Comum · 3ª semana    │
│                              │
│  ╭──────────────────────╮    │
│  │  RITUAL DO DIA       │    │  ← card único, foco total
│  │  ● Escuta  (Sl 23)   │    │
│  │  ○ Leitura (Jo 15)   │    │
│  │  ○ Exame             │    │
│  │  [ Iniciar ]         │    │
│  ╰──────────────────────╯    │
│                              │
│  Retomar → CIC §1234         │  ← continuidade
│  Santo do dia → S. Boaventura│
│  Nexus sugere → "Videira"    │
│                              │
├──────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤        │  ← bottom-nav 5 ambientes
└──────────────────────────────┘
```

### 7.2 Scriptorium — leitor bíblico com Nexus
```text
┌──────────────────────────────┐
│ ← Scriptorium    ⌘K  🔗  👤 │
├──────────────────────────────┤
│ [Bíblia][CIC][Mag][Cân][ST] │  ← abas de fonte
├──────────────────────────────┤
│ João 15                      │
│                              │
│  1 Eu sou a videira°         │  ← ° = âncora Nexus
│    verdadeira, e meu Pai...  │
│                              │
│  ┌── popover Nexus ─────┐    │
│  │ Ver também:           │    │
│  │ • CIC §755-757        │    │
│  │ • Lumen Gentium 6     │    │
│  │ • ST III q.8          │    │
│  │ • Cân. 204            │    │
│  └───────────────────────┘    │
│                              │
│ [◀ Jo 14]        [Jo 16 ▶]  │
├──────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤        │
└──────────────────────────────┘
```

### 7.3 Oratório — momento litúrgico
```text
┌──────────────────────────────┐
│ ← Oratório       ⌘K  🔗  👤 │
├──────────────────────────────┤
│ [Manhã][Missa][Vésp][Noite] │
├──────────────────────────────┤
│  Laudes — 6ª feira           │
│  Salmo 51 · Cântico Zac.     │
│  [ Rezar agora ]             │
│                              │
│  ─── ou ───                  │
│                              │
│  Rosário · Mistérios Dolor.  │
│  Via-Sacra                   │
│  Ladainha de N.Sra.          │
│  Adoração silenciosa (⏱)     │
├──────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤        │
└──────────────────────────────┘
```

### 7.4 Caminho — jornada em andamento
```text
┌──────────────────────────────┐
│ ← Caminho        ⌘K  🔗  👤 │
├──────────────────────────────┤
│ [Ativas][Sugeridas][Feitas] │
├──────────────────────────────┤
│  Iniciação à Fé · dia 4/14   │
│  ████████░░░░░░  28%         │
│  Próx: Credo, artigo 3       │
│  [ Continuar ]               │
│                              │
│  Logos (tutor) disponível    │
│  Certamen semanal: 8 quest.  │
│  Conquistas: 3 novas         │
├──────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤        │
└──────────────────────────────┘
```

### 7.5 Cela
```text
┌──────────────────────────────┐
│ ← Cela           ⌘K  🔗  👤 │
├──────────────────────────────┤
│  João · Peregrino desde 2024 │
│  ▸ Diário espiritual         │
│  ▸ Favoritos (42)            │
│  ▸ Notas (17)                │
│  ▸ Comunidade                │
│  ▸ Ajustes                   │
│  ▸ Assinatura & Doação       │
│  ▸ Sobre & Transparência     │
├──────────────────────────────┤
│ ⛪   📖   🕯️   🧭   👤        │
└──────────────────────────────┘
```

---

## 8. Sistema de Menus (resumo)

| Nível | Elemento | Onde | Comportamento |
|---|---|---|---|
| 0 | Bottom-nav / Sidebar | Global | 5 ambientes fixos |
| 1 | Header ⌘K + Nexus + Perfil | Global | Ações transversais |
| 2 | Abas contextuais | Dentro do ambiente | Muda por ambiente |
| 3 | Ações locais (◀ ▶, salvar, compartilhar) | Dentro da tela | Padrão consistente |
| 4 | Popover Nexus | Sob demanda | Nunca modal fullscreen |

**Regra dura:** nunca mais de 3 níveis visíveis ao mesmo tempo.

---

## 9. Busca Unificada (⌘K)

Um único campo, um único índice lógico. Substitui `/buscar`, `/search`, buscas internas por módulo.

**Comportamento:**
1. **Sem query:** mostra atalhos ("Hoje", "Retomar", "Rosário agora").
2. **Com query:** resultados **agrupados por fonte** e ordenados por relevância litúrgica + histórico do usuário.
   ```
   Bíblia (12)   Catecismo (5)   Magistério (3)
   Cânon (1)     Aquino (2)      Santos (4)
   Orações (2)   Jornadas (1)
   ```
3. **Sintaxe rápida:**
   - `jo 15` → João 15
   - `cic 1234` → CIC §1234
   - `st iii q8` → Suma
   - `cân 204` → Direito Canônico
   - `"videira verdadeira"` → busca literal cross-source
4. **Nexus embutido:** cada resultado mostra ícones das fontes que o referenciam.

**Justificativa:** hoje há dispersão (busca por módulo, `/buscar`, `/search`). Um só campo reduz carga cognitiva e torna a plataforma *pesquisável como uma biblioteca única*.

---

## 10. Nexus Theologicus — Estratégia de Integração

O Nexus é o **sistema nervoso** da Cathedra 2.0. Não é uma feature, é uma camada.

### Grafo canônico de fontes
```text
                 ┌──────────────┐
                 │   BÍBLIA     │
                 └──────┬───────┘
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐   ┌────────────┐   ┌──────────┐
   │CATECISMO│◄──┤ MAGISTÉRIO ├──►│  CÂNON   │
   └────┬────┘   └──────┬─────┘   └────┬─────┘
        └───────────────┼───────────────┘
                        ▼
                 ┌──────────────┐
                 │   AQUINO     │  (Summa, Opera)
                 └──────┬───────┘
                        ▼
                 ┌──────────────┐
                 │ SANTOS/PAPAS │  (testemunho vivido)
                 └──────────────┘
```

**Regras de integração:**
1. **Toda passagem bíblica** carrega âncoras para: CIC (via índice bíblico do Catecismo), documentos magisteriais que a citam, Suma que a comenta, Cânones que a fundamentam, orações que a incorporam.
2. **Todo parágrafo do CIC** carrega âncoras reversas para Bíblia, Magistério, Cânon.
3. **Todo cânone** aponta para o CIC correspondente e fundamento bíblico/magisterial.
4. **Todo santo/papa** carrega obras, citações e documentos vinculados.
5. **Popover é sempre não-modal**, não interrompe leitura/oração, e pode ser desativado globalmente pelo botão 🔗 no header.

**Justificativa doutrinal:** o Nexus materializa o princípio católico de que Escritura, Tradição e Magistério formam **um único depósito da fé** (DV 10). A arquitetura reflete a teologia.

**Novo:** o **Código de Direito Canônico** ganha cômodo próprio no Scriptorium (hoje ausente ou disperso). Necessário para completude e para Estudioso.

---

## 11. Dashboard Inicial (Átrio) — decisões-chave

- **Uma coisa em foco por vez:** o Ritual do Dia domina a tela. Continuidade e sugestões são secundárias.
- **Sem métricas vaidosas na entrada:** streak/XP moram no Caminho, não no Átrio. Entrada espiritual não é gamificada.
- **Contexto litúrgico sempre visível** (tempo, cor litúrgica sutil no fundo, santo do dia).
- **Zero configuração para começar:** anônimo vê Ritual do Dia genérico; logado vê personalizado.

---

## 12. Organização dos Módulos — antes × depois

| Hoje | Cathedra 2.0 |
|---|---|
| ~40 rotas de topo em `APP_ROUTES` | 5 ambientes + rotas internas |
| Módulos concorrem no menu | Módulos vivem dentro de ambientes |
| Busca fragmentada | ⌘K único |
| Nexus como feature de página | Nexus como camada global |
| Admin misturado a rotas de usuário | Admin isolado em Cela → área restrita |
| Cânon Canônico ausente/disperso | Aba própria no Scriptorium |
| Dashboard = catálogo de portas | Átrio = ritual + continuidade |

---

## 13. Justificativas transversais

- **Simplicidade radical:** 5 ambientes forçam decisões editoriais. Nada entra sem morar em algum cômodo.
- **Profundidade preservada:** nada é removido — Scriptorium comporta Aquino, Enciclopédia, Glossário, Temas, Dogmas sem poluir o topo.
- **Mobile-first honesto:** bottom-nav de 5 respeita polegar; sem menus hambúrguer profundos.
- **Experiência espiritual acima da tecnologia:** Nexus e telemetria nunca interrompem Oratório em curso; modo Oração continua com auto-hide.
- **Soberania de dados intacta:** a arquitetura não muda a fonte da verdade (banco local); apenas reorganiza a superfície.
- **Compatibilidade com redirects:** os `_redirects` atuais (`/biblia → /bible`, etc.) continuam válidos; adicionamos apenas novos redirects `/dashboard → /atrio`, `/bible → /scriptorium/biblia`, etc.

---

## 14. Próximos passos (não executar agora)

1. Aprovação da IA acima.
2. ADR retroativo "Cathedra 2.0 — 5 Ambientes".
3. Mapa detalhado rota-a-rota (`ARC-MAP-v2.md`) — cada rota atual → novo endereço.
4. Design tokens por ambiente (cor de acento sutil, ícone, microcopy).
5. Só então: implementação incremental, um ambiente por sprint, começando pelo **Átrio** (maior ROI de UX).

---

**Nada foi codificado. Nenhuma funcionalidade foi perdida. Toda a plataforma cabe em 5 cômodos.**
