-- Testes de integração da fila pg_stat_pending_notifications
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/pg_stat_notif_queue.integration.test.sql
--
-- A lógica dos 8 casos vive em public._test_notif_run_all() (SECURITY DEFINER)
-- para contornar RLS/ownership. Este arquivo apenas dispara e valida.

\echo '=== Rodando bateria de integração da fila ==='

SELECT case_name, result FROM public._test_notif_run_all() ORDER BY case_name;

-- Falha o script se algum caso não passou
DO $$
DECLARE v_fails int;
BEGIN
  SELECT count(*) INTO v_fails
    FROM public._test_notif_run_all()
    WHERE result NOT LIKE 'PASS%';
  IF v_fails > 0 THEN
    RAISE EXCEPTION '% casos falharam', v_fails;
  END IF;
  RAISE NOTICE 'TODOS OS 8 TESTES PASSARAM';
END $$;
