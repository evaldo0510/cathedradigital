
# Ciclo Editorial Fundacional — Fase 1

Executar 27 entregas editoriais (7 Sacramentos + 10 Santos + 10 Verbetes) sem inflar o diff nem sacrificar profundidade. Cada onda entrega conteúdo pronto para publicação, com Nexus tecido no ato.

## Princípio

Uma onda = 1 lote pequeno + 1 gate de aprovação. Nenhuma refatoração de código durante o ciclo — só dados (`glossary`, `saints`, `nexus_relations`, orações v2 quando faltar). Componentes já homologados (Harmony, PrayerPortal, SaintDetail, GlossaryTermPage) consomem sem alteração.

## Eixos e ondas

### Eixo 1 — Os 7 Sacramentos (3 ondas)

Cada sacramento entrega, em uma única migration de dados:

- Verbete `glossary` (deep_interpretation, etimologia, contexto histórico, FAQ×3-4, bibliografia×3-5, meditação Logos, 5-7 versículos, 4-5 §§CIC).
- 6-10 arestas `nexus_relations` (≥3 bíblicas, ≥2 CIC, ≥1 patrística, verbetes irmãos).
- Vínculo declarativo com orações v2 já existentes (Rosário, Comunhão Espiritual, etc.) e santos correlatos quando aplicável.

Ondas:

- **S1.1** — Batismo · Crisma (Iniciação Δ Eucaristia já publicada)
- **S1.2** — Penitência (Confissão já existe → enriquecer) · Unção dos Enfermos
- **S1.3** — Ordem · Matrimônio + verbete-índice `sacramentos-de-servico`

Gate: revisar S1.1 antes de S1.2.

### Eixo 2 — 10 Santos Fundamentais (3 ondas)

Template homologado em São João Batista. Cada santo:

- Ficha `saints` completa (bio curta/longa, contexto, virtudes, patronatos, iconografia, milagres, práticas espirituais).
- 6-8 arestas `nexus_relations` (Bíblia, CIC, Magistério, verbetes, orações).

Ondas:

- **S2.1 — Colunas apostólicas**: São Pedro · São Paulo · Nossa Senhora · São José
- **S2.2 — Doutores**: Santo Agostinho · São Tomás de Aquino · Santa Teresa d'Ávila
- **S2.3 — Santidade contemporânea + carisma**: Santa Teresinha · São Francisco de Assis (S. João Batista ✔ já feito)

Gate: revisar S2.1 antes de S2.2.

### Eixo 3 — 10 Verbetes Fundamentais (2 ondas)

Template homologado em Sacramento. Divisão por afinidade:

- **S3.1 — Economia da Salvação**: Graça · Revelação · Tradição · Magistério · Salvação
- **S3.2 — Vida Teologal e Santidade**: Igreja · Santidade · Misericórdia · Esperança · Caridade

Reaproveita verbetes já publicados (Esperança Cristã → refinar em vez de duplicar).

## Ordem de execução proposta

```
S1.1 → gate → S1.2 → gate → S1.3
      ↓
     S2.1 → gate → S2.2 → gate → S2.3
      ↓
     S3.1 → gate → S3.2
      ↓
   Ativar Library Curator Expert
```

Alternativa (paralela): S1.1 + S3.1 na mesma onda quando os verbetes se reforçam (Sacramentos ↔ Graça).

## Métricas de gate

Cada onda entrega relatório curto:

- Verbetes novos com `editorial_completeness='complete'` (contagem).
- Arestas `nexus_relations` inseridas (contagem).
- Santos com `status='complete'` (contagem).
- Zero regressão: rota renderiza (Playwright smoke).

## Fora de escopo (nesta Fase 1)

- Coleções, séries, prateleiras, recomendações → Library Curator, após conclusão.
- Novas orações que não sejam pré-requisito direto de um sacramento (ex.: Rito do Batismo simplificado).
- Refactor de UI. Se algo faltar visualmente, registrar como débito e seguir.

## Decisão pedida

1. Aprovar sequência linear (S1 → S2 → S3) **ou** intercalada (Sacramento + Verbete-irmão na mesma onda).
2. Começar por **S1.1 (Batismo + Crisma)** agora?
