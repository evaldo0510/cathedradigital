-- Add status to community_posts if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='community_posts' AND column_name='status') THEN
        ALTER TABLE public.community_posts ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Drop and recreate the admin policy for community_posts if it existed or just create it
DROP POLICY IF EXISTS "Admins can manage community_posts" ON public.community_posts;
CREATE POLICY "Admins can manage community_posts" 
ON public.community_posts 
FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Ensure user_roles has admin policy
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles" 
ON public.user_roles 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
