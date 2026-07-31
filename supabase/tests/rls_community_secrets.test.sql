-- Testes de RLS — community_likes, secret_leaks e canais realtime removidos
-- Execução: psql -f supabase/tests/rls_community_secrets.test.sql
-- Cada bloco falha (RAISE EXCEPTION) se a fronteira de segurança regredir.

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. anon não enxerga nada em community_likes nem em secret_leaks
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE n int;
BEGIN
  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM public.community_likes;
  IF n <> 0 THEN
    RAISE EXCEPTION 'FALHA: anon leu % linhas de community_likes', n;
  END IF;
  RESET ROLE;
EXCEPTION WHEN insufficient_privilege THEN
  RESET ROLE; -- permissão revogada também é resultado válido
END $$;

DO $$
DECLARE n int;
BEGIN
  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM public.secret_leaks;
  RESET ROLE;
  RAISE EXCEPTION 'FALHA: anon conseguiu consultar secret_leaks (% linhas)', n;
EXCEPTION WHEN insufficient_privilege THEN
  RESET ROLE; -- esperado: sem GRANT para anon
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. Políticas de community_likes escopadas ao próprio usuário
--    (SET ROLE authenticated não é permitido no runner; validamos as
--     expressões das políticas, que são a fronteira efetiva.)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE q text; wc text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid) INTO q
  FROM pg_policy
  WHERE polrelid = 'public.community_likes'::regclass AND polcmd = 'r';
  IF q IS NULL OR q NOT LIKE '%auth.uid() = user_id%' THEN
    RAISE EXCEPTION 'FALHA: leitura de community_likes não está escopada ao dono (qual=%)', q;
  END IF;

  SELECT pg_get_expr(polwithcheck, polrelid) INTO wc
  FROM pg_policy
  WHERE polrelid = 'public.community_likes'::regclass AND polcmd = 'a';
  IF wc IS NULL OR wc NOT LIKE '%auth.uid()%' THEN
    RAISE EXCEPTION 'FALHA: insert de community_likes aceita user_id de terceiro (check=%)', wc;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. secret_leaks só é visível ao dono verificado ou a admin
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE q text; n int;
BEGIN
  SELECT count(*) INTO n FROM pg_policy WHERE polrelid = 'public.secret_leaks'::regclass;
  IF n <> 1 THEN
    RAISE EXCEPTION 'FALHA: secret_leaks tem % políticas (esperado 1 de leitura)', n;
  END IF;

  SELECT pg_get_expr(polqual, polrelid) INTO q
  FROM pg_policy WHERE polrelid = 'public.secret_leaks'::regclass;
  IF q NOT LIKE '%user_id = auth.uid()%' OR q NOT LIKE '%has_role%' THEN
    RAISE EXCEPTION 'FALHA: política de secret_leaks não usa coluna verificada (qual=%)', q;
  END IF;
  IF q LIKE '%details%' THEN
    RAISE EXCEPTION 'FALHA: política de secret_leaks voltou a confiar em JSON não verificado';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 4. Canais realtime administrativos permanecem fora da publicação
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(tablename, ', ') INTO bad
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime'
    AND tablename IN (
      'bible_cache_alerts', 'editorial_closure_migration_log',
      'secret_leaks', 'community_likes', 'rls_denial_events'
    );
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'FALHA: tabelas administrativas voltaram ao realtime: %', bad;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Trilha de negações é somente-leitura para admins
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policy
  WHERE polrelid = 'public.rls_denial_events'::regclass
    AND polcmd IN ('a', 'w', 'd');
  IF n <> 0 THEN
    RAISE EXCEPTION 'FALHA: rls_denial_events ganhou % políticas de escrita', n;
  END IF;

  IF has_table_privilege('anon', 'public.rls_denial_events', 'SELECT') THEN
    RAISE EXCEPTION 'FALHA: anon tem SELECT em rls_denial_events';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. Nenhuma função SECURITY DEFINER fora da allowlist é executável por anon
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE extra text;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO extra
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  WHERE p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND p.proname NOT IN (
      'bible_read_gate_status', 'bible_source_sprint1_passed',
      'bible_translation_readable', 'bible_translation_ready',
      'bible_translations_readiness', 'get_active_primary_translation',
      'get_bible_phase_summary', 'get_translation_progress',
      'has_role', 'search_patristic_library'
    );
  IF extra IS NOT NULL THEN
    RAISE EXCEPTION 'FALHA: funções SECURITY DEFINER fora da allowlist expostas a anon: %', extra;
  END IF;
END $$;

ROLLBACK;
