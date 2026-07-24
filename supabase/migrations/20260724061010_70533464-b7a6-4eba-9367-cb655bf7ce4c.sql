INSERT INTO public.nexus_relation_types (code, label_pt, description, provisional, sort_order) VALUES
  ('wrote', 'Escreveu', 'Relação entre santo e obra escrita', false, 20),
  ('exemplifies', 'Exemplifica', 'Santo como testemunho de uma virtude ou caminho espiritual', false, 21),
  ('related_to', 'Relacionado a', 'Relação contextual entre entidades', true, 22),
  ('inspired_by', 'Inspirado por', 'Influência espiritual ou intelectual', true, 23)
ON CONFLICT (code) DO NOTHING;