
-- Enforce workflow states
ALTER TABLE public.nexus_contributions
  DROP CONSTRAINT IF EXISTS nexus_contributions_status_check;
ALTER TABLE public.nexus_contributions
  ADD CONSTRAINT nexus_contributions_status_check
  CHECK (status IN ('pending','approved','rejected'));

-- Approve function with notification
CREATE OR REPLACE FUNCTION public.approve_nexus_contribution(_contribution_id uuid, _reviewer_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _c public.nexus_contributions%ROWTYPE;
  _verse_id text;
  _new_id uuid;
BEGIN
  IF NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO _c FROM public.nexus_contributions WHERE id = _contribution_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'contribution_not_found'; END IF;
  IF _c.status = 'approved' THEN RAISE EXCEPTION 'already_approved'; END IF;

  _verse_id := _c.book_abbr || '-' || _c.chapter::text || '-' || COALESCE(_c.verse::text, '1');

  INSERT INTO public.bible_connections (
    verse_id, category, reference_title, reference_id, summary,
    source, created_by, updated_by, book_abbr, chapter, verse,
    approved_from_contribution, editor_notes
  ) VALUES (
    _verse_id, _c.connection_type, _c.reference_title, _c.reference_id, _c.summary,
    'contribution', auth.uid(), auth.uid(), _c.book_abbr, _c.chapter, _c.verse,
    _c.id, _reviewer_notes
  ) RETURNING id INTO _new_id;

  UPDATE public.nexus_contributions
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = COALESCE(_reviewer_notes, reviewer_notes),
      updated_at = now()
  WHERE id = _contribution_id;

  IF _c.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, source_user_id, type, title, message, link)
    VALUES (
      _c.user_id, auth.uid(), 'system',
      'Contribuição aprovada',
      'Sua sugestão para ' || _c.book_abbr || ' ' || _c.chapter::text ||
        COALESCE(':' || _c.verse::text, '') || ' foi aprovada.' ||
        COALESCE(E'\nNota do revisor: ' || _reviewer_notes, ''),
      '/bible?book=' || _c.book_abbr || '&ch=' || _c.chapter::text
    );
  END IF;

  RETURN _new_id;
END;
$function$;

-- Reject function with notification
CREATE OR REPLACE FUNCTION public.reject_nexus_contribution(_contribution_id uuid, _reviewer_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _c public.nexus_contributions%ROWTYPE;
BEGIN
  IF NOT auth_internal.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO _c FROM public.nexus_contributions WHERE id = _contribution_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'contribution_not_found'; END IF;

  UPDATE public.nexus_contributions
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reviewer_notes = COALESCE(_reviewer_notes, reviewer_notes),
      updated_at = now()
  WHERE id = _contribution_id;

  IF _c.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, source_user_id, type, title, message, link)
    VALUES (
      _c.user_id, auth.uid(), 'system',
      'Contribuição não aprovada',
      'Sua sugestão para ' || _c.book_abbr || ' ' || _c.chapter::text ||
        COALESCE(':' || _c.verse::text, '') || ' não foi aprovada desta vez.' ||
        COALESCE(E'\nNota do revisor: ' || _reviewer_notes, ''),
      '/bible?book=' || _c.book_abbr || '&ch=' || _c.chapter::text
    );
  END IF;
END;
$function$;
