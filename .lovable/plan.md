# Fase 2 — Santos como Biblioteca Viva

Escopo grande. Vou quebrar em 4 ondas sequenciais, cada uma certificável isoladamente (COS). Peço aprovação onda a onda para não misturar frentes.

---

## Onda 1 — Fundação de dados + acessibilidade

**Banco (migração única):**
- `saint_works` (id, saint_id, title, description, type, language, public_url, source, is_public_domain, order_index, created_at)
- `saint_quotes` (id, saint_id, text, source, work, year, order_index)
- `saint_timeline_events` (id, saint_id, year, year_label, title, description, kind, order_index)
- `saint_virtues` (id, saint_id, virtue, order_index) — vocabulário controlado inicial
- `saint_prayers_links` (id, saint_id, prayer_id, relation) — relação com `prayers` v2 (do santo / ao santo / novena / ladainha)
- `saint_sources` (id, saint_id, label, url, kind)
- Colunas novas em `saints`: `full_biography` (text), `historical_context` (text), `conversion_story` (text), `mission` (text), `legacy` (text)
- GRANTs + RLS (leitura pública; escrita só editor/admin via `has_role`)

**Acessibilidade (fecha a dívida do turno anterior):**
- `aria-expanded` / `aria-controls` nos toggles do hero e tabs
- Ordem de foco revisada em `/santos` e `/santos/:slug`
- Rodar axe local + corrigir apontamentos
- Skip-link "pular para conteúdo" no ReaderShell da ficha
- Rótulos ARIA em prev/next dia, tabs de modo, botão calendário

Sem UI nova de conteúdo ainda — só schema + a11y.

---

## Onda 2 — Componentes da ficha (leitura)

Criar em `src/modules/santos/components/`:
- `SaintLife.tsx` — seção expansível (história/contexto/conversão/missão/legado)
- `SaintTimeline.tsx` — linha do tempo vertical editorial
- `SaintWorks.tsx` — aba "Escritos" com lazy + paginação; botão "Ler obra" (externo por ora)
- `SaintQuotes.tsx` — cards de frases
- `SaintVirtues.tsx` — grade de virtudes com chips
- `SaintPrayers.tsx` — aba "Orações" (consome `prayers` v2 via `saint_prayers_links`)
- `SaintSources.tsx` — bibliografia
- `SaintRelated.tsx` — cards horizontais (via `nexus_relations`)
- `SaintAIReflection.tsx` — bloco "Reflexão Espiritual" oculto por flag `ai_reflection_enabled`

Reorganização da `SaintDetailPage`:
- Tabs: Vida · Escritos · Frases · Orações · Fontes
- Nexus/Related no rodapé
- Tudo dentro do `ReaderShell` existente (sem chrome novo — Regra 1 do Guardian)

SEO por rota: JSON-LD `Person` (schema.org não tem `Saint`; uso `Person` + `additionalType` ex.: `http://dbpedia.org/ontology/Saint`), meta title/description, canonical, OG.

---

## Onda 3 — População inicial + admin

- Painel `/admin/santos/:id/editorial` para editar novos campos (obras, frases, timeline, virtudes, fontes, links de oração)
- Seed curado (não IA) para 20 santos-âncora já enriquecidos (Agostinho, Tomás, Bento, Francisco, Teresa d'Ávila, etc.) com obras de domínio público (Vatican.va, Documenta Catholica Omnia)
- `saint_sources` preenchido para esses 20
- Nexus: garantir ≥3 relações por santo âncora

---

## Onda 4 — Leitor interno de obras (o diferencial que você levantou)

Só depois das ondas 1–3 certificadas.

- `saint_work_texts` (work_id, chapter, section, content, embedding) para obras em domínio público
- Rota `/santos/:slug/obras/:workSlug` usando `ReaderShell`
- Busca textual (Postgres FTS pt) — semântica (embeddings) fica para sprint seguinte
- Nexus automático de trechos → Bíblia/CIC/santos via `AutoNexusList`
- Piloto: **Confissões** de Agostinho + **Regra** de Bento

---

## Detalhes técnicos

- Segue COS v1.3, Reader Architecture Rule, Design System Guardian (EditorialCard/EditorialHero/tokens).
- Zero componente novo se `EditorialCard` variante resolve.
- `AutoNexusList` para relações; `resolveNexusHref` para links internos.
- Performance: `React.lazy` nas abas Escritos/Orações; paginação server-side em `saint_works` (10/página).
- Todas as tabelas com `GRANT SELECT ON ... TO anon` (leitura pública) + `GRANT ALL TO authenticated/service_role` conforme papel.

---

## Aprovação

Confirma que começo pela **Onda 1** (schema + a11y, sem UI de conteúdo nova)? Se preferir invertida (a11y primeiro isolada, schema depois), também topo.
