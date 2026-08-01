
CREATE OR REPLACE FUNCTION public.protect_community_post_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.likes_count := OLD.likes_count;
    NEW.user_id := OLD.user_id;
    NEW.status := OLD.status;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_community_post_fields_trg ON public.community_posts;
CREATE TRIGGER protect_community_post_fields_trg
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.protect_community_post_fields();
