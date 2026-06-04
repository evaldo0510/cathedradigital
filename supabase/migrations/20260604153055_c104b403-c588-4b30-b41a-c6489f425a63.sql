CREATE TABLE public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_id TEXT,
    event_type TEXT,
    payload JSONB,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins (and service_role) can view logs
CREATE POLICY "Admins can view webhook logs" 
ON public.webhook_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Index for idempotency
CREATE INDEX idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX idx_webhook_logs_provider ON public.webhook_logs(provider);
