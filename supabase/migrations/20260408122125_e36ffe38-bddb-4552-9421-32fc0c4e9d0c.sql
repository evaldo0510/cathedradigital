
-- app_metrics SELECT
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.app_metrics;
CREATE POLICY "Admins can view all metrics"
ON public.app_metrics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- bible_chapters_read
DROP POLICY IF EXISTS "Users can delete own chapters read" ON public.bible_chapters_read;
CREATE POLICY "Users can delete own chapters read"
ON public.bible_chapters_read FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own chapters read" ON public.bible_chapters_read;
CREATE POLICY "Users can view own chapters read"
ON public.bible_chapters_read FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- colloquium_conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.colloquium_conversations;
CREATE POLICY "Users can delete own conversations"
ON public.colloquium_conversations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.colloquium_conversations;
CREATE POLICY "Users can update own conversations"
ON public.colloquium_conversations FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own conversations" ON public.colloquium_conversations;
CREATE POLICY "Users can view own conversations"
ON public.colloquium_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- colloquium_messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.colloquium_messages;
CREATE POLICY "Users can delete own messages"
ON public.colloquium_messages FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM colloquium_conversations c WHERE c.id = colloquium_messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own messages" ON public.colloquium_messages;
CREATE POLICY "Users can view own messages"
ON public.colloquium_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM colloquium_conversations c WHERE c.id = colloquium_messages.conversation_id AND c.user_id = auth.uid()));

-- community_likes
DROP POLICY IF EXISTS "Anyone authenticated can read likes" ON public.community_likes;
CREATE POLICY "Anyone authenticated can read likes"
ON public.community_likes FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.community_likes;
CREATE POLICY "Users can delete own likes"
ON public.community_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- community_posts
DROP POLICY IF EXISTS "Anyone authenticated can read posts" ON public.community_posts;
CREATE POLICY "Anyone authenticated can read posts"
ON public.community_posts FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
CREATE POLICY "Users can delete own posts"
ON public.community_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts"
ON public.community_posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can view coupons" ON public.coupons;
CREATE POLICY "Only admins can view coupons"
ON public.coupons FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- glossary admin
DROP POLICY IF EXISTS "Admins can manage glossary" ON public.glossary;
CREATE POLICY "Admins can manage glossary"
ON public.glossary FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- journey_progress
DROP POLICY IF EXISTS "Users can delete own journey progress" ON public.journey_progress;
CREATE POLICY "Users can delete own journey progress"
ON public.journey_progress FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own journey progress" ON public.journey_progress;
CREATE POLICY "Users can view own journey progress"
ON public.journey_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- journey_steps admin
DROP POLICY IF EXISTS "Admins can manage journey steps" ON public.journey_steps;
CREATE POLICY "Admins can manage journey steps"
ON public.journey_steps FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- journeys admin
DROP POLICY IF EXISTS "Admins can manage journeys" ON public.journeys;
CREATE POLICY "Admins can manage journeys"
ON public.journeys FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- spiritual_journal
DROP POLICY IF EXISTS "Users can view own journal" ON public.spiritual_journal;
CREATE POLICY "Users can view own journal"
ON public.spiritual_journal FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own journal entries" ON public.spiritual_journal;
CREATE POLICY "Users can create own journal entries"
ON public.spiritual_journal FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.spiritual_journal;
CREATE POLICY "Users can update own journal entries"
ON public.spiritual_journal FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.spiritual_journal;
CREATE POLICY "Users can delete own journal entries"
ON public.spiritual_journal FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- trail_progress
DROP POLICY IF EXISTS "Users can delete own trail progress" ON public.trail_progress;
CREATE POLICY "Users can delete own trail progress"
ON public.trail_progress FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own trail progress" ON public.trail_progress;
CREATE POLICY "Users can view own trail progress"
ON public.trail_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- user_history
DROP POLICY IF EXISTS "Users can delete own history" ON public.user_history;
CREATE POLICY "Users can delete own history"
ON public.user_history FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own history" ON public.user_history;
CREATE POLICY "Users can view own history"
ON public.user_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.user_history;
CREATE POLICY "Users can insert own history"
ON public.user_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- user_sensitive_data
DROP POLICY IF EXISTS "Users can read own sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Users can read own sensitive data"
ON public.user_sensitive_data FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Users can insert own sensitive data"
ON public.user_sensitive_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sensitive data" ON public.user_sensitive_data;
CREATE POLICY "Users can update own sensitive data"
ON public.user_sensitive_data FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
