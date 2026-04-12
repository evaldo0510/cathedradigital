-- 1. Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create spiritual_contents table
-- This serves as a "virtual" or "unified" view/base
CREATE TABLE public.spiritual_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bible', 'catechism', 'magisterium', 'journey')),
  reference_id TEXT, -- ID in original table if applicable
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create junction table for content tagging
CREATE TABLE public.content_tags (
  content_id UUID REFERENCES public.spiritual_contents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

-- 4. Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiritual_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "Tags are viewable by everyone" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Contents are viewable by everyone" ON public.spiritual_contents FOR SELECT USING (true);
CREATE POLICY "Content tags are viewable by everyone" ON public.content_tags FOR SELECT USING (true);

-- 6. Seed initial tags (from tagNormalization.ts)
INSERT INTO public.tags (slug, label, emoji, category) VALUES
('fe', 'Fé', '✝️', 'fundamentos'),
('amor', 'Amor', '❤️', 'fundamentos'),
('esperanca', 'Esperança', '🕊️', 'fundamentos'),
('graca', 'Graça', '💧', 'fundamentos'),
('verdade', 'Verdade', '🔥', 'fundamentos'),
('liberdade', 'Liberdade', '🦅', 'fundamentos'),
('santidade', 'Santidade', '✨', 'fundamentos'),
('pecado', 'Pecado', '⚔️', 'fundamentos'),
('perdao', 'Perdão', '🤲', 'fundamentos'),
('oracao', 'Oração', '🙏', 'fundamentos'),
('ansiedade', 'Ansiedade', '😰', 'dores'),
('medo', 'Medo', '😨', 'dores'),
('culpa', 'Culpa', '😔', 'dores'),
('desanimo', 'Desânimo', '😞', 'dores'),
('vazio', 'Vazio', '🕳️', 'dores'),
('solidao', 'Solidão', '🌑', 'dores'),
('sofrimento', 'Sofrimento', '🥀', 'dores'),
('ferida_interior', 'Ferida Interior', '💜', 'dores'),
('deus', 'Deus', '👑', 'divino'),
('jesus', 'Jesus', '✝️', 'divino'),
('espirito_santo', 'Espírito Santo', '🔥', 'divino'),
('conversao', 'Conversão', '🔄', 'divino'),
('vocacao', 'Vocação', '📢', 'divino'),
('missao', 'Missão', '🌍', 'divino'),
('caridade', 'Caridade', '🫶', 'divino'),
('misericordia', 'Misericórdia', '🤍', 'divino'),
('familia', 'Família', '👨‍👩‍👧‍👦', 'vida'),
('relacionamentos', 'Relacionamentos', '🤝', 'vida'),
('proposito', 'Propósito', '🎯', 'vida'),
('disciplina', 'Disciplina', '📏', 'vida'),
('constancia', 'Constância', '🏔️', 'vida'),
('rotina', 'Rotina', '⏰', 'vida'),
('sabedoria', 'Sabedoria', '📖', 'vida'),
('humildade', 'Humildade', '🌾', 'vida');
