
-- Editorial Engine · wrappers genéricos por entidade.
-- Nenhuma função existente é alterada; wrappers delegam para o gerador legado da entidade.

CREATE OR REPLACE FUNCTION public.editorial_coverage(_entity text)
RETURNS TABLE (
  area text, total bigint, gold bigint, silver bigint, bronze bigint,
  review bigint, avg_ice numeric, gate_passing bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _entity = 'glossary' THEN
    RETURN QUERY SELECT * FROM public.glossary_doctrinal_coverage();
  ELSE
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_correction_priority(_entity text)
RETURNS TABLE (
  slug text, term text, area text, status text,
  ice numeric, editorial numeric, nexus numeric,
  missing_deep boolean, missing_faq boolean, missing_logos boolean,
  missing_bible boolean, missing_cic boolean, missing_fathers boolean,
  missing_count integer, effort_tier text,
  inbound_refs integer, impact_tier text, priority text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _entity = 'glossary' THEN
    RETURN QUERY SELECT * FROM public.glossary_correction_priority();
  ELSE
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.editorial_quality_gate(_entity text, _slug text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _entity = 'glossary' THEN
    RETURN public.glossary_quality_gate(_slug);
  ELSE
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.editorial_coverage(text)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.editorial_correction_priority(text)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.editorial_quality_gate(text, text)    TO authenticated, service_role;

COMMENT ON FUNCTION public.editorial_coverage(text)            IS 'Editorial Engine · cobertura por macroárea. Roteia por entidade.';
COMMENT ON FUNCTION public.editorial_correction_priority(text) IS 'Editorial Engine · prioridade de correção. Roteia por entidade.';
COMMENT ON FUNCTION public.editorial_quality_gate(text, text)  IS 'Editorial Engine · gate oficial. Roteia por entidade.';
