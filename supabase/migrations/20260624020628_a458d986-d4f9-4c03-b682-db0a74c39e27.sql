
-- 1) Rate limit table
CREATE TABLE IF NOT EXISTS public.profile_update_rate (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profile_update_rate TO authenticated;
GRANT ALL ON public.profile_update_rate TO service_role;

ALTER TABLE public.profile_update_rate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rate row"
  ON public.profile_update_rate FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Validation + rate-limit trigger on profiles UPDATE
CREATE OR REPLACE FUNCTION public.enforce_profile_update_guards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_window_seconds constant int := 60;
  v_max_updates constant int := 30;
  v_row public.profile_update_rate%ROWTYPE;
BEGIN
  -- Input validation (defensive; cheap)
  IF NEW.name IS NOT NULL AND char_length(NEW.name) > 80 THEN
    RAISE EXCEPTION 'name too long (max 80)' USING ERRCODE = '22001';
  END IF;
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 500 THEN
    RAISE EXCEPTION 'bio too long (max 500)' USING ERRCODE = '22001';
  END IF;
  IF NEW.ritual_reminder_time IS NOT NULL
     AND NEW.ritual_reminder_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'ritual_reminder_time must be HH:MM' USING ERRCODE = '22023';
  END IF;
  IF NEW.journey_reminder_time IS NOT NULL
     AND NEW.journey_reminder_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'journey_reminder_time must be HH:MM' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(NEW.xp, 0) < 0
     OR COALESCE(NEW.streak, 0) < 0
     OR COALESCE(NEW.level, 0) < 0
     OR COALESCE(NEW.total_minutes_read, 0) < 0 THEN
    RAISE EXCEPTION 'numeric profile fields must be non-negative' USING ERRCODE = '22023';
  END IF;

  -- Rate limit only for authenticated end-user updates; skip for service_role / internal triggers
  IF v_uid IS NULL OR v_uid <> NEW.id THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_row FROM public.profile_update_rate WHERE user_id = v_uid FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.profile_update_rate(user_id, window_start, count, updated_at)
    VALUES (v_uid, now(), 1, now());
  ELSIF v_row.window_start < now() - make_interval(secs => v_window_seconds) THEN
    UPDATE public.profile_update_rate
      SET window_start = now(), count = 1, updated_at = now()
      WHERE user_id = v_uid;
  ELSIF v_row.count >= v_max_updates THEN
    RAISE EXCEPTION 'profile update rate limit exceeded (max % per %s s)', v_max_updates, v_window_seconds
      USING ERRCODE = '54000';
  ELSE
    UPDATE public.profile_update_rate
      SET count = count + 1, updated_at = now()
      WHERE user_id = v_uid;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_update_guards ON public.profiles;
CREATE TRIGGER trg_enforce_profile_update_guards
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_guards();

-- 3) Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_active
  ON public.profiles(premium_expires_at)
  WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_mp_subscription
  ON public.profiles(mercado_pago_subscription_id)
  WHERE mercado_pago_subscription_id IS NOT NULL;

ANALYZE public.profiles;
