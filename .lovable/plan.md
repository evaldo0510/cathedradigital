## Objetivo
Testes de integração da fila `pg_stat_pending_notifications` validando retries com backoff/jitter e atualização de `next_attempt_at` para diferentes códigos HTTP e erros de rede, sem chamar rede real.

## Estratégia (mínima invasão)
Em vez de refatorar `pg_stat_notif_process_queue` inteira, isolar **só a chamada de rede** atrás de um wrapper SQL trocável em modo teste:

- Nova função `public._notif_http_post(url text, headers jsonb, body jsonb) returns table(status int, response text, error text)`.
  - Modo normal: chama `net.http_post` e devolve status/response/error.
  - Modo teste: quando `current_setting('app.notif_test_mode', true) = 'on'`, lê da tabela `_test_http_responses` (fila FIFO por URL) e devolve a resposta programada, sem tocar em `pg_net`.
- Reescrever apenas o trecho de dispatch dentro de `pg_stat_notif_process_queue` para usar `_notif_http_post` (mesma assinatura de retorno que já é consumida). Nenhuma outra lógica muda.

## Tabela de fixtures
`public._test_http_responses` (usada só em teste, `revoke all` de anon/authenticated):
- `url text`, `seq bigint`, `status int`, `response text`, `error text`, `consumed bool`

Helper `_test_enqueue_http(url, status, response, error)` para popular na ordem.

## Bateria de testes (`supabase/tests/pg_stat_notif_queue.integration.test.sql`)
Executada via `psql` no runner do repo (padrão dos outros `.test.sql`). Cada caso:

1. **200 OK**: enfileira notif + resposta 200 → `process_queue` → estado `succeeded`, `attempts=1`, `attempt` gravado em `pg_stat_notif_attempts`.
2. **500 retryable**: resposta 500 → `retry_scheduled`, `attempts=1`, `next_attempt_at` no range esperado do backoff (usa a mesma `pg_stat_notif_backoff`).
3. **429 rate limit**: mesma verificação de retry + delay dentro da faixa.
4. **400 não-retryable**: `failed` imediato, sem `next_attempt_at`.
5. **Erro de rede** (`status=null, error='timeout'`): tratado como retryable, agenda próximo.
6. **Limite de tentativas**: força `attempts = max-1`, resposta 500 → transição para `failed`, sem novo `next_attempt_at`.
7. **Avanço de tempo**: usa `update ... set next_attempt_at = now() - interval '1s'` para simular "tempo avançou" e valida que a próxima chamada re-processa.
8. **Idempotência do worker**: chamar `process_queue` duas vezes seguidas não duplica attempts para item já `succeeded`.

Cada teste faz `raise exception` se o assert falhar; teste inteiro roda dentro de transação com `rollback` no final (via `begin;` no header do arquivo).

## Escopo do que NÃO muda
- Nenhuma alteração em RLS, GRANTs de tabelas existentes, cron ou UI.
- `_test_http_responses` e `_notif_http_post` em modo teste só ativam com o GUC `app.notif_test_mode='on'` setado na sessão de teste — produção continua batendo em `net.http_post` normalmente.

## Riscos e mitigação
- **Risco**: bug no wrapper quebra envio real. **Mitigação**: wrapper delega direto para `net.http_post` fora do modo teste, sem lógica extra; smoke test manual no admin após deploy (botão "Reprocessar" numa notif de teste).
- **Risco**: fixture consumida em ordem errada. **Mitigação**: `seq bigserial` + `for update skip locked` no consumo.

## Entregáveis
- Migration: `_notif_http_post`, `_test_http_responses`, `_test_enqueue_http`, patch em `pg_stat_notif_process_queue`.
- `supabase/tests/pg_stat_notif_queue.integration.test.sql` com os 8 casos.
- Sem mudança em UI/tipos gerados (não há RPC nova exposta ao client).