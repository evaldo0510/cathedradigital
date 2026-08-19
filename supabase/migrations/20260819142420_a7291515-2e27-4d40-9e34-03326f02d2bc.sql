CREATE OR REPLACE FUNCTION public.protect_community_post_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.likes_count := OLD.likes_count;
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    IF NEW.content IS DISTINCT FROM OLD.content THEN
      NEW.status := 'pending';
    ELSE
      NEW.status := OLD.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON public.community_posts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

REVOKE ALL ON public.profile_update_rate FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profile_update_rate FROM authenticated;
GRANT SELECT ON public.profile_update_rate TO authenticated;
GRANT ALL ON public.profile_update_rate TO service_role;