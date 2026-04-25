-- Atualizar categorias e emojis dos temas baseado em TAG_CATEGORIES (frontend)

-- Fundamentos da Fé
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '✝️') WHERE slug = 'fe';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '❤️') WHERE slug = 'amor';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '🕊️') WHERE slug = 'esperanca';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '💧') WHERE slug = 'graca';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '🔥') WHERE slug = 'verdade';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '🦅') WHERE slug = 'liberdade';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '✨') WHERE slug = 'santidade';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '⚔️') WHERE slug = 'pecado';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '🤲') WHERE slug = 'perdao';
UPDATE public.themes SET category = 'Fundamentos', emoji = COALESCE(NULLIF(emoji,''), '🙏') WHERE slug = 'oracao';

-- Dores e Busca
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '😰') WHERE slug = 'ansiedade';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '😨') WHERE slug = 'medo';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '😔') WHERE slug = 'culpa';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '😞') WHERE slug = 'desanimo';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '🕳️') WHERE slug = 'vazio';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '🌑') WHERE slug = 'solidao';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '🥀') WHERE slug = 'sofrimento';
UPDATE public.themes SET category = 'Dores', emoji = COALESCE(NULLIF(emoji,''), '💜') WHERE slug = 'ferida_interior';

-- Mistério Divino
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '👑') WHERE slug = 'deus';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '✝️') WHERE slug = 'jesus';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '🔥') WHERE slug = 'espirito_santo';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '🔄') WHERE slug = 'conversao';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '📢') WHERE slug = 'vocacao';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '🌍') WHERE slug = 'missao';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '🫶') WHERE slug = 'caridade';
UPDATE public.themes SET category = 'Divino', emoji = COALESCE(NULLIF(emoji,''), '🤍') WHERE slug = 'misericordia';

-- Vida Prática
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '👨‍👩‍👧‍👦') WHERE slug = 'familia';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '🤝') WHERE slug = 'relacionamentos';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '🎯') WHERE slug = 'proposito';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '📏') WHERE slug = 'disciplina';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '🏔️') WHERE slug = 'constancia';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '⏰') WHERE slug = 'rotina';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '📖') WHERE slug = 'sabedoria';
UPDATE public.themes SET category = 'Vida', emoji = COALESCE(NULLIF(emoji,''), '🌾') WHERE slug = 'humildade';

-- Fallback
UPDATE public.themes SET category = 'Geral' WHERE category IS NULL;