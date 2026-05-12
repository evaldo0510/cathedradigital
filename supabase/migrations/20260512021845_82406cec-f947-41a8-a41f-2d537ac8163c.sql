-- 1. Create auth_internal schema if not exists
CREATE SCHEMA IF NOT EXISTS auth_internal;

-- 2. Re-create all SECURITY DEFINER functions in auth_internal with fixed search_path
CREATE OR REPLACE FUNCTION auth_internal.has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.can_update_own_profile(_profile_id uuid, _role text, _is_premium boolean, _email text)
RETURNS boolean AS $$
  SELECT
    _profile_id = auth.uid()
    AND (
      auth_internal.has_role(auth.uid(), 'admin'::app_role) OR
      (
        _role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = _profile_id)
        AND _is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM public.profiles WHERE id = _profile_id)
      )
    )
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.update_last_action_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_action_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.enforce_profile_security()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT auth_internal.has_role(auth.uid(), 'admin') THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      NEW.role := OLD.role;
    END IF;
    IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
      NEW.is_premium := OLD.is_premium;
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      NEW.id := OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_premium IS DISTINCT FROM NEW.is_premium) THEN
    IF NOT auth_internal.has_role(auth.uid(), 'admin') THEN
      NEW.role := OLD.role;
      NEW.is_premium := OLD.is_premium;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.sync_admin_role_from_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id
      AND role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.update_last_action_at_from_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.metadata->>'user_id') IS NOT NULL THEN
    UPDATE public.profiles
    SET last_action_at = now()
    WHERE id = (NEW.metadata->>'user_id')::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION auth_internal.sync_content_tags_to_array()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.spiritual_contents
    SET tags = (
      SELECT array_agg(t.label)
      FROM public.content_tags ct
      JOIN public.tags t ON ct.tag_id = t.id
      WHERE ct.content_id = NEW.content_id
    )
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.spiritual_contents
    SET tags = (
      SELECT COALESCE(array_agg(t.label), '{}')
      FROM public.content_tags ct
      JOIN public.tags t ON ct.tag_id = t.id
      WHERE ct.content_id = OLD.content_id
    )
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update all triggers
DROP TRIGGER IF EXISTS profiles_security_enforcement ON public.profiles;
CREATE TRIGGER profiles_security_enforcement BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION auth_internal.enforce_profile_security();

DROP TRIGGER IF EXISTS sync_admin_role_from_profile ON public.profiles;
CREATE TRIGGER sync_admin_role_from_profile AFTER INSERT OR UPDATE OF role ON public.profiles FOR EACH ROW EXECUTE FUNCTION auth_internal.sync_admin_role_from_profile();

DROP TRIGGER IF EXISTS tr_update_last_action_history ON public.user_history;
CREATE TRIGGER tr_update_last_action_history AFTER INSERT ON public.user_history FOR EACH ROW EXECUTE FUNCTION auth_internal.update_last_action_at();

DROP TRIGGER IF EXISTS tr_update_last_action_journal ON public.spiritual_journal;
CREATE TRIGGER tr_update_last_action_journal AFTER INSERT ON public.spiritual_journal FOR EACH ROW EXECUTE FUNCTION auth_internal.update_last_action_at();

DROP TRIGGER IF EXISTS tr_update_last_action_progress ON public.journey_progress;
CREATE TRIGGER tr_update_last_action_progress AFTER INSERT ON public.journey_progress FOR EACH ROW EXECUTE FUNCTION auth_internal.update_last_action_at();

DROP TRIGGER IF EXISTS trigger_update_last_action_at ON public.user_history;
CREATE TRIGGER trigger_update_last_action_at AFTER INSERT ON public.user_history FOR EACH ROW EXECUTE FUNCTION auth_internal.update_last_action_at();

DROP TRIGGER IF EXISTS trg_sync_content_tags ON public.content_tags;
CREATE TRIGGER trg_sync_content_tags AFTER INSERT OR DELETE ON public.content_tags FOR EACH ROW EXECUTE FUNCTION auth_internal.sync_content_tags_to_array();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION auth_internal.handle_new_user();

-- 4. Update all RLS policies
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Only admins can view coupons" ON public.coupons;
CREATE POLICY "Only admins can view coupons" ON public.coupons FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage glossary" ON public.glossary;
CREATE POLICY "Admins can manage glossary" ON public.glossary FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage journey steps" ON public.journey_steps;
CREATE POLICY "Admins can manage journey steps" ON public.journey_steps FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Premium journey steps require premium" ON public.journey_steps;
CREATE POLICY "Premium journey steps require premium" ON public.journey_steps FOR SELECT TO authenticated 
USING (is_free OR (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium)) OR auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage journeys" ON public.journeys;
CREATE POLICY "Admins can manage journeys" ON public.journeys FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can create roles" ON public.user_roles;
CREATE POLICY "Admins can create roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can read all sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Admins can read all sensitive data" ON public.user_sensitive_data FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.spiritual_journal;
CREATE POLICY "Admins can view all journal entries" ON public.spiritual_journal FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all user notes" ON public.user_notes;
CREATE POLICY "Admins can view all user notes" ON public.user_notes FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all user history" ON public.user_history;
CREATE POLICY "Admins can view all user history" ON public.user_history FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all journey progress" ON public.journey_progress;
CREATE POLICY "Admins can view all journey progress" ON public.journey_progress FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all chapters read" ON public.bible_chapters_read;
CREATE POLICY "Admins can view all chapters read" ON public.bible_chapters_read FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all psychological profiles" ON public.user_psychological_profiles;
CREATE POLICY "Admins can view all psychological profiles" ON public.user_psychological_profiles FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all catechism progress" ON public.catechism_paragraphs_read;
CREATE POLICY "Admins can view all catechism progress" ON public.catechism_paragraphs_read FOR SELECT TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage SEO settings" ON public.seo_settings;
CREATE POLICY "Admins can manage SEO settings" ON public.seo_settings FOR ALL TO authenticated USING (auth_internal.is_admin());

DROP POLICY IF EXISTS "Admins can manage keywords" ON public.site_keywords;
CREATE POLICY "Admins can manage keywords" ON public.site_keywords FOR ALL TO authenticated USING (auth_internal.is_admin());

DROP POLICY IF EXISTS "Admins can manage community_posts" ON public.community_posts;
CREATE POLICY "Admins can manage community_posts" ON public.community_posts FOR ALL TO authenticated USING (auth_internal.is_admin());

DROP POLICY IF EXISTS "Admins can view all metrics" ON public.app_metrics;
CREATE POLICY "Admins can view all metrics" ON public.app_metrics FOR SELECT TO authenticated USING (auth_internal.is_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth_internal.can_update_own_profile(id, role, is_premium, NULL::text));

-- 5. Drop old public functions with CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.can_update_own_profile(uuid, text, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_last_action_at() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_profile_security() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_admin_role_from_profile() CASCADE;
DROP FUNCTION IF EXISTS public.update_last_action_at_from_metrics() CASCADE;
DROP FUNCTION IF EXISTS public.sync_content_tags_to_array() CASCADE;

-- 6. Grant execute on auth_internal functions to authenticated and service_role
GRANT EXECUTE ON FUNCTION auth_internal.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.can_update_own_profile(uuid, text, boolean, text) TO authenticated, service_role;
-- Grant trigger functions execute
GRANT EXECUTE ON FUNCTION auth_internal.update_last_action_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.enforce_profile_security() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.prevent_role_escalation() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.handle_new_user() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.sync_admin_role_from_profile() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.update_last_action_at_from_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth_internal.sync_content_tags_to_array() TO authenticated, service_role;

-- 7. Ensure search_path is set for all public functions to satisfy linter
DO $$
DECLARE
    func_record record;
BEGIN
    FOR func_record IN 
        SELECT p.proname, n.nspname, pg_get_function_identity_arguments(p.oid) as ident_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', func_record.nspname, func_record.proname, func_record.ident_args);
    END LOOP;
END $$;
