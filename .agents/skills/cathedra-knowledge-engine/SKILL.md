---
name: cathedra-knowledge-engine
description: Especialista no Nexus Theologicus — motor de interconexões do Cathedra. Use ao criar/editar conteúdo (verbetes, orações, santos, jornadas, capítulos bíblicos, catecismo) para garantir cross-references, popovers e integração automática entre módulos.
---

# Knowledge Engine (Nexus)

O Nexus é o tecido conectivo do Cathedra: nenhum conteúdo existe isolado. Sempre pergunta: "Com o que mais isto conversa?"

## Módulos integrados

- **Bíblia** (`bible_verses`, `bible_chapters`, `bible_books`)
- **Catecismo** (`catechism_official`)
- **Glossário** (`glossary`, `nexus_relations`)
- **Santos** (`saints`)
- **Missal / Propers** (`missal_propers`)
- **Liturgia das Horas** (`liturgy_hours_offices`)
- **Orações v2** (`prayers`, `prayer_sections`, `prayer_blocks`, `prayer_mysteries`)
- **Jornadas** (`journeys`, `journey_steps`)

## Regras

### 1. Toda entidade nova gera conexões
Ao inserir/atualizar conteúdo, propor mínimo 3 relações em `nexus_relations`:
- 1 canônica (Bíblia ou Catecismo)
- 1 magisterial (Papa, Concílio, Doutor, ou Santo)
- 1 devocional/prática (Oração, Jornada, Mistério)

### 2. IDs, não strings
Relações usam FK reais (`source_kind`, `source_id`, `target_kind`, `target_id`).
Nunca ligar por título/slug texto — quebra ao renomear.

### 3. Links internos via `resolveNexusHref`
- Sempre SPA. Nunca `<a href>` sem passar pelo resolver.
- `NexusSourceBadge` aparece automaticamente para indicar origem (Bíblia, CIC, etc.).

### 4. Auto-Nexus onde faz sentido
- Verbetes do Glossário: `glossaryAutoNexus.ts` já injeta relações por termo.
- Orações v2: `prayerAutoNexus.ts` conecta a Bíblia/CIC citados nos blocos.
- Readers: usar `AutoNexusList` no rodapé de cada seção contemplativa.

### 5. Popovers, não navegação forçada
- Referência inline abre popover com preview (não retira do contexto de leitura).
- Navegação plena só via CTA explícito ("Ler completo").

### 6. Bibliografia curada
- Toda citação de Doutor, Padre, Papa: nome, obra, seção.
- Nunca "Santo Agostinho disse..." solto. Sempre `Confissões X, 27`.

## Tipos de relação (`nexus_relation_types`)

| Tipo | Uso |
|---|---|
| `cites` | Fonte cita destino textualmente |
| `explains` | Destino aprofunda a fonte |
| `contrasts` | Contraponto teológico |
| `fulfills` | AT → NT, tipologia |
| `commemorates` | Liturgia → Santo/Mistério |
| `see_also` | Referência lateral genérica |

Escolher o mais específico. `see_also` é fallback.

## Checklist ao criar conteúdo

- [ ] Mínimo 3 relações em `nexus_relations`
- [ ] Ao menos 1 canônica (Bíblia ou CIC)
- [ ] Todas por FK, não por título
- [ ] Popover renderiza preview sem erro
- [ ] `resolveNexusHref` cobre todos os `kind` usados
- [ ] `NexusSourceBadge` aparece para fontes primárias
- [ ] Bibliografia com obra + seção quando aplicável

## O que rejeitar

- Conteúdo "ilha" sem nenhuma relação.
- Links externos onde deveria ser SPA.
- Citação sem fonte precisa.
- Popover que carrega o conteúdo inteiro (deve ser preview).
- Relação circular sem sentido (A cita B, B cita A, ambos vazios).
