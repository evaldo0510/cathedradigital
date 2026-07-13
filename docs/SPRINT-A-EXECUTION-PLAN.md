# Sprint A (Governança) — Plano de Execução

**Status:** Fase A0 concluída · aguardando homologação para A1
**Escopo homologado:** CAT-001, CAT-002, CAT-003, CAT-004, CAT-008
**Baseline:** `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md`
**Gate futuro:** `docs/EDGE-FUNCTIONS-GOVERNANCE-CHECKLIST.md`

## Princípio de execução

47 Edge Functions ativas. Migrar todas em uma única mudança é inviável e viola
o princípio "1 pedido = 1 mudança". Por isso a Sprint A é dividida em **6 fases
independentes**, cada uma com homologação, sem quebra de contrato público.

Todas as fases preservam:
- Comportamento observável (mesmos payloads de sucesso).
- Códigos HTTP existentes (envelope de erro migra para `{ error, details, correlation_id }`).
- Nenhum novo requisito de auth para clientes públicos.

## Fases

### ✅ A0 — Fundação (esta entrega)

- `_shared/http-response.ts` — `corsHeaders`, `makeResponder`, enum `ErrorCode`.
- `_shared/validation.ts` — `parseJson`, `parseQuery`.
- Matriz de Conformidade (baseline evidence-based).
- Checklist de Governança (gate para novas funções).
- Este plano.

Nenhuma função existente alterada. Zero risco de regressão.

### A1 — CAT-001 (correlation_id 100%)

**Alvo:** 33 funções sem CID (todas exceto pcl-*, translation-lookup, bible-perf-render, bible-text, bible-integrity-check, bible-cache-aggregator, bible-cache-timeseries, nexus-relations).

Estratégia:
1. Substituir bloco `corsHeaders` local por import de `_shared/http-response.ts`.
2. Instanciar `cid = getOrCreateCorrelationId(req)` e `R = makeResponder(cid)`.
3. Trocar `new Response(..., { headers: corsHeaders })` por `R.raw(...)` (sem mudar payload).
4. OPTIONS: `R.cors()`.

Split sugerido em 3 PRs por domínio para revisão factível:
- A1.a — bible-* (17 funções)
- A1.b — mercadopago-* + validate-coupon + send-* (10 funções)
- A1.c — saint-*, catechism, liturgical, sitemap, elevenlabs, vatican, telemetry-*, retention-*, daily-streak-*, colloquium, logos-*, spiritual-continuity, bible-search, bible-abbr-validate, intelligent-notifications, mercado-pago-* legado (16 funções)

Aceite A1: `grep -L "correlation" supabase/functions/*/index.ts` retorna vazio.

### A2 — CAT-002 (Zod em 100%)

**Alvo:** 35 funções sem Zod.

Estratégia:
1. Declarar `BodySchema` / `QuerySchema` no topo.
2. Substituir `await req.json()` bruto por `await parseJson(req, BodySchema)`.
3. Substituir leitura de `url.searchParams` bruta por `parseQuery(url, QuerySchema)`.
4. Erro: `R.error(400, 'invalid_body' | 'invalid_query', issues)`.

Funções stub (`colloquium`, `logos-ai`, `logos-spiritual-insight`, `spiritual-continuity`)
recebem tratamento especial: como não têm handler ativo, ganham apenas
`R.error(501, 'not_implemented')` explícito + Zod placeholder — documenta a
ausência sem mudar comportamento (elas já não fazem nada).

Aceite A2: toda função tem `parseJson` ou `parseQuery` OU justificativa
`// GOVERNANCE: no input` no topo (ex.: sitemap, saint-of-the-day GET puro).

### A3 — CAT-003 (SECURITY DEFINER × anon)

**Escopo:** banco, não Edge Functions.

1. Inventário SQL de todas as `SECURITY DEFINER` com `EXECUTE` para `anon`
   (query em `pg_proc` + `pg_authid` + `information_schema.role_routine_grants`).
2. Para cada: decidir revogar (`REVOKE EXECUTE FROM anon`) OU justificar em ADR
   se o caso público for legítimo (ex.: `bible_translation_readable` já é sob
   PCL — precisa manter).
3. Migração única aditiva com `REVOKE` + comentário citando ADR.
4. Teste pgTAP: garante que a lista prevista de funções permanece bloqueada
   para `anon`.

Aceite A3: `SELECT` no catálogo retorna zero funções `SECURITY DEFINER` com
`EXECUTE` a `anon` fora da allowlist documentada.

### A4 — CAT-004 (índice duplicado)

**Escopo:** banco.

1. Query em `pg_indexes` agrupando por `(tablename, indexdef)` normalizado
   para identificar duplicados exatos.
2. Migração `DROP INDEX` do duplicado (mantendo o mais antigo / com FK/PK).
3. `EXPLAIN ANALYZE` antes/depois em query representativa para confirmar
   ausência de regressão.

Aceite A4: query de duplicados retorna vazio; latência p95 estável ±5%.

### A5 — CAT-008 (contrato HTTP + tratamento de erros)

**Alvo:** 41 funções ainda com envelope de erro heterogêneo.

Estratégia:
1. Substituir `new Response(JSON.stringify({ error: msg }), { status })` por
   `R.error(status, code, details?)`.
2. Substituir `new Response(JSON.stringify(payload))` de sucesso por `R.raw(payload)`
   (mantém envelope legado) ou `R.ok(payload)` (novo envelope) — decisão POR
   FUNÇÃO documentada na matriz para não quebrar clientes.
3. Endpoints internos (webhooks, cron, admin): migram para `R.ok()`.
4. Endpoints públicos consumidos pelo frontend (`bible-text`, `translation-lookup`,
   `bible-search`, `sitemap`, `bible-abbr-validate`): permanecem em `R.raw()`
   preservando shape atual — trocar envelope aqui exige coordenação com frontend
   e sai do escopo da Sprint A.

Aceite A5: 100% das funções usam `makeResponder`. Contrato público inalterado.

### A6 — CI Gate

1. Workflow `edge-functions-governance.yml` que roda a varredura do
   Checklist § Verificação e falha se qualquer função não-allowlisted regride.
2. Allowlist inicial vazia (nenhuma exceção).
3. Publicar Matriz atualizada como artefato do CI.

## Cronograma sugerido (proposta)

| Fase | Duração estimada | Homologação |
|---|---|---|
| A0 ✅ | — | esta entrega |
| A1.a bible-* | 1 sessão | após A0 |
| A1.b mercadopago/notif | 1 sessão | após A1.a |
| A1.c demais | 1 sessão | após A1.b |
| A2 Zod | 2 sessões | após A1 completo |
| A3 SECURITY DEFINER | 1 sessão | pode ir em paralelo a A2 |
| A4 índice duplicado | 1 sessão | pode ir em paralelo a A2 |
| A5 contrato HTTP | 2 sessões | após A2 |
| A6 CI gate | 1 sessão | último |

Total: ~9 sessões, com 4 pontos de homologação (após A1, A2/A3/A4, A5, A6).

## Métricas-alvo

| Métrica | Baseline | Alvo Sprint A |
|---|---|---|
| Observabilidade | 68 | ≥ 85 |
| Edge Functions | 72 | ≥ 88 |
| CID coverage | 30% | 100% |
| Zod coverage | 26% | 100% |
| HTTP padronizado | 13% | 100% |

## Fora de escopo (explícito)

- Alterar `bible_translation_readable` ou qualquer contrato PCL público.
- Refatorar `bible-text` (858 linhas — merece sprint própria).
- Adicionar novas features, telas ou regras de negócio.
- Modificar Nexus / Bíblia / PCL além do necessário para padronização.
- Rate limiting distribuído (fica para Sprint B/D).
