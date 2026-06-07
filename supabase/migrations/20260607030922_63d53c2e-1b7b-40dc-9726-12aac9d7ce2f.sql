-- Criar tabela de livros
CREATE TABLE public.bible_books (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    abbrev TEXT NOT NULL UNIQUE,
    testament TEXT CHECK (testament IN ('antigo', 'novo')),
    canonical_type TEXT CHECK (canonical_type IN ('protocanonico', 'deuterocanonico')),
    chapters_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de capítulos
CREATE TABLE public.bible_chapters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID NOT NULL REFERENCES public.bible_books(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(book_id, number)
);

-- Criar tabela de versículos
CREATE TABLE public.bible_verses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chapter_id UUID NOT NULL REFERENCES public.bible_chapters(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(chapter_id, number)
);

-- Grant privileges
GRANT SELECT ON public.bible_books TO anon, authenticated;
GRANT SELECT ON public.bible_chapters TO anon, authenticated;
GRANT SELECT ON public.bible_verses TO anon, authenticated;

GRANT ALL ON public.bible_books TO service_role;
GRANT ALL ON public.bible_chapters TO service_role;
GRANT ALL ON public.bible_verses TO service_role;

-- Enable RLS
ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can read bible_books" ON public.bible_books FOR SELECT USING (true);
CREATE POLICY "Public can read bible_chapters" ON public.bible_chapters FOR SELECT USING (true);
CREATE POLICY "Public can read bible_verses" ON public.bible_verses FOR SELECT USING (true);

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = now(); 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bible_books_updated_at BEFORE UPDATE ON public.bible_books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bible_chapters_updated_at BEFORE UPDATE ON public.bible_chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bible_verses_updated_at BEFORE UPDATE ON public.bible_verses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_bible_verses_chapter_id ON public.bible_verses(chapter_id);
CREATE INDEX idx_bible_chapters_book_id ON public.bible_chapters(book_id);
CREATE INDEX idx_bible_books_abbrev ON public.bible_books(abbrev);
