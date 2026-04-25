-- Optimize role checks by using has_role instead of recursive profile queries
-- This prevents potential performance issues and circular dependencies

-- 1. user_sensitive_data
DROP POLICY IF EXISTS "Admins can read all sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Admins can read all sensitive data" 
ON public.user_sensitive_data FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. spiritual_journal
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.spiritual_journal;
CREATE POLICY "Admins can view all journal entries" 
ON public.spiritual_journal FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. user_notes
DROP POLICY IF EXISTS "Admins can view all user notes" ON public.user_notes;
CREATE POLICY "Admins can view all user notes" 
ON public.user_notes FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. user_history
DROP POLICY IF EXISTS "Admins can view all user history" ON public.user_history;
CREATE POLICY "Admins can view all user history" 
ON public.user_history FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. journey_progress
DROP POLICY IF EXISTS "Admins can view all journey progress" ON public.journey_progress;
CREATE POLICY "Admins can view all journey progress" 
ON public.journey_progress FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. bible_chapters_read
DROP POLICY IF EXISTS "Admins can view all chapters read" ON public.bible_chapters_read;
CREATE POLICY "Admins can view all chapters read" 
ON public.bible_chapters_read FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 7. user_psychological_profiles (Add admin access)
DROP POLICY IF EXISTS "Admins can view all psychological profiles" ON public.user_psychological_profiles;
CREATE POLICY "Admins can view all psychological profiles" 
ON public.user_psychological_profiles FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 8. catechism_paragraphs_read (Add admin access)
DROP POLICY IF EXISTS "Admins can view all catechism progress" ON public.catechism_paragraphs_read;
CREATE POLICY "Admins can view all catechism progress" 
ON public.catechism_paragraphs_read FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Update profiles UPDATE policy to be more robust
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (public.can_update_own_profile(id, role, is_premium, NULL));
