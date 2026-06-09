-- Criar esquema para funções internas se não existir
CREATE SCHEMA IF NOT EXISTS auth_internal;

-- Função para verificar se o usuário tem uma role específica
CREATE OR REPLACE FUNCTION auth_internal.has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o usuário tem a role no metadados do JWT (app_metadata)
  -- Assumindo que o sistema de roles usa o padrão do Supabase no app_metadata
  RETURN (
    SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Garantir acesso ao esquema auth_internal
GRANT USAGE ON SCHEMA auth_internal TO authenticated;
GRANT EXECUTE ON FUNCTION auth_internal.has_role(UUID, TEXT) TO authenticated;

-- Resetar e configurar RLS para telemetry_settings
ALTER TABLE public.telemetry_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage telemetry settings" ON public.telemetry_settings;
CREATE POLICY "Admins can manage telemetry settings" 
ON public.telemetry_settings 
FOR ALL 
TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'admin'))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'));

-- Resetar e configurar RLS para telemetry_audit
ALTER TABLE public.telemetry_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and create audit logs" ON public.telemetry_audit;
CREATE POLICY "Admins can view and create audit logs" 
ON public.telemetry_audit 
FOR ALL 
TO authenticated 
USING (auth_internal.has_role(auth.uid(), 'admin'))
WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'));

-- Garantir privilégios básicos
GRANT ALL ON public.telemetry_settings TO authenticated;
GRANT ALL ON public.telemetry_audit TO authenticated;
GRANT ALL ON public.telemetry_settings TO service_role;
GRANT ALL ON public.telemetry_audit TO service_role;
