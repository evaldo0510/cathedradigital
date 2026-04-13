-- Import steps in smaller blocks if necessary. I'll execute the INSERT statements directly.
INSERT INTO public.journey_steps (id, journey_id, step_order, title, subtitle, content) VALUES
('fd0ff1dd-4856-4f51-b2a8-d914ed6a4d19', '051b209e-9985-44da-a832-ca884783cb98', 1, 'A Vontade Adormecida', NULL, '{"intro": "Psicologicamente, a vontade fraca \u00e9 fruto de decis\u00f5es adiadas.", "prayer": "Identifique uma \u00e1rea de pregui\u00e7a e a enfrente.", "practice": "Tome uma pequena decis\u00e3o hoje e cumpra-a imediatamente.", "reflection": "O maior inimigo da virtude n\u00e3o \u00e9 o erro, \u00e9 a in\u00e9rcia.", "journal_prompt": "O que voc\u00ea est\u00e1 evitando decidir?"}'::jsonb),
('d6c3dab7-7d22-4195-92f3-472f6de6bc16', '051b209e-9985-44da-a832-ca884783cb98', 2, 'O Ordenamento dos Afetos', NULL, '{"intro": "Desordem emocional gera ansiedade constante.", "prayer": "Ore pedindo a gra\u00e7a de amar o que \u00e9 eterno.", "practice": "Escolha um objeto em sua casa e o organize conscientemente.", "reflection": "Amar \u00e9 colocar as coisas no seu devido lugar.", "journal_prompt": "Seus amores est\u00e3o em ordem?"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  journey_id = EXCLUDED.journey_id,
  step_order = EXCLUDED.step_order,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  content = EXCLUDED.content;
