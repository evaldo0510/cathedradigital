-- 1. Criar tabela de auditoria administrativa
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now() NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'NOTIFY'
    entity_type text NOT NULL, -- 'coming_soon_leads', 'realtime_notifications'
    entity_id text,
    old_data jsonb,
    new_data jsonb,
    user_agent text,
    ip_address text
);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 2. Função de disparo para auditoria
CREATE OR REPLACE FUNCTION public.audit_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    IF (public.has_role(auth.uid(), 'admin')) THEN
        INSERT INTO public.admin_audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_data,
            new_data
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id::text 
                ELSE NEW.id::text 
            END,
            CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Aplicar triggers em coming_soon_leads
DROP TRIGGER IF EXISTS audit_coming_soon_leads ON public.coming_soon_leads;
CREATE TRIGGER audit_coming_soon_leads
AFTER INSERT OR UPDATE OR DELETE ON public.coming_soon_leads
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

-- 4. Criar tabela de auditoria de notificações (se não existir)
CREATE TABLE IF NOT EXISTS public.realtime_events_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now() NOT NULL,
    event_type text NOT NULL,
    payload jsonb,
    initiated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.realtime_events_audit TO authenticated;
GRANT ALL ON public.realtime_events_audit TO service_role;
ALTER TABLE public.realtime_events_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view realtime audit"
    ON public.realtime_events_audit FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- 5. Função para registrar envios de notificação
CREATE OR REPLACE FUNCTION public.log_notification_event(_event_type text, _payload jsonb)
RETURNS void AS $$
BEGIN
    INSERT INTO public.realtime_events_audit (event_type, payload, initiated_by)
    VALUES (_event_type, _payload, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Restringir execução de has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
