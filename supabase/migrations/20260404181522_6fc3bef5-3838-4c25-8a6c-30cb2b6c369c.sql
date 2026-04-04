-- Create glossary table
CREATE TABLE public.glossary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    category TEXT,
    language TEXT NOT NULL DEFAULT 'pt',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;

-- Create policies for glossary access
CREATE POLICY "Glossary is viewable by everyone" 
ON public.glossary 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage glossary" 
ON public.glossary 
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Function to handle updated_at if it doesn't already exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_glossary_updated_at
BEFORE UPDATE ON public.glossary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial data
INSERT INTO public.glossary (term, definition, category) VALUES
('Transubstanciação', 'A mudança de toda a substância do pão na substância do Corpo de Cristo e de toda a substância do vinho na substância do seu Sangue.', 'Eucaristia'),
('Soteriologia', 'O estudo da doutrina da salvação, focando na obra de Jesus Cristo para redimir a humanidade.', 'Teologia Sistemática'),
('Eclesiologia', 'O estudo teológico da Igreja, sua natureza, estrutura e missão.', 'Igreja'),
('Escatologia', 'O estudo das últimas coisas: a morte, o juízo, o céu e o inferno.', 'Teologia Sistemática'),
('Mariologia', 'O estudo teológico de Maria, a Mãe de Deus, e seu papel na economia da salvação.', 'Teologia Sistemática'),
('Cristologia', 'O estudo da pessoa, natureza e obra de Jesus Cristo.', 'Teologia Sistemática'),
('Pneumatologia', 'O estudo da pessoa e obra do Espírito Santo.', 'Teologia Sistemática'),
('Trindade', 'O mistério central da fé cristã: um só Deus em três Pessoas distintas: Pai, Filho e Espírito Santo.', 'Teologia Sistemática'),
('Graça', 'O dom gratuito e sobrenatural de Deus para a nossa salvação.', 'Teologia da Graça'),
('Sacramento', 'Sinal sensível e eficaz da graça, instituído por Cristo e confiado à Igreja, pelo qual nos é dispensada a vida divina.', 'Sacramentos');
