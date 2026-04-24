ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS is_donation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS webhook_payload JSONB,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- No changes needed to RLS as it's already enabled on the table and policies usually apply to all columns unless restricted.
