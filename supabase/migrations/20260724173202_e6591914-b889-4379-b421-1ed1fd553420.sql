
-- ============================================================
-- P0.2.2 · Infraestrutura de importação certificada da Bíblia
-- ============================================================

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.bible_import_phase AS ENUM (
    'A_pentateuco',
    'B_historicos',
    'C_sapienciais',
    'D_profetas',
    'E_novo_testamento'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bible_phase_status AS ENUM (
    'pending',
    'importing',
    'imported',
    'certified',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Mapeamento fixo abbrev -> fase (fonte da verdade)
CREATE TABLE IF NOT EXISTS public.bible_phase_books (
  abbrev TEXT PRIMARY KEY REFERENCES public.bible_books(abbrev) ON UPDATE CASCADE,
  phase  public.bible_import_phase NOT NULL,
  ordinal INT NOT NULL,
  expected_chapters INT NOT NULL
);

GRANT SELECT ON public.bible_phase_books TO anon, authenticated;
GRANT ALL ON public.bible_phase_books TO service_role;
ALTER TABLE public.bible_phase_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read bible_phase_books" ON public.bible_phase_books;
CREATE POLICY "public read bible_phase_books" ON public.bible_phase_books FOR SELECT USING (true);

-- Garantir que todos os 73 livros canônicos existam em bible_books (com chapters_count)
-- Só insere quem falta; não sobrescreve nada.
INSERT INTO public.bible_books (abbrev, name, testament, canonical_type, chapters_count) VALUES
  ('Gn','Gênesis','antigo','protocanonico',50),
  ('Ex','Êxodo','antigo','protocanonico',40),
  ('Lv','Levítico','antigo','protocanonico',27),
  ('Nm','Números','antigo','protocanonico',36),
  ('Dt','Deuteronômio','antigo','protocanonico',34),
  ('Js','Josué','antigo','protocanonico',24),
  ('Jz','Juízes','antigo','protocanonico',21),
  ('Rt','Rute','antigo','protocanonico',4),
  ('1Sm','1 Samuel','antigo','protocanonico',31),
  ('2Sm','2 Samuel','antigo','protocanonico',24),
  ('1Rs','1 Reis','antigo','protocanonico',22),
  ('2Rs','2 Reis','antigo','protocanonico',25),
  ('1Cr','1 Crônicas','antigo','protocanonico',29),
  ('2Cr','2 Crônicas','antigo','protocanonico',36),
  ('Ed','Esdras','antigo','protocanonico',10),
  ('Ne','Neemias','antigo','protocanonico',13),
  ('Et','Ester','antigo','protocanonico',10),
  ('Jó','Jó','antigo','protocanonico',42),
  ('Pv','Provérbios','antigo','protocanonico',31),
  ('Ec','Eclesiastes','antigo','protocanonico',12),
  ('Ct','Cânticos','antigo','protocanonico',8),
  ('Is','Isaías','antigo','protocanonico',66),
  ('Jr','Jeremias','antigo','protocanonico',52),
  ('Lm','Lamentações','antigo','protocanonico',5),
  ('Ez','Ezequiel','antigo','protocanonico',48),
  ('Os','Oseias','antigo','protocanonico',14),
  ('Jl','Joel','antigo','protocanonico',3),
  ('Am','Amós','antigo','protocanonico',9),
  ('Ab','Abdias','antigo','protocanonico',1),
  ('Jn','Jonas','antigo','protocanonico',4),
  ('Mq','Miqueias','antigo','protocanonico',7),
  ('Na','Naum','antigo','protocanonico',3),
  ('Hc','Habacuque','antigo','protocanonico',3),
  ('Sf','Sofonias','antigo','protocanonico',3),
  ('Ag','Ageu','antigo','protocanonico',2),
  ('Zc','Zacarias','antigo','protocanonico',14),
  ('Ml','Malaquias','antigo','protocanonico',4),
  ('Mt','Mateus','novo','protocanonico',28),
  ('Mc','Marcos','novo','protocanonico',16),
  ('Lc','Lucas','novo','protocanonico',24),
  ('Jo','João','novo','protocanonico',21),
  ('At','Atos dos Apóstolos','novo','protocanonico',28),
  ('Rm','Romanos','novo','protocanonico',16),
  ('1Co','1 Coríntios','novo','protocanonico',16),
  ('2Co','2 Coríntios','novo','protocanonico',13),
  ('Gl','Gálatas','novo','protocanonico',6),
  ('Ef','Efésios','novo','protocanonico',6),
  ('Fp','Filipenses','novo','protocanonico',4),
  ('Cl','Colossenses','novo','protocanonico',4),
  ('1Ts','1 Tessalonicenses','novo','protocanonico',5),
  ('2Ts','2 Tessalonicenses','novo','protocanonico',3),
  ('1Tm','1 Timóteo','novo','protocanonico',6),
  ('2Tm','2 Timóteo','novo','protocanonico',4),
  ('Tt','Tito','novo','protocanonico',3),
  ('Fm','Filemom','novo','protocanonico',1),
  ('Hb','Hebreus','novo','protocanonico',13),
  ('Tg','Tiago','novo','protocanonico',5),
  ('1Pe','1 Pedro','novo','protocanonico',5),
  ('2Pe','2 Pedro','novo','protocanonico',3),
  ('1Jo','1 João','novo','protocanonico',5),
  ('2Jo','2 João','novo','protocanonico',1),
  ('3Jo','3 João','novo','protocanonico',1),
  ('Jd','Judas','novo','protocanonico',1),
  ('Ap','Apocalipse','novo','protocanonico',22)
ON CONFLICT (abbrev) DO NOTHING;

-- Mapear as 73 abreviações -> fase + ordinal + capítulos esperados
INSERT INTO public.bible_phase_books (abbrev, phase, ordinal, expected_chapters) VALUES
  -- Fase A · Pentateuco (5)
  ('Gn','A_pentateuco',1,50),('Ex','A_pentateuco',2,40),('Lv','A_pentateuco',3,27),
  ('Nm','A_pentateuco',4,36),('Dt','A_pentateuco',5,34),
  -- Fase B · Históricos (16, inclui Tb, Jdt, 1Mc, 2Mc)
  ('Js','B_historicos',1,24),('Jz','B_historicos',2,21),('Rt','B_historicos',3,4),
  ('1Sm','B_historicos',4,31),('2Sm','B_historicos',5,24),
  ('1Rs','B_historicos',6,22),('2Rs','B_historicos',7,25),
  ('1Cr','B_historicos',8,29),('2Cr','B_historicos',9,36),
  ('Ed','B_historicos',10,10),('Ne','B_historicos',11,13),
  ('Tb','B_historicos',12,14),('Jdt','B_historicos',13,16),('Et','B_historicos',14,10),
  ('1Mc','B_historicos',15,16),('2Mc','B_historicos',16,15),
  -- Fase C · Sapienciais (7, inclui Sb e Eclo)
  ('Jó','C_sapienciais',1,42),('Sl','C_sapienciais',2,150),('Pv','C_sapienciais',3,31),
  ('Ec','C_sapienciais',4,12),('Ct','C_sapienciais',5,8),
  ('Sb','C_sapienciais',6,19),('Eclo','C_sapienciais',7,51),
  -- Fase D · Profetas (18, inclui Br)
  ('Is','D_profetas',1,66),('Jr','D_profetas',2,52),('Lm','D_profetas',3,5),
  ('Br','D_profetas',4,6),('Ez','D_profetas',5,48),('Dn','D_profetas',6,14),
  ('Os','D_profetas',7,14),('Jl','D_profetas',8,3),('Am','D_profetas',9,9),
  ('Ab','D_profetas',10,1),('Jn','D_profetas',11,4),('Mq','D_profetas',12,7),
  ('Na','D_profetas',13,3),('Hc','D_profetas',14,3),('Sf','D_profetas',15,3),
  ('Ag','D_profetas',16,2),('Zc','D_profetas',17,14),('Ml','D_profetas',18,4),
  -- Fase E · Novo Testamento (27)
  ('Mt','E_novo_testamento',1,28),('Mc','E_novo_testamento',2,16),('Lc','E_novo_testamento',3,24),
  ('Jo','E_novo_testamento',4,21),('At','E_novo_testamento',5,28),
  ('Rm','E_novo_testamento',6,16),('1Co','E_novo_testamento',7,16),('2Co','E_novo_testamento',8,13),
  ('Gl','E_novo_testamento',9,6),('Ef','E_novo_testamento',10,6),('Fp','E_novo_testamento',11,4),
  ('Cl','E_novo_testamento',12,4),('1Ts','E_novo_testamento',13,5),('2Ts','E_novo_testamento',14,3),
  ('1Tm','E_novo_testamento',15,6),('2Tm','E_novo_testamento',16,4),('Tt','E_novo_testamento',17,3),
  ('Fm','E_novo_testamento',18,1),('Hb','E_novo_testamento',19,13),
  ('Tg','E_novo_testamento',20,5),('1Pe','E_novo_testamento',21,5),('2Pe','E_novo_testamento',22,3),
  ('1Jo','E_novo_testamento',23,5),('2Jo','E_novo_testamento',24,1),('3Jo','E_novo_testamento',25,1),
  ('Jd','E_novo_testamento',26,1),('Ap','E_novo_testamento',27,22)
ON CONFLICT (abbrev) DO UPDATE
  SET phase = EXCLUDED.phase,
      ordinal = EXCLUDED.ordinal,
      expected_chapters = EXCLUDED.expected_chapters;

-- 3) Status por tradução × fase
CREATE TABLE IF NOT EXISTS public.bible_translation_phase_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID NOT NULL REFERENCES public.bible_translation_sources(id) ON DELETE CASCADE,
  phase public.bible_import_phase NOT NULL,
  status public.bible_phase_status NOT NULL DEFAULT 'pending',
  import_started_at TIMESTAMPTZ,
  import_completed_at TIMESTAMPTZ,
  certified_at TIMESTAMPTZ,
  certified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Checklist (todos precisam ser true para permitir status='certified')
  check_verses BOOLEAN NOT NULL DEFAULT false,
  check_references BOOLEAN NOT NULL DEFAULT false,
  check_nexus BOOLEAN NOT NULL DEFAULT false,
  check_popovers BOOLEAN NOT NULL DEFAULT false,
  check_reader BOOLEAN NOT NULL DEFAULT false,
  check_navigation BOOLEAN NOT NULL DEFAULT false,
  check_continuity BOOLEAN NOT NULL DEFAULT false,
  ice_score INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (translation_id, phase)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bible_translation_phase_status TO authenticated;
GRANT ALL ON public.bible_translation_phase_status TO service_role;
ALTER TABLE public.bible_translation_phase_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage phase status" ON public.bible_translation_phase_status;
CREATE POLICY "admin manage phase status" ON public.bible_translation_phase_status
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "authenticated read phase status" ON public.bible_translation_phase_status;
CREATE POLICY "authenticated read phase status" ON public.bible_translation_phase_status
  FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE TRIGGER trg_phase_status_updated_at
  BEFORE UPDATE ON public.bible_translation_phase_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Gate de certificação: só permite status='certified' se checklist toda true e ICE >= 95
CREATE OR REPLACE FUNCTION public.enforce_phase_certification_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'certified' THEN
    IF NOT (NEW.check_verses AND NEW.check_references AND NEW.check_nexus
        AND NEW.check_popovers AND NEW.check_reader AND NEW.check_navigation
        AND NEW.check_continuity) THEN
      RAISE EXCEPTION 'Não é possível certificar a fase % — checklist incompleto.', NEW.phase
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.ice_score IS NULL OR NEW.ice_score < 95 THEN
      RAISE EXCEPTION 'Não é possível certificar a fase % — ICE (% ) < 95.', NEW.phase, NEW.ice_score
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.certified_at IS NULL THEN NEW.certified_at := now(); END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_phase_cert_gate ON public.bible_translation_phase_status;
CREATE TRIGGER trg_enforce_phase_cert_gate
  BEFORE INSERT OR UPDATE ON public.bible_translation_phase_status
  FOR EACH ROW EXECUTE FUNCTION public.enforce_phase_certification_gate();

-- 4) Função de progresso por fase para uma tradução
CREATE OR REPLACE FUNCTION public.get_translation_progress(_translation_id UUID)
RETURNS TABLE (
  phase public.bible_import_phase,
  expected_books INT,
  expected_chapters INT,
  actual_books INT,
  actual_chapters INT,
  actual_verses BIGINT,
  status public.bible_phase_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH expected AS (
    SELECT pb.phase,
           COUNT(*)::INT AS expected_books,
           SUM(pb.expected_chapters)::INT AS expected_chapters
    FROM public.bible_phase_books pb
    GROUP BY pb.phase
  ),
  actual AS (
    SELECT pb.phase,
           COUNT(DISTINCT bb.id)::INT AS actual_books,
           COUNT(DISTINCT bc.id)::INT AS actual_chapters,
           COUNT(bv.id) AS actual_verses
    FROM public.bible_phase_books pb
    JOIN public.bible_books bb ON bb.abbrev = pb.abbrev
    LEFT JOIN public.bible_chapters bc ON bc.book_id = bb.id
    LEFT JOIN public.bible_verses bv
      ON bv.chapter_id = bc.id AND bv.translation_id = _translation_id
    GROUP BY pb.phase
  )
  SELECT e.phase,
         e.expected_books,
         e.expected_chapters,
         COALESCE(a.actual_books, 0),
         COALESCE(a.actual_chapters, 0),
         COALESCE(a.actual_verses, 0),
         COALESCE(s.status, 'pending'::public.bible_phase_status)
  FROM expected e
  LEFT JOIN actual a ON a.phase = e.phase
  LEFT JOIN public.bible_translation_phase_status s
    ON s.phase = e.phase AND s.translation_id = _translation_id
  ORDER BY e.phase;
$$;

GRANT EXECUTE ON FUNCTION public.get_translation_progress(UUID) TO authenticated, service_role;

-- 5) Resumo global (todas as traduções × fases) para o painel
CREATE OR REPLACE FUNCTION public.get_bible_phase_summary()
RETURNS TABLE (
  translation_id UUID,
  translation_code TEXT,
  translation_name TEXT,
  translation_status TEXT,
  is_primary BOOLEAN,
  phase public.bible_import_phase,
  expected_books INT,
  expected_chapters INT,
  actual_books INT,
  actual_chapters INT,
  actual_verses BIGINT,
  status public.bible_phase_status,
  certified_at TIMESTAMPTZ,
  ice_score INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ts.id, ts.code, ts.name, ts.status::TEXT, ts.is_primary,
         p.phase, p.expected_books, p.expected_chapters,
         p.actual_books, p.actual_chapters, p.actual_verses,
         p.status,
         s.certified_at, s.ice_score
  FROM public.bible_translation_sources ts
  CROSS JOIN LATERAL public.get_translation_progress(ts.id) p
  LEFT JOIN public.bible_translation_phase_status s
    ON s.translation_id = ts.id AND s.phase = p.phase
  ORDER BY ts.is_primary DESC, ts.name, p.phase;
$$;

GRANT EXECUTE ON FUNCTION public.get_bible_phase_summary() TO authenticated, service_role;
