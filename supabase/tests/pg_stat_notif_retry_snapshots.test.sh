#!/usr/bin/env bash
# Regressão por snapshot: compara o estado (antes/depois do reprocessar) em 5 cenários
# contra o fixture esperado em supabase/tests/fixtures/notif_retry_snapshots.expected.json.
#
# Uso:
#   ./supabase/tests/pg_stat_notif_retry_snapshots.test.sh
#   UPDATE_SNAPSHOTS=1 ./supabase/tests/pg_stat_notif_retry_snapshots.test.sh   # regrava fixture
#
# Requer: PG* env vars configuradas (PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE) e psql.

set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$DIR/fixtures/notif_retry_snapshots.expected.json"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "=== Executando bateria _test_notif_retry_snapshots() ==="
psql -tAc "SELECT jsonb_pretty(public._test_notif_retry_snapshots());" > "$TMP"

# Validação estrutural mínima: 5 cenários presentes
for s in S1_failed_reset S2_failed_reset_success S3_failed_reset_retry \
         S4_in_flight_reset_preserves_attempts S5_succeeded_reset; do
  if ! grep -q "\"$s\"" "$TMP"; then
    echo "FAIL: cenário $s ausente no snapshot"
    exit 1
  fi
done

if [ "${UPDATE_SNAPSHOTS:-0}" = "1" ]; then
  cp "$TMP" "$FIXTURE"
  echo "Fixture atualizado: $FIXTURE"
  exit 0
fi

if ! diff -u "$FIXTURE" "$TMP"; then
  echo ""
  echo "FAIL: snapshot difere do fixture."
  echo "Se a mudança é intencional, rode: UPDATE_SNAPSHOTS=1 $0"
  exit 1
fi

echo "PASS: snapshot bate com fixture (5 cenários)."
