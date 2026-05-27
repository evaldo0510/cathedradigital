
-- 1. community_posts: prevent moderation bypass via status on insert
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
CREATE POLICY "Users can create posts"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
);

-- 2. Remove per-user reading progress table from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.catechism_paragraphs_read;

-- 3. Align admin checks to canonical role source (user_roles via has_role)
DROP POLICY IF EXISTS "Admins can view RLS results" ON public.rls_test_results;
CREATE POLICY "Admins can view RLS results"
ON public.rls_test_results
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view security logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (auth_internal.has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict partner contact_email from public reads (column-level)
REVOKE SELECT (contact_email) ON public.partners FROM anon, authenticated;
