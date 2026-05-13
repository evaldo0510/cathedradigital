-- Split composite tags in spiritual_contents
-- We find tags that contain spaces and are NOT exactly 'Espírito Santo'
-- and we split them and add them back as separate elements.

WITH split_tags AS (
  SELECT id, unnest(tags) as tag
  FROM public.spiritual_contents
),
cleaned_tags AS (
  SELECT id, 
         CASE 
           WHEN tag = 'Espírito Santo' THEN ARRAY['Espírito Santo']
           WHEN tag LIKE '% %' THEN string_to_array(tag, ' ')
           ELSE ARRAY[tag]
         END as new_tags
  FROM split_tags
),
aggregated_tags AS (
  SELECT id, array_agg(DISTINCT t) as final_tags
  FROM cleaned_tags, unnest(new_tags) t
  GROUP BY id
)
UPDATE public.spiritual_contents sc
SET tags = at.final_tags
FROM aggregated_tags at
WHERE sc.id = at.id;
