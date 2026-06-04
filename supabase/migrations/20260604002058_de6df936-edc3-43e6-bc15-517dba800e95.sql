-- Create security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant access
GRANT ALL ON public.security_logs TO service_role;
GRANT SELECT ON public.security_logs TO authenticated;

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Admin policy using the application's specific admin role check
CREATE POLICY "Admins can view all logs" ON public.security_logs
    FOR SELECT TO authenticated
    USING (
        auth_internal.has_role(auth.uid(), 'admin'::app_role)
    );

-- Function to log sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.security_logs (event_type, user_id, resource, action, details)
    VALUES (
        'SENSITIVE_OP',
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        jsonb_build_object('old_data', row_to_json(OLD), 'new_data', row_to_json(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply logging to profiles (sensitive)
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;
CREATE TRIGGER log_profile_changes
    AFTER UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_operation();

-- Function to log access denials (can be called from edge functions or specialized procedures)
CREATE OR REPLACE FUNCTION public.log_access_denial(resource_name TEXT, attempted_action TEXT, extra_details JSONB DEFAULT '{}'::jsonb)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.security_logs (event_type, user_id, resource, action, details)
    VALUES ('ACCESS_DENIED', auth.uid(), resource_name, attempted_action, extra_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;