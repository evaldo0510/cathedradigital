CREATE OR REPLACE FUNCTION public.admin_notif_validate_channel(p_channel text, p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url   text := TRIM(COALESCE(p_url, ''));
  v_host  text;
  v_path  text;
  v_checks jsonb := '[]'::jsonb;
  v_ok     boolean := true;
  v_reason text := 'formato OK';

  -- helper via macro: repetir o padrão manualmente
  v_pass boolean;
  v_msg  text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_channel NOT IN ('webhook','slack') THEN
    RETURN jsonb_build_object(
      'valid', false, 'reason', 'Canal desconhecido: '||p_channel,
      'checks', jsonb_build_array(jsonb_build_object('name','channel','ok',false,'detail','canal inválido'))
    );
  END IF;

  -- 1) não vazia
  v_pass := v_url <> '';
  v_msg  := 'URL vazia';
  v_checks := v_checks || jsonb_build_object('name','nao_vazia','ok',v_pass,'detail',CASE WHEN v_pass THEN 'preenchida' ELSE v_msg END);
  IF NOT v_pass THEN
    RETURN jsonb_build_object('valid', false, 'reason', v_msg, 'checks', v_checks);
  END IF;

  -- 2) comprimento
  v_pass := length(v_url) <= 2048;
  v_msg  := 'URL excede 2048 caracteres';
  v_checks := v_checks || jsonb_build_object('name','comprimento','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

  -- 3) https
  v_pass := v_url ~* '^https://';
  v_msg  := 'URL deve começar com https://';
  v_checks := v_checks || jsonb_build_object('name','https','ok',v_pass,'detail',CASE WHEN v_pass THEN 'https' ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

  -- 4) sem credenciais embutidas
  v_pass := v_url !~* '^https?://[^/@\s]+@';
  v_msg  := 'URL contém credenciais embutidas (user:pass@)';
  v_checks := v_checks || jsonb_build_object('name','sem_credenciais','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

  -- extrai host/path
  IF v_url ~* '^https://[^/\s]+' THEN
    v_host := lower(substring(v_url from '^https://([^/\s?#]+)'));
    v_path := coalesce(substring(v_url from '^https://[^/\s?#]+(/[^\s?#]*)'), '');
  END IF;

  -- 5) host válido
  v_pass := v_host IS NOT NULL AND v_host ~ '^[a-z0-9._-]+\.[a-z]{2,}$';
  v_msg  := 'Host inválido: '||coalesce(v_host,'?');
  v_checks := v_checks || jsonb_build_object('name','host_valido','ok',v_pass,'detail',CASE WHEN v_pass THEN v_host ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

  -- 6) sem host privado/loopback
  v_pass := v_host IS NOT NULL
    AND v_host !~ '^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|0\.0\.0\.0)'
    AND v_host <> '::1'
    AND v_host !~ '\.local$'
    AND v_host !~ '\.internal$';
  v_msg  := 'Host privado/loopback não permitido: '||coalesce(v_host,'?');
  v_checks := v_checks || jsonb_build_object('name','sem_host_privado','ok',v_pass,'detail',CASE WHEN v_pass THEN 'público' ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

  -- 7) específico do canal
  IF p_channel = 'slack' THEN
    v_pass := v_host = 'hooks.slack.com';
    v_msg  := 'Slack: host deve ser hooks.slack.com';
    v_checks := v_checks || jsonb_build_object('name','slack_host','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
    IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;

    v_pass := v_path ~ '^/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]+';
    v_msg  := 'Slack: caminho deve seguir /services/T…/B…/token';
    v_checks := v_checks || jsonb_build_object('name','slack_path','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
    IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;
  ELSE
    v_pass := v_host IS NOT NULL AND v_host ~ '\.[a-z]{2,}$';
    v_msg  := 'Webhook: TLD ausente';
    v_checks := v_checks || jsonb_build_object('name','webhook_tld','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
    IF NOT v_pass THEN v_ok := false; IF v_reason = 'formato OK' THEN v_reason := v_msg; END IF; END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid',   v_ok,
    'reason',  CASE WHEN v_ok THEN 'formato OK' ELSE v_reason END,
    'channel', p_channel,
    'host',    v_host,
    'checks',  v_checks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_validate_channel(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_validate_channel(text, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_notif_validate_payload(p_channel text, p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_checks jsonb := '[]'::jsonb;
  v_ok     boolean := true;
  v_reason text := 'payload OK';
  v_size   int;
  v_text_ok boolean;
  v_blocks_ok boolean;
  v_pass boolean;
  v_msg  text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_channel NOT IN ('webhook','slack') THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'canal inválido', 'checks', v_checks);
  END IF;

  v_pass := p_payload IS NOT NULL;
  v_msg  := 'payload nulo';
  v_checks := v_checks || jsonb_build_object('name','nao_nulo','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
  IF NOT v_pass THEN
    RETURN jsonb_build_object('valid', false, 'reason', v_msg, 'checks', v_checks);
  END IF;

  v_pass := jsonb_typeof(p_payload) = 'object';
  v_msg  := 'payload deve ser objeto JSON';
  v_checks := v_checks || jsonb_build_object('name','objeto_json','ok',v_pass,'detail',CASE WHEN v_pass THEN 'objeto' ELSE v_msg END);
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'payload OK' THEN v_reason := v_msg; END IF; END IF;

  v_size := octet_length(p_payload::text);
  v_pass := v_size <= 65536;
  v_msg  := 'payload excede 64 KB (atual: '||v_size||' bytes)';
  v_checks := v_checks || jsonb_build_object('name','tamanho_max_64k','ok',v_pass,'detail',v_size||' bytes');
  IF NOT v_pass THEN v_ok := false; IF v_reason = 'payload OK' THEN v_reason := v_msg; END IF; END IF;

  IF p_channel = 'slack' THEN
    v_text_ok := (p_payload ? 'text') AND jsonb_typeof(p_payload->'text') = 'string' AND length(p_payload->>'text') > 0;
    v_blocks_ok := (p_payload ? 'blocks') AND jsonb_typeof(p_payload->'blocks') = 'array' AND jsonb_array_length(p_payload->'blocks') > 0;

    v_pass := v_text_ok OR v_blocks_ok;
    v_msg  := 'Slack: payload deve conter "text" (string) ou "blocks" (array não-vazio)';
    v_checks := v_checks || jsonb_build_object('name','slack_text_ou_blocks','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
    IF NOT v_pass THEN v_ok := false; IF v_reason = 'payload OK' THEN v_reason := v_msg; END IF; END IF;

    IF v_text_ok THEN
      v_pass := length(p_payload->>'text') <= 40000;
      v_msg  := 'Slack: text excede 40000 caracteres';
      v_checks := v_checks || jsonb_build_object('name','slack_text_len','ok',v_pass,'detail',CASE WHEN v_pass THEN 'ok' ELSE v_msg END);
      IF NOT v_pass THEN v_ok := false; IF v_reason = 'payload OK' THEN v_reason := v_msg; END IF; END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid',   v_ok,
    'reason',  CASE WHEN v_ok THEN 'payload OK' ELSE v_reason END,
    'channel', p_channel,
    'bytes',   v_size,
    'checks',  v_checks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_validate_payload(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_validate_payload(text, jsonb) TO authenticated;