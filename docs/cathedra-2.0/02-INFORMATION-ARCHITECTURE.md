# Cathedra 2.0 — Arquitetura da Informação (Sitemap por Experiências)

Sitemap navegacional (não é mapa de rotas técnicas). Organizado por **verbos do usuário**, não por módulos.
Toda funcionalidade do Cathedra 1.0 tem endereço aqui.

---

## Regra de topo

**5 experiências** (cômodos) + **camadas transversais** + **console técnico isolado**.
Nenhum sexto cômodo sem ADR próprio.

```text
CATHEDRA
│
├── ⛪ ÁTRIO ("hoje")         — entrada e retomada
├── 📖 ESTUDAR                — entender
├── 🕯️ REZAR                  — rezar
├── 🧭 FORMAR-SE              — crescer com método
├── 🔎 PESQUISAR (⌘K)         — encontrar em tudo   [camada + destino]
└── 👤 MINHA JORNADA          — meu caminho
```

Observação: **Pesquisar** aparece como cômodo *e* como camada transversal (⌘K em qualquer tela). O cômodo existe para dar endereço quando o usuário chega direto por URL/notificação.

---

## 1. ÁTRIO

Endereço: `/` (também absorve `/hoje`, `/dashboard`).

```text
ÁTRIO
├── Ritual do Dia            (Escuta · Leitura · Exame)
├── Ofício de hoje           (link p/ REZAR)
├── Tempo litúrgico          (cor, santo, leituras)
├── Continuidade             (retomar últimas 3 sessões)
└── Sugestão contextual      (Nexus + perfil, opt-out global)
```

Sem sub-abas. Fluxo vertical único.

---

## 2. ESTUDAR

Endereço: `/estudar`.

```text
ESTUDAR
├── Por Tema                 (porta principal)
│   ├── Buscar tema
│   ├── Temas em destaque    (curados por tempo litúrgico)
│   └── Estudo composto      (tela-assinatura: Bíblia→CIC→Mag→Padres→Concílio→Aplicação)
│
├── Por Fonte
│   ├── Bíblia               (leitor universal + traduções)
│   ├── Catecismo            (CIC)
│   ├── Magistério
│   ├── Código Canônico
│   ├── Padres da Igreja     (novo)
│   ├── Concílios            (novo)
│   └── Suma Teológica / Aquino
│
├── Testemunhos
│   ├── Santos
│   ├── Papas
│   └── Aparições marianas
│
└── Verbete                  (unificação de Enciclopédia + A-Z + Glossário + Dogmas)
    ├── Busca alfabética
    └── Por categoria        (dogma · termo · verbete · glossário)
```

**Decisão-chave:** Por Tema **antes** de Por Fonte. Biblioteca é meio, não fim.

---

## 3. REZAR

Endereço: `/rezar`.

```text
REZAR
├── Ofício                   (fusão de Missal + Breviário + Liturgia + Calendário)
│   ├── Missa
│   ├── Laudes
│   ├── Meio-dia (Terça/Sexta/Nona)
│   ├── Vésperas
│   ├── Completas
│   └── Calendário litúrgico  (contexto, não porta principal)
│
├── Devoções
│   ├── Rosário
│   ├── Via-Sacra
│   ├── Ladainhas
│   └── Orações tradicionais
│
├── Lectio Divina            (leitor Bíblia + modo lectio)
├── Exame de consciência
├── Confissão                (guia, não sacramento)
└── Adoração silenciosa      (timer) — [backlog pós-MVP]
```

Toda tela desta seção pode entrar em **Modo Prece** (camada transversal).

---

## 4. FORMAR-SE

Endereço: `/formar-se`.

```text
FORMAR-SE
├── Em andamento             (jornadas ativas do usuário)
├── Recomendadas             (curadas por perfil + tempo litúrgico)
├── Catálogo                 (todas as jornadas — fusão de Jornadas + Itinerários + Trilhas)
├── Concluídas               (com certificado/lembrança)
├── Certamen (quiz)          — [backlog pós-MVP]
└── Conquistas               (streak/XP moram aqui, nunca no Átrio)
```

---

## 5. PESQUISAR

Endereço: `/pesquisar` (mesma engine da ⌘K, superfície diferente).

```text
PESQUISAR
├── Campo único (⌘K)
├── Sintaxe rápida           (jo 15 · cic 1234 · st iii q8 · cân 204 · "literal")
├── Resultados agrupados por fonte
│   ├── Bíblia · Catecismo · Magistério · Cânon
│   ├── Padres · Concílios · Aquino
│   ├── Santos · Verbete · Orações
│   └── Jornadas
├── Filtros                  (tempo litúrgico, fonte, tipo, idioma)
└── Histórico de buscas      (privado, opt-out)
```

Todo resultado carrega ícones das outras fontes que o referenciam (Nexus embutido).

---

## 6. MINHA JORNADA

Endereço: `/minha-jornada`.

```text
MINHA JORNADA
├── Diário espiritual        (destino do "Anotar" transversal)
├── Favoritos
├── Notas
├── Histórico e continuidade
├── Perfil
├── Assinatura & Doação      (funil unificado: pricing→checkout→resultado)
├── Comunidade               — [fora do MVP 2.0]
└── Sobre & Transparência    (about, partners, transparência, termos, privacidade)
```

Ordem visual prioriza os 3 primeiros (Diário, Favoritos, Notas). Resto em acordeão.

---

## Camadas Transversais

Não são cômodos. Aparecem em qualquer tela.

| Camada | Gesto | Escopo |
|---|---|---|
| **⌘K Conexões** | tecla `⌘K` / botão no header | busca + Nexus unificados |
| **Nexus popover** | toque em âncora dentro de leitor | cross-reference sob demanda |
| **Logos IA** | botão flutuante contextual (canto inferior direito) | verbo muda: Explicar / Guiar / Aprofundar |
| **Anotar** | botão flutuante após leitura/oração | escreve no Diário |
| **Modo Prece** | ativado ao entrar em oração | esconde nav, escurece cromia, desativa popovers |
| **Continuidade** | header do Átrio + botão "retomar" universal | últimas 3 sessões |

---

## Console Técnico

Fora do mapa do usuário. Endereço: `/admin`.

```text
/admin
├── Dashboard
├── Bíblia                   (recovery · health · translations readiness · import jobs · dry-run)
├── Catecismo                (health · integrity · verify · explorer)
├── SEO                      (status · verify)
├── Auditoria                (dashboard · governance · design system audit)
├── Performance              (baselines · slow queries · benchmarks)
├── Segurança                (scan · findings · memory)
├── Client Errors            (analytics_events → err_x*)
├── Cache & Offline          (cache-manager · offline mode)
└── Diagnóstico              (diagnostics · a11y-audit · visual-audit · telemetry)
```

Absorve todas as ~15 rotas técnicas atuais. Nenhuma delas aparece na navegação do usuário.

---

## Mapa antigo → novo (redirects)

| Rota atual | Novo endereço |
|---|---|
| `/dashboard`, `/hoje` | `/` (Átrio) |
| `/bible`, `/biblia` | `/estudar/fonte/biblia` |
| `/catechism`, `/catecismo` | `/estudar/fonte/catecismo` |
| `/magisterium` | `/estudar/fonte/magisterio` |
| `/aquinas` | `/estudar/fonte/aquino` |
| `/dogmas`, `/glossary`, `/encyclopedia`, `/az-faith` | `/estudar/verbete?tipo=…` |
| `/temas` | `/estudar/tema` |
| `/santos`, `/papas`, `/aparicoes` | `/estudar/testemunhos/…` |
| `/liturgia`, `/missal`, `/breviary`, `/calendar`, `/mass`, `/daily-liturgy`, `/ordo-missae` | `/rezar/oficio/…` |
| `/rosary`, `/viacrucis`, `/litanies`, `/oracao`, `/prayers`, `/lectio`, `/confession` | `/rezar/…` |
| `/jornadas`, `/itineraria`, `/trilhas`, `/curso-pch`, `/pch`, `/quiz`, `/achievements` | `/formar-se/…` |
| `/logos` | camada transversal (não é rota) |
| `/buscar`, `/search` | `/pesquisar` (+ ⌘K global) |
| `/profile`, `/diario`, `/favorites`, `/notes`, `/settings`, `/pricing`, `/upgrade`, `/checkout`, `/transactions`, `/partners`, `/transparencia`, `/about`, `/terms`, `/privacy` | `/minha-jornada/…` |
| `/admin/*`, `/telemetry`, `/security`, `/design-system`, `/guia-modulos`, `/a11y-audit`, `/visual-audit`, `/cache-manager`, `/offline`, `/diagnostico`, `/bible-recovery`, `/catechism-health`, `/seo-verify` | `/admin/*` |

Detalhamento 1‑pra‑1 fica em `ARC-MAP-v2.md` (próxima entrega, junto com o Design System).

---

## Regras de governança

1. **Nenhum cômodo novo de topo** sem ADR próprio.
2. **Nenhuma tela nova** sem passar nas 3 perguntas (problema / integração / simplificação).
3. **Nenhum módulo isolado**: todo conteúdo é acessível via ⌘K e via Nexus.
4. **Nada removido** deste sitemap sem plano de redirect e comunicação ao usuário.
