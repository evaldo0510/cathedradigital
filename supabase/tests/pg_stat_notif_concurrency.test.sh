#!/usr/bin/env bash
# Testes de concorrência do worker pg_stat_notif_process_queue.
# Semeia N notificações (com falhas intercaladas), dispara W workers em paralelo
# várias rodadas (dispatch + resposta), e valida invariantes de idempotência.
#
# Uso:
#   ./supabase/tests/pg_stat_notif_concurrency.test.sh
#   COUNT=40 WORKERS=8 ROUNDS=4 FAIL_RATIO=0.3 ./supabase/tests/pg_stat_notif_concurrency.test.sh
#
# Requer: PG* env vars + psql.

set -euo pipefail

COUNT="${COUNT:-30}"
WORKERS="${WORKERS:-6}"
ROUNDS="${ROUNDS:-4}"
FAIL_RATIO="${FAIL_RATIO:-0.3}"

echo "=== Concurrency test: N=$COUNT workers=$WORKERS rounds=$ROUNDS fail_ratio=$FAIL_RATIO ==="

psql -q -c "SELECT public._test_notif_concurrency_seed($COUNT, $FAIL_RATIO);" > /dev/null

WORKER_SQL="SET LOCAL app.notif_test_mode = 'on'; SELECT public.pg_stat_notif_process_queue();"

for r in $(seq 1 "$ROUNDS"); do
  echo "--- rodada $r/$ROUNDS: disparando $WORKERS workers em paralelo ---"
  pids=()
  for w in $(seq 1 "$WORKERS"); do
    psql -q -1 -c "$WORKER_SQL" > /tmp/notif_worker_${w}.log 2>&1 &
    pids+=($!)
  done
  fail=0
  for pid in "${pids[@]}"; do
    if ! wait "$pid"; then
      fail=$((fail+1))
    fi
  done
  if [ "$fail" -gt 0 ]; then
    echo "AVISO: $fail workers retornaram erro (esperado se lock/backoff)."
    tail -n 3 /tmp/notif_worker_1.log || true
  fi
done

# passes finais sequenciais para drenar respostas de qualquer in_flight remanescente
for i in 1 2 3; do
  psql -q -1 -c "$WORKER_SQL" > /dev/null
done

echo "=== Resultado ==="
RESULT="$(psql -tAc "SELECT jsonb_pretty(public._test_notif_concurrency_verify());")"
echo "$RESULT"

ALL_PASSED="$(psql -tAc "SELECT (public._test_notif_concurrency_verify()->>'all_passed');")"

psql -q -c "SELECT public._test_notif_concurrency_cleanup();" > /dev/null

if [ "$ALL_PASSED" != "true" ]; then
  echo ""
  echo "FAIL: alguma invariante de concorrência foi violada."
  exit 1
fi

echo ""
echo "PASS: todas as invariantes de concorrência foram respeitadas."
