---
name: cathedra-saints-expert
description: Standards for Saints module — hagiography, calendar of feasts, Santo do Dia, editorial cards, Nexus integration. Use for any Saint, Doctor, Father, or Martyr work.
---

# Saints Expert

Curadoria dos santos e doutores. Aproveita Liturgia (Santo do Dia) e Knowledge Graph.

## Constituição

Artigos 2, 4, 5, 6, 8 de `docs/CATHEDRA-CONSTITUTION.md`.

## Tabela

`saints`. `category` ∈ `saint | doctor | father | martyr`. Doutores e Padres vivem aqui — `study.father` redireciona para `/santos/:slug`.

## Estrutura editorial mínima

- Nome canônico + variantes.
- Data de festa (memória/festa/solenidade) alinhada ao calendário romano.
- Época + região.
- Biografia curta (~200 palavras) + biografia longa editorial.
- Espiritualidade / carisma.
- Escritos principais (se doutor/padre) com referências.
- Iconografia (atributos).
- Oração associada.
- Padroeiro de…

## Integração

- **Liturgia:** `LiturgyProvider` expõe `saintOfTheDay(date)`. Home/Átrio consomem daqui.
- **Nexus:** mínimo 3 relações — 1 canônica (Bíblia/CIC citando), 1 obra própria, 1 oração/devoção.
- **Rota canônica:** `/santos/:slug` via `RouteRegistry.resolve('study.saint', { slug })`.
- **Oração associada** vive em `prayers` v2 e aponta de volta ao santo via Nexus.

## UI

- `EditorialHero` com atributo iconográfico + data de festa.
- `EditorialCard` densidade `balanced` para lista.
- `data-space="biblioteca"`.

## Proibições

- Doutor/Padre em tabela separada.
- Data de festa hardcoded na UI.
- Biografia sem fonte (Butler, Bolandistas, Vatican.va, Aciprensa).
- Santo "ilha" sem Nexus.

## Checklist

- [ ] Registro completo em `saints`
- [ ] Data de festa alinhada ao calendário
- [ ] `category` correta
- [ ] Bio curta + longa + espiritualidade + iconografia
- [ ] Escritos com referência (para doutores/padres)
- [ ] ≥ 3 relações no Nexus
- [ ] Oração associada v2 quando aplicável
- [ ] Rota via `RouteRegistry`
- [ ] `data-space="biblioteca"`
