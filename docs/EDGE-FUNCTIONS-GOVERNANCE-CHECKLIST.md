# Checklist de Governança — Edge Functions

**Sprint A · v1.0 · gate obrigatório para toda nova Edge Function**

Este documento é **gate de merge**. Nenhuma nova Edge Function pode entrar no
repositório sem que TODOS os itens abaixo estejam marcados (ou justificados
explicitamente em ADR / comentário no topo do arquivo).

## 1. Estrutura

- [ ] Arquivo em `supabase/functions/<nome>/index.ts` (sem subpastas).
- [ ] Nome em `kebab-case`, prefixado pelo domínio (`bible-`, `pcl-`, `nexus-`, `mercadopago-`…).
- [ ] Cabeçalho JSDoc: propósito, contrato HTTP (método, request, response), ADRs referenciados.

## 2. CORS + correlation_id (CAT-001, CAT-008)

- [ ] Importa `corsHeaders` de `../_shared/http-response.ts`.
- [ ] Importa e usa `getOrCreateCorrelationId(req)` de `../_shared/correlation.ts`.
- [ ] Usa `makeResponder(cid)` para todas as respostas (inclusive erros e OPTIONS).
- [ ] Header `x-correlation-id` presente em 100% das respostas (verificar teste).

## 3. Validação de entrada (CAT-002)

- [ ] Todo body/query passa por Zod via `parseJson(req, Schema)` ou `parseQuery(url, Schema)`
      (de `../_shared/validation.ts`).
- [ ] Schema declarado no topo do arquivo, exportado quando útil para testes.
- [ ] Limites explícitos: `.max()` em strings, `.int().positive()` em inteiros, `.uuid()` em IDs.
- [ ] Erro de validação retorna `R.error(400, 'invalid_body' | 'invalid_query', issues)`.

## 4. Autenticação (AUTHN)

Escolha exatamente UM padrão e declare-o no JSDoc:

- [ ] **Público** — endpoint anônimo (ex.: sitemap, canonicalizador). Justificar
      ausência de autenticação no header do arquivo.
- [ ] **Usuário autenticado** — valida JWT com `supabase.auth.getClaims(token)`;
      retorna 401 `unauthorized` se ausente/ inválido.
- [ ] **Admin** — além do JWT, chama `is_current_user_admin()` via RPC; retorna 403
      `forbidden` se não-admin.
- [ ] **Service-role** — endpoint interno (webhook Mercado Pago, cron). Valida
      `Authorization: Bearer <SERVICE_ROLE>` OU `x-cron-secret` OU assinatura HMAC.
- [ ] **Assinatura externa** — webhook de terceiros. Valida assinatura antes de
      qualquer efeito colateral.

## 5. Autorização (AUTHZ)

- [ ] Toda leitura/escrita respeita RLS OU usa `is_current_user_admin()`.
- [ ] Nenhuma função `SECURITY DEFINER` chamada por esta Edge Function é executável
      por `anon` sem justificativa em ADR (CAT-003).
- [ ] Nenhum bypass de RLS via `SERVICE_ROLE` sem checagem de papel prévia.

## 6. Rate limiting

- [ ] Endpoints públicos: rate limit obrigatório via `checkRateLimit(ip)` de
      `../_shared/rate-limit.ts`.
- [ ] Endpoints autenticados de escrita: rate limit obrigatório.
- [ ] Endpoints administrativos: opcional (a critério do domínio, documentar).
- [ ] Resposta em limite: `R.error(429, 'rate_limited')`.

## 7. Contrato HTTP (CAT-008)

- [ ] Método(s) HTTP declarado(s); qualquer outro retorna
      `R.error(405, 'method_not_allowed')`.
- [ ] Sucesso: `R.ok(data)` — envelope `{ data, correlation_id }`.
- [ ] Erro: `R.error(status, code, details?)` — envelope `{ error, details?, correlation_id }`.
- [ ] Códigos usados apenas da enum `ErrorCode` em `_shared/http-response.ts`;
      novos códigos exigem PR ao contrato.
- [ ] Nenhum `console.log` de dados sensíveis (JWT, service-role, PII).

## 8. Testes (Deno)

- [ ] Arquivo `index.test.ts` no mesmo diretório.
- [ ] Cobre: método inválido, payload inválido, autenticação ausente,
      autorização insuficiente, caminho feliz.
- [ ] Consome corpo de toda resposta (`await res.text()`) para evitar leaks.
- [ ] Roda em CI via `supabase--test_edge_functions` ou workflow dedicado.

## 9. Observabilidade

- [ ] Logs estruturados: `console.log(JSON.stringify({ level, msg, correlation_id, ... }))`.
      Nunca logar segredos.
- [ ] Erros 5xx logam `correlation_id` + stack.

## 10. Documentação

- [ ] Atualizar `docs/EDGE-FUNCTIONS-COMPLIANCE-MATRIX.md` na mesma PR.
- [ ] Se altera contrato público, bumpar versão em `CONTRATOS-EDGE-FUNCTIONS-*.md`.

---

## Verificação (varredura estática)

Reprodução do baseline da matriz (executar da raiz do projeto):

```bash
cd supabase/functions && for d in */; do
  d="${d%/}"; [ "$d" = "_shared" ] || [ "$d" = "tests" ] && continue
  f="$d/index.ts"; [ -f "$f" ] || continue
  cid=$(grep -l "correlation"   "$f" >/dev/null && echo Y || echo N)
  zod=$(grep -l "zod\|parseJson\|parseQuery" "$f" >/dev/null && echo Y || echo N)
  http=$(grep -l "makeResponder" "$f" >/dev/null && echo Y || echo N)
  test=$([ -f "$d/index.test.ts" ] && echo Y || echo N)
  printf "%-40s cid=%s zod=%s http=%s test=%s\n" "$d" "$cid" "$zod" "$http" "$test"
done
```

Nova função sem `cid=Y zod=Y http=Y test=Y` (ou justificativa em ADR) NÃO deve ser mergeada.

## Ciclo de vida

- **Autor da PR** preenche os checkboxes no corpo da PR.
- **Reviewer** valida evidências (rodar varredura acima).
- **CI** (a ser adicionado na Fase A5) roda `edge-functions-governance.yml` como gate.
