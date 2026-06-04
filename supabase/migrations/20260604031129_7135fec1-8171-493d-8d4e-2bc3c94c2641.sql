ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mercado_pago_subscription_id TEXT;

CREATE TABLE IF NOT EXISTS public.secret_leaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  severity TEXT,
  details JSONB
);

GRANT ALL ON public.secret_leaks TO service_role;
GRANT SELECT ON public.secret_leaks TO authenticated;

-- Ensure service_role can manage transactions
GRANT ALL ON public.transactions TO service_role;
