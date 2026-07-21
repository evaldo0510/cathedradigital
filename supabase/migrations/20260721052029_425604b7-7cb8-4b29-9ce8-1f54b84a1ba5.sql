
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
DECLARE
  agg_id uuid; new_prayer_id uuid; new_section_id uuid; src_section_slug text;
  hour_record RECORD; section_record RECORD; block_record RECORD;
  hours jsonb := jsonb_build_array(
    jsonb_build_object('slug','breviario-oficio-leituras','title','Ofício das Leituras','subtitle','Escuta orante da Palavra','src_section','oficio','hour_slug','oficio','recommended_time','any','window_start','04:00','window_end','23:00','order_index',60),
    jsonb_build_object('slug','breviario-laudes','title','Laudes — Oração da Manhã','subtitle','Consagração matinal a Deus','src_section','laudes','hour_slug','laudes','recommended_time','morning','window_start','05:00','window_end','10:00','order_index',61),
    jsonb_build_object('slug','breviario-hora-media','title','Hora Média — Meio-dia','subtitle','Pausa orante ao longo do dia','src_section','sexta','hour_slug','hora-media','recommended_time','midday','window_start','11:00','window_end','15:00','order_index',62),
    jsonb_build_object('slug','breviario-vesperas','title','Vésperas — Oração da Tarde','subtitle','Ação de graças ao entardecer','src_section','vesperas','hour_slug','vesperas','recommended_time','evening','window_start','16:30','window_end','20:00','order_index',63),
    jsonb_build_object('slug','breviario-completas','title','Completas — Antes de Dormir','subtitle','Descansar em Deus antes do repouso','src_section','completas','hour_slug','completas','recommended_time','night','window_start','20:00','window_end','23:59','order_index',64)
  );
BEGIN
  SELECT id INTO agg_id FROM public.prayers WHERE slug = 'liturgia-das-horas' LIMIT 1;
  IF agg_id IS NULL THEN RAISE NOTICE 'agregada não encontrada'; RETURN; END IF;

  FOR hour_record IN SELECT * FROM jsonb_array_elements(hours) LOOP
    INSERT INTO public.prayers (
      slug, title, subtitle, kicker, category, content,
      is_published, engine_version, content_status, order_index, meta, tags
    ) VALUES (
      hour_record.value->>'slug', hour_record.value->>'title', hour_record.value->>'subtitle',
      'Liturgia das Horas', 'momentos_do_dia', '',
      true, 2, 'complete', (hour_record.value->>'order_index')::int,
      jsonb_build_object(
        'hour_slug', hour_record.value->>'hour_slug',
        'recommended_time', hour_record.value->>'recommended_time',
        'window_start', hour_record.value->>'window_start',
        'window_end', hour_record.value->>'window_end',
        'aggregate_slug','liturgia-das-horas',
        'auto_injects_proper', true
      ),
      ARRAY['liturgia-das-horas','breviario','oficio-divino']
    )
    ON CONFLICT (slug) DO UPDATE SET
      title=EXCLUDED.title, subtitle=EXCLUDED.subtitle, kicker=EXCLUDED.kicker,
      category=EXCLUDED.category, is_published=true, engine_version=2,
      content_status='complete', order_index=EXCLUDED.order_index,
      meta = public.prayers.meta || EXCLUDED.meta, tags=EXCLUDED.tags, updated_at=now()
    RETURNING id INTO new_prayer_id;

    IF NOT EXISTS (SELECT 1 FROM public.prayer_sections WHERE prayer_id = new_prayer_id) THEN
      src_section_slug := hour_record.value->>'src_section';
      FOR section_record IN
        SELECT * FROM public.prayer_sections WHERE prayer_id = agg_id AND slug = src_section_slug
      LOOP
        INSERT INTO public.prayer_sections (prayer_id, slug, title, subtitle, order_index, weekdays, meta)
        VALUES (new_prayer_id, 'ordinario', section_record.title, section_record.subtitle, 0, section_record.weekdays,
          coalesce(section_record.meta,'{}'::jsonb) || jsonb_build_object('source_prayer','liturgia-das-horas','source_section',section_record.slug))
        RETURNING id INTO new_section_id;

        FOR block_record IN SELECT * FROM public.prayer_blocks WHERE section_id = section_record.id ORDER BY order_index LOOP
          INSERT INTO public.prayer_blocks (prayer_id, section_id, mystery_id, slug, type, title, content, repeat_count, audio_key, order_index, meta)
          VALUES (new_prayer_id, new_section_id, block_record.mystery_id, block_record.slug, block_record.type, block_record.title,
            block_record.content, block_record.repeat_count, block_record.audio_key, block_record.order_index,
            coalesce(block_record.meta,'{}'::jsonb) || jsonb_build_object('origin','ordinario','source_block_id',block_record.id::text));
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;
END $$;
