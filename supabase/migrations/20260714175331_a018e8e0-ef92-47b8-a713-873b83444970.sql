-- Validação de URL de canal (formato/host)
CREATE OR REPLACE FUNCTION public.admin_notif_validate_channel(p_channel text, p_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url text := TRIM(COALESCE(p_url, ''));
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF v_url = '' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'URL vazia');
  END IF;

  IF v_url !~* '^https://' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'URL deve começar com https://');
  END IF;

  IF p_channel = 'slack' THEN
    IF v_url !~* '^https://hooks\.slack\.com/services/' THEN
      RETURN jsonb_build_object('valid', false,
        'reason', 'URL do Slack deve começar com https://hooks.slack.com/services/');
    END IF;
  ELSIF p_channel = 'webhook' THEN
    -- host mínimo: https://x.y
    IF v_url !~* '^https://[^/\s]+\.[^/\s]+' THEN
      RETURN jsonb_build_object('valid', false, 'reason', 'Host inválido no webhook');
    END IF;
  ELSE
    RETURN jsonb_build_object('valid', false, 'reason', 'Canal desconhecido: '||p_channel);
  END IF;

  RETURN jsonb_build_object('valid', true, 'reason', 'formato OK');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_validate_channel(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_validate_channel(text, text) TO authenticated;

-- Enfileirar notificação de teste no canal
CREATE OR REPLACE FUNCTION public.admin_notif_send_test(p_channel text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cfg public.pg_stat_snapshot_config;
  v_url text;
  v_payload jsonb;
  v_id uuid;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_cfg FROM public.pg_stat_snapshot_config WHERE id = 1;

  IF p_channel = 'webhook' THEN
    v_url := v_cfg.notify_webhook_url;
    v_payload := jsonb_build_object(
      'event', 'notification_channel_test',
      'channel', 'webhook',
      'occurred_at', now(),
      'message', 'Teste de envio disparado pelo admin.'
    );
  ELSIF p_channel = 'slack' THEN
    v_url := v_cfg.notify_slack_webhook_url;
    v_payload := jsonb_build_object(
      'text', ':test_tube: *Teste de canal Slack* — se você está vendo isto, o webhook está funcionando. ('||now()::text||')'
    );
  ELSE
    RAISE EXCEPTION 'canal desconhecido: %', p_channel;
  END IF;

  IF v_url IS NULL OR TRIM(v_url) = '' THEN
    RAISE EXCEPTION 'URL do canal % não configurada', p_channel;
  END IF;

  v_id := public.pg_stat_notif_enqueue(p_channel, v_url, v_payload, 1);
  PERFORM public.pg_stat_notif_process_queue();

  RETURN jsonb_build_object(
    'notification_id', v_id,
    'channel', p_channel,
    'target_url', v_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notif_send_test(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_notif_send_test(text) TO authenticated;