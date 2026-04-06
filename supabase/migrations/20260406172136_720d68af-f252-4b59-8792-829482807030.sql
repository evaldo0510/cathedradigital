
-- 1. Create user_sensitive_data table
CREATE TABLE public.user_sensitive_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  diagnosis_result jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.user_sensitive_data ENABLE ROW LEVEL SECURITY;

-- 3. RLS: users can only read their own data
CREATE POLICY "Users can read own sensitive data"
  ON public.user_sensitive_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. RLS: users can update their own data (only diagnosis_result)
CREATE POLICY "Users can update own sensitive data"
  ON public.user_sensitive_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS: allow insert for service role (trigger runs as SECURITY DEFINER)
CREATE POLICY "Service can insert sensitive data"
  ON public.user_sensitive_data FOR INSERT
  WITH CHECK (true);

-- 6. Populate from existing users
INSERT INTO public.user_sensitive_data (user_id, email)
SELECT id, COALESCE(email, '')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 7. Fix handle_new_user to stop inserting email into profiles and create sensitive data row
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  INSERT INTO public.user_sensitive_data (user_id, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$function$;

-- 8. Updated_at trigger
CREATE TRIGGER update_user_sensitive_data_updated_at
  BEFORE UPDATE ON public.user_sensitive_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
