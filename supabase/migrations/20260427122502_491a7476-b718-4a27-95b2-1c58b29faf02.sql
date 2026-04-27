ALTER TABLE public.catechism_execution_logs 
ADD COLUMN admin_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_catechism_logs_created_at ON public.catechism_execution_logs (created_at DESC);
CREATE INDEX idx_catechism_logs_status ON public.catechism_execution_logs (status);