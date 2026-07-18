-- RLS verification for public.nexus_contributions
-- Executar via psql com role de teste. Retorna PASS/FAIL por caso.

BEGIN;

-- Setup: dois usuários "comuns" + 1 admin
DO $$
DECLARE u1 uuid := gen_random_uuid();
        u2 uuid := gen_random_uuid();
        adm uuid := gen_random_uuid();
BEGIN
  PERFORM set_config('app.u1', u1::text, true);
  PERFORM set_config('app.u2', u2::text, true);
  PERFORM set_config('app.adm', adm::text, true);

  INSERT INTO public.user_roles(user_id, role) VALUES (adm, 'admin');

  -- Contribuição do u1 e do u2 (bypass RLS via superuser durante seed)
  INSERT INTO public.nexus_contributions(user_id, book_abbr, chapter, verse, connection_type, reference_title, summary, status)
  VALUES
    (u1, 'Jo', 1, 1, 'ccc', 'CIC 1', 'x', 'pending'),
    (u2, 'Jo', 1, 2, 'ccc', 'CIC 2', 'y', 'pending');
END$$;

-- Caso 1: usuário comum vê apenas as suas
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claim.sub" TO current_setting('app.u1');
SELECT
  CASE WHEN COUNT(*) = 1 AND bool_and(user_id::text = current_setting('app.u1'))
       THEN 'PASS: user vê apenas as próprias'
       ELSE 'FAIL: vazamento entre usuários' END AS result
FROM public.nexus_contributions;

-- Caso 2: usuário comum não pode UPDATE de outros
SET LOCAL "request.jwt.claim.sub" TO current_setting('app.u1');
DO $$
BEGIN
  UPDATE public.nexus_contributions
  SET status = 'approved'
  WHERE user_id::text = current_setting('app.u2');
  IF FOUND THEN
    RAISE EXCEPTION 'FAIL: usuário comum conseguiu aprovar contribuição alheia';
  END IF;
END$$;

-- Caso 3: admin vê todas
SET LOCAL "request.jwt.claim.sub" TO current_setting('app.adm');
SELECT
  CASE WHEN COUNT(*) >= 2 THEN 'PASS: admin vê todas'
       ELSE 'FAIL: admin não vê todas' END AS result
FROM public.nexus_contributions;

-- Caso 4: aprovar dispara notificação para o autor
SELECT public.approve_nexus_contribution(id, 'ok')
FROM public.nexus_contributions
WHERE user_id::text = current_setting('app.u1')
LIMIT 1;

SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id::text = current_setting('app.u1')
      AND title = 'Contribuição aprovada'
  ) THEN 'PASS: notificação criada' ELSE 'FAIL: sem notificação' END AS result;

ROLLBACK;
