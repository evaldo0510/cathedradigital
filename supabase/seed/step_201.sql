INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, content) VALUES ('71feb284-a2c1-4cb8-a060-d7aba375b100', 'f0f35259-85b3-44fa-99c1-4f9ec87c9f4d', 7, 'O início da vida', NULL, '{"intro": "Agora que a ferida n\u00e3o te define, a vida pode florescer.", "prayer": "Agrade\u00e7a pela sua pr\u00f3pria exist\u00eancia.", "practice": "Planeje um pequeno gesto de cuidado com voc\u00ea mesmo.", "reflection": "Curar \u00e9, finalmente, come\u00e7ar a viver.", "journal_prompt": "Qual \u00e9 o primeiro passo da sua vida renovada?"}') ON CONFLICT (id) DO UPDATE SET 
    journey_id = EXCLUDED.journey_id,
    step_order = EXCLUDED.step_order,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    content = EXCLUDED.content) ON CONFLICT (id) DO UPDATE SET journey_id = EXCLUDED.journey_id, step_order = EXCLUDED.step_order, title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, content = EXCLUDED.content;