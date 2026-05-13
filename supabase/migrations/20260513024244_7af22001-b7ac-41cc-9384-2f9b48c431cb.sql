-- Fix function search path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Update admin policy to be more explicit
DROP POLICY "Admins can manage nexus synonyms" ON public.nexus_synonyms;

CREATE POLICY "Admins can manage nexus synonyms" 
ON public.nexus_synonyms 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);
