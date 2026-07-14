CREATE OR REPLACE FUNCTION public._test_notif_reset() RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public._test_http_response_store;
  DELETE FROM public._test_http_responses;
$$;

CREATE OR REPLACE FUNCTION public._test_enqueue_http(
  p_url text, p_status int, p_body text DEFAULT NULL, p_error text DEFAULT NULL
) RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public._test_http_responses(url, status_code, response_body, error_msg)
  VALUES (p_url, p_status, p_body, p_error)
  RETURNING id;
$$;

REVOKE ALL ON FUNCTION public._test_notif_reset() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._test_enqueue_http(text, int, text, text) FROM PUBLIC, anon, authenticated;
-- caller precisa executar (usado no runner de testes)
GRANT EXECUTE ON FUNCTION public._test_notif_reset() TO postgres;
GRANT EXECUTE ON FUNCTION public._test_enqueue_http(text, int, text, text) TO postgres;