#!/usr/bin/env bash
# Testes de integração do circuit breaker por canal + max_attempts dinâmico
# sob falhas intercaladas e múltiplos workers concorrentes.
#
# Cenários cobertos:
#   A) max_attempts dinâmico: canal webhook com max_attempts=2, todas falhas
#      → attempts nunca ultrapassa 2, status termina 'failed'.
#   B) max_fail_rate: canal slack com fail_ratio alto acima do limite,
#      gate abre e in_flight residual permanece baixo (canal pausado).
#   C) Recuperação: após reduzir fail_ratio (limpar mocks 500 e reinserir 200),
#      gate fecha e restantes drenam para 'succeeded'.
#
# Uso:
#   ./supabase/tests/pg_stat_notif_limits_concurrency.test.sh
#   WORKERS=6 ROUNDS=4 ./supabase/tests/pg_stat_notif_limits_concurrency.test.sh

set -euo pipefail

WORKERS="${WORKERS:-6}"
ROUNDS="${ROUNDS:-4}"

PREFIX_A="https://test.local/lim-web-"
PREFIX_B="https://test.local/lim-sl-"

WORKER_SQL="SET LOCAL app.notif_test_mode = 'on'; SELECT public.pg_stat_notif_process_queue();"

run_workers() {
  local rounds=$1
  for r in $(seq 1 "$rounds"); do
    pids=()
    for w in $(seq 1 "$WORKERS"); do
      psql -q -1 -c "$WORKER_SQL" > /tmp/notif_lim_${w}.log 2>&1 &
      pids+=($!)
    done
    for pid in "${pids[@]}"; do wait "$pid" || true; done
  done
  # Dreno sequencial
  for i in 1 2 3; do psql -q -1 -c "$WORKER_SQL" > /dev/null; done
}

echo "=== A) max_attempts dinâmico (webhook, max_attempts=2, 100% falha) ==="
# Configura canal webhook com breaker frouxo (não deve bloquear)
psql -q -c "UPDATE public.pg_stat_notif_channel_limits
              SET max_fail_rate=0.99, min_samples=1000, window_minutes=15, enabled=true
            WHERE channel='webhook';" > /dev/null

psql -q -c "SELECT public._test_notif_limits_seed('webhook','$PREFIX_A', 8, 1.0, 2);" > /dev/null

run_workers "$ROUNDS"

RESULT_A="$(psql -tAc "SELECT jsonb_pretty(public._test_notif_limits_verify('$PREFIX_A', 2));")"
echo "$RESULT_A"
ALL_A="$(psql -tAc "SELECT (public._test_notif_limits_verify('$PREFIX_A', 2)->>'all_passed');")"
FAILED_A="$(psql -tAc "SELECT count(*) FROM public.pg_stat_pending_notifications
                        WHERE target_url LIKE '$PREFIX_A%' AND status='failed';")"

echo ""
echo "=== B) max_fail_rate (slack, 80% falha, min_samples=3) ==="
psql -q -c "UPDATE public.pg_stat_notif_channel_limits
              SET max_fail_rate=0.3, min_samples=3, window_minutes=15, enabled=true
            WHERE channel='slack';" > /dev/null

psql -q -c "SELECT public._test_notif_limits_seed('slack','$PREFIX_B', 10, 0.8, 5);" > /dev/null

run_workers "$ROUNDS"

GATE_BLOCKED="$(psql -tAc "SELECT public.pg_stat_notif_channel_gate_blocked('slack');")"
HEALTH_B="$(psql -tAc "SELECT jsonb_pretty(public.pg_stat_notif_channel_health('slack'));")"
echo "gate_blocked=$GATE_BLOCKED"
echo "$HEALTH_B"
STILL_PENDING_B="$(psql -tAc "SELECT count(*) FROM public.pg_stat_pending_notifications
                                WHERE target_url LIKE '$PREFIX_B%' AND status='pending';")"

echo ""
echo "=== C) Recuperação: remover mocks 500, gate fecha, restantes drenam ==="
psql -q -c "UPDATE public._test_http_responses
              SET status_code=200, response_body='ok'
            WHERE url LIKE '$PREFIX_B%' AND status_code=500;" > /dev/null
# Reset attempts para permitir novo dispatch (simula operador reprocessando)
psql -q -c "UPDATE public.pg_stat_pending_notifications
              SET attempts=0, status='pending', next_attempt_at=now()
            WHERE target_url LIKE '$PREFIX_B%' AND status IN ('pending','failed');" > /dev/null
# Limpa histórico de falhas para o health recalcular limpo
psql -q -c "DELETE FROM public.pg_stat_notif_attempts
              WHERE notification_id IN (
                SELECT id FROM public.pg_stat_pending_notifications WHERE target_url LIKE '$PREFIX_B%'
              );" > /dev/null

run_workers "$ROUNDS"

GATE_AFTER="$(psql -tAc "SELECT public.pg_stat_notif_channel_gate_blocked('slack');")"
SUCC_C="$(psql -tAc "SELECT count(*) FROM public.pg_stat_pending_notifications
                       WHERE target_url LIKE '$PREFIX_B%' AND status='succeeded';")"
PEND_C="$(psql -tAc "SELECT count(*) FROM public.pg_stat_pending_notifications
                       WHERE target_url LIKE '$PREFIX_B%';")"

echo "gate_after=$GATE_AFTER succeeded=$SUCC_C/$PEND_C"

# Restaurar defaults
psql -q -c "UPDATE public.pg_stat_notif_channel_limits
              SET max_fail_rate=0.5, min_samples=5, window_minutes=15 WHERE channel IN ('webhook','slack');" > /dev/null

psql -q -c "SELECT public._test_notif_limits_cleanup('$PREFIX_A');" > /dev/null
psql -q -c "SELECT public._test_notif_limits_cleanup('$PREFIX_B');" > /dev/null

echo ""
echo "=== Asserts ==="
rc=0
if [ "$ALL_A" != "true" ]; then echo "FAIL A: invariantes violadas"; rc=1; else echo "PASS A: invariantes"; fi
if [ "$FAILED_A" -lt 1 ]; then echo "FAIL A: nenhuma notificação terminou 'failed' com max_attempts=2"; rc=1; else echo "PASS A: $FAILED_A falhas terminais respeitando max_attempts"; fi
if [ "$GATE_BLOCKED" != "t" ]; then echo "FAIL B: gate deveria estar ABERTO com 80% de falhas"; rc=1; else echo "PASS B: gate abriu sob fail_rate > max_fail_rate"; fi
if [ "$STILL_PENDING_B" -lt 1 ]; then echo "FAIL B: canal bloqueado deveria manter pendências (adiadas)"; rc=1; else echo "PASS B: $STILL_PENDING_B pendências adiadas pelo gate"; fi
if [ "$GATE_AFTER" != "f" ]; then echo "FAIL C: gate deveria FECHAR após limpar falhas"; rc=1; else echo "PASS C: gate fechou após recuperação"; fi
if [ "$SUCC_C" -lt 1 ]; then echo "FAIL C: nenhuma notificação drenou após recuperação"; rc=1; else echo "PASS C: $SUCC_C notificações drenaram após gate fechar"; fi

exit $rc
