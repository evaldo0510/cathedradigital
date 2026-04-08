
-- ========================================
-- 1. PROFILES: fix roles from public to authenticated
-- ========================================
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
CREATE POLICY "Users can see their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (public.can_update_own_profile(id, role, is_premium, ''));

DROP POLICY IF EXISTS "No direct profile insert" ON public.profiles;
CREATE POLICY "No direct profile insert"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- 2. PUSH_SUBSCRIPTIONS: public -> authenticated
-- ========================================
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ========================================
-- 3. USER_NOTES: public -> authenticated
-- ========================================
DROP POLICY IF EXISTS "Users can view own notes" ON public.user_notes;
CREATE POLICY "Users can view own notes"
ON public.user_notes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notes" ON public.user_notes;
CREATE POLICY "Users can create own notes"
ON public.user_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.user_notes;
CREATE POLICY "Users can update own notes"
ON public.user_notes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.user_notes;
CREATE POLICY "Users can delete own notes"
ON public.user_notes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ========================================
-- 4. APP_METRICS: fix INSERT WITH CHECK (true)
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can create app metrics" ON public.app_metrics;
CREATE POLICY "Authenticated users can create app metrics"
ON public.app_metrics FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
