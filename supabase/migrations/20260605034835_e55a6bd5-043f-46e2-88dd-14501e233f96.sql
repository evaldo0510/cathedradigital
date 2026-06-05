CREATE TABLE public.bible_audit_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('webhook', 'email')),
  target TEXT NOT NULL, -- Webhook URL or Email address
  is_active BOOLEAN DEFAULT true,
  priority_threshold TEXT DEFAULT 'high' CHECK (priority_threshold IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_audit_notifications TO authenticated;
GRANT ALL ON public.bible_audit_notifications TO service_role;
ALTER TABLE public.bible_audit_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit notifications" ON public.bible_audit_notifications
  FOR ALL TO authenticated USING (true); -- Simplified for now, assuming AdminGuard handles UI access

ALTER TABLE public.bible_audit_runs ADD COLUMN IF NOT EXISTS search_queries JSONB DEFAULT '[]';
ALTER TABLE public.bible_audit_runs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_audit_notifications_updated_at
BEFORE UPDATE ON public.bible_audit_notifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
