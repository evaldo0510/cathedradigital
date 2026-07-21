
UPDATE public.glossary
SET nexus_refs = '[
  {"kind":"bible","ref":"Rm 5,1-5","label":"A esperança não decepciona"},
  {"kind":"bible","ref":"Hb 11,1","label":"Fundamento da esperança"},
  {"kind":"catechism","ref":"1817","label":"Definição da esperança"},
  {"kind":"catechism","ref":"1818","label":"Alma da vida cristã"},
  {"kind":"prayer","slug":"oracao-pela-sabedoria","label":"Oração pela Sabedoria"}
]'::jsonb
WHERE slug = 'esperanca-crista';
