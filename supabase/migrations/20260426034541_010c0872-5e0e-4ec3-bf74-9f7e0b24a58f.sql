UPDATE journey_steps 
SET content = content - 'pch' || jsonb_build_object('padh', content->'pch')
WHERE content ? 'pch';