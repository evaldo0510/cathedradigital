-- Testes de integração do botão "Reprocessar" do admin (admin_retry_pending_notification)
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pg_stat_notif_admin_retry.integration.test.sql
--
-- A lógica dos 4 casos vive em public._test_notif_admin_retry_run_all() (SECURITY DEFINER),
-- que replica a mecânica pós-guard da RPC admin_retry_pending_notification para permitir
-- execução sem contexto de auth. Este arquivo apenas dispara e valida os resultados.

\echo '=== Rodando bateria E2E do botão reprocessar ==='

SELECT case_name, result FROM public._test_notif_admin_retry_run_all() ORDER BY case_name;

DO $$
DECLARE v_fails int;
BEGIN
  SELECT count(*) INTO v_fails
    FROM public._test_notif_admin_retry_run_all()
    WHERE result NOT LIKE 'PASS%';
  IF v_fails > 0 THEN
    RAISE EXCEPTION '% casos falharam', v_fails;
  END IF;
  RAISE NOTICE 'TODOS OS 4 TESTES DE REPROCESSAR PASSARAM';
END $$;
