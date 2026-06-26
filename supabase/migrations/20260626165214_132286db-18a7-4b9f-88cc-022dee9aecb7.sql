
-- ============================================================================
-- bible_detect_english_verses
-- Varre bible_verses procurando contaminação por inglês.
-- Retorna versículos cujo texto contém >= min_hits palavras-chave inglesas.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.bible_detect_english_verses(
  p_min_hits INTEGER DEFAULT 2,
  p_abbrev TEXT DEFAULT NULL
)
RETURNS TABLE(
  book_id UUID,
  abbrev TEXT,
  book_name TEXT,
  chapter_number INTEGER,
  verse_number INTEGER,
  hit_count INTEGER,
  sample TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_min_hits < 1 OR p_min_hits > 20 THEN
    RAISE EXCEPTION 'p_min_hits must be between 1 and 20';
  END IF;

  RETURN QUERY
  WITH scanned AS (
    SELECT
      b.id          AS book_id,
      b.abbrev      AS abbrev,
      b.name        AS book_name,
      c.number      AS chapter_number,
      v.number      AS verse_number,
      v.text        AS text,
      -- Conta ocorrências distintas de palavras inglesas comuns
      (
        (CASE WHEN v.text ~* '\mthe\M'      THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mshall\M'    THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\munto\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mupon\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mfrom\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mwhich\M'    THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mthem\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mwith\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\msaid\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mking\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mwent\M'     THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mgathered\M' THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mforces\M'   THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mchapter\M'  THEN 1 ELSE 0 END) +
        (CASE WHEN v.text ~* '\mverse\M'    THEN 1 ELSE 0 END)
      ) AS hit_count
    FROM public.bible_verses v
    JOIN public.bible_chapters c ON c.id = v.chapter_id
    JOIN public.bible_books    b ON b.id = c.book_id
    WHERE (p_abbrev IS NULL OR b.abbrev = p_abbrev)
      AND v.text IS NOT NULL
      AND length(v.text) >= 12
  )
  SELECT
    s.book_id,
    s.abbrev,
    s.book_name,
    s.chapter_number,
    s.verse_number,
    s.hit_count,
    LEFT(s.text, 160) AS sample
  FROM scanned s
  WHERE s.hit_count >= p_min_hits
  ORDER BY s.abbrev, s.chapter_number, s.verse_number;
END;
$$;

REVOKE ALL ON FUNCTION public.bible_detect_english_verses(INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_detect_english_verses(INTEGER, TEXT) TO authenticated, service_role;

-- ============================================================================
-- bible_canonical_coverage
-- Matriz de cobertura dos 73 livros do cânon católico.
-- Combinada com a tabela do cânon, retorna: esperado vs presente, total de
-- versículos, contaminação por inglês e status agregado.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.bible_canonical_coverage()
RETURNS TABLE(
  abbrev TEXT,
  name TEXT,
  testament TEXT,
  canonical_type TEXT,
  expected_chapters INTEGER,
  chapters_present INTEGER,
  verses_total INTEGER,
  english_verse_count INTEGER,
  coverage_pct NUMERIC,
  status TEXT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH canon(abbrev, name, expected_chapters, testament, canonical_type) AS (
    VALUES
      ('Gn','Gênesis',50,'antigo','protocanonico'),
      ('Ex','Êxodo',40,'antigo','protocanonico'),
      ('Lv','Levítico',27,'antigo','protocanonico'),
      ('Nm','Números',36,'antigo','protocanonico'),
      ('Dt','Deuteronômio',34,'antigo','protocanonico'),
      ('Js','Josué',24,'antigo','protocanonico'),
      ('Jz','Juízes',21,'antigo','protocanonico'),
      ('Rt','Rute',4,'antigo','protocanonico'),
      ('1Sm','1 Samuel',31,'antigo','protocanonico'),
      ('2Sm','2 Samuel',24,'antigo','protocanonico'),
      ('1Rs','1 Reis',22,'antigo','protocanonico'),
      ('2Rs','2 Reis',25,'antigo','protocanonico'),
      ('1Cr','1 Crônicas',29,'antigo','protocanonico'),
      ('2Cr','2 Crônicas',36,'antigo','protocanonico'),
      ('Ed','Esdras',10,'antigo','protocanonico'),
      ('Ne','Neemias',13,'antigo','protocanonico'),
      ('Tb','Tobias',14,'antigo','deuterocanonico'),
      ('Jdt','Judite',16,'antigo','deuterocanonico'),
      ('Et','Ester',10,'antigo','protocanonico'),
      ('1Mc','1 Macabeus',16,'antigo','deuterocanonico'),
      ('2Mc','2 Macabeus',15,'antigo','deuterocanonico'),
      ('Jó','Jó',42,'antigo','protocanonico'),
      ('Sl','Salmos',150,'antigo','protocanonico'),
      ('Pv','Provérbios',31,'antigo','protocanonico'),
      ('Ec','Eclesiastes',12,'antigo','protocanonico'),
      ('Ct','Cântico dos Cânticos',8,'antigo','protocanonico'),
      ('Sb','Sabedoria',19,'antigo','deuterocanonico'),
      ('Eclo','Eclesiástico',51,'antigo','deuterocanonico'),
      ('Is','Isaías',66,'antigo','protocanonico'),
      ('Jr','Jeremias',52,'antigo','protocanonico'),
      ('Lm','Lamentações',5,'antigo','protocanonico'),
      ('Br','Baruc',6,'antigo','deuterocanonico'),
      ('Ez','Ezequiel',48,'antigo','protocanonico'),
      ('Dn','Daniel',14,'antigo','protocanonico'),
      ('Os','Oseias',14,'antigo','protocanonico'),
      ('Jl','Joel',3,'antigo','protocanonico'),
      ('Am','Amós',9,'antigo','protocanonico'),
      ('Ab','Abdias',1,'antigo','protocanonico'),
      ('Jn','Jonas',4,'antigo','protocanonico'),
      ('Mq','Miqueias',7,'antigo','protocanonico'),
      ('Na','Naum',3,'antigo','protocanonico'),
      ('Hc','Habacuc',3,'antigo','protocanonico'),
      ('Sf','Sofonias',3,'antigo','protocanonico'),
      ('Ag','Ageu',2,'antigo','protocanonico'),
      ('Zc','Zacarias',14,'antigo','protocanonico'),
      ('Ml','Malaquias',4,'antigo','protocanonico'),
      ('Mt','Mateus',28,'novo','protocanonico'),
      ('Mc','Marcos',16,'novo','protocanonico'),
      ('Lc','Lucas',24,'novo','protocanonico'),
      ('Jo','João',21,'novo','protocanonico'),
      ('At','Atos dos Apóstolos',28,'novo','protocanonico'),
      ('Rm','Romanos',16,'novo','protocanonico'),
      ('1Co','1 Coríntios',16,'novo','protocanonico'),
      ('2Co','2 Coríntios',13,'novo','protocanonico'),
      ('Gl','Gálatas',6,'novo','protocanonico'),
      ('Ef','Efésios',6,'novo','protocanonico'),
      ('Fp','Filipenses',4,'novo','protocanonico'),
      ('Cl','Colossenses',4,'novo','protocanonico'),
      ('1Ts','1 Tessalonicenses',5,'novo','protocanonico'),
      ('2Ts','2 Tessalonicenses',3,'novo','protocanonico'),
      ('1Tm','1 Timóteo',6,'novo','protocanonico'),
      ('2Tm','2 Timóteo',4,'novo','protocanonico'),
      ('Tt','Tito',3,'novo','protocanonico'),
      ('Fm','Filêmon',1,'novo','protocanonico'),
      ('Hb','Hebreus',13,'novo','protocanonico'),
      ('Tg','Tiago',5,'novo','protocanonico'),
      ('1Pe','1 Pedro',5,'novo','protocanonico'),
      ('2Pe','2 Pedro',3,'novo','protocanonico'),
      ('1Jo','1 João',5,'novo','protocanonico'),
      ('2Jo','2 João',1,'novo','protocanonico'),
      ('3Jo','3 João',1,'novo','protocanonico'),
      ('Jd','Judas',1,'novo','protocanonico'),
      ('Ap','Apocalipse',22,'novo','protocanonico')
  ),
  per_book AS (
    SELECT
      b.id      AS book_id,
      b.abbrev  AS abbrev,
      COUNT(DISTINCT c.id)::INT AS chapters_present,
      COUNT(v.id)::INT          AS verses_total
    FROM public.bible_books b
    LEFT JOIN public.bible_chapters c ON c.book_id = b.id
    LEFT JOIN public.bible_verses   v ON v.chapter_id = c.id
    GROUP BY b.id, b.abbrev
  ),
  english AS (
    SELECT e.abbrev, COUNT(*)::INT AS english_verse_count
    FROM public.bible_detect_english_verses(2, NULL) e
    GROUP BY e.abbrev
  )
  SELECT
    canon.abbrev,
    canon.name,
    canon.testament,
    canon.canonical_type,
    canon.expected_chapters,
    COALESCE(pb.chapters_present, 0) AS chapters_present,
    COALESCE(pb.verses_total, 0)     AS verses_total,
    COALESCE(en.english_verse_count, 0) AS english_verse_count,
    ROUND(
      COALESCE(pb.chapters_present, 0)::NUMERIC
        / NULLIF(canon.expected_chapters, 0) * 100,
      2
    ) AS coverage_pct,
    CASE
      WHEN pb.book_id IS NULL                                   THEN 'missing'
      WHEN COALESCE(pb.chapters_present, 0) = 0                 THEN 'empty'
      WHEN COALESCE(en.english_verse_count, 0) > 0              THEN 'contaminated'
      WHEN pb.chapters_present < canon.expected_chapters        THEN 'partial'
      WHEN pb.chapters_present > canon.expected_chapters        THEN 'over'
      ELSE 'ok'
    END AS status
  FROM canon
  LEFT JOIN per_book pb ON pb.abbrev = canon.abbrev
  LEFT JOIN english  en ON en.abbrev = canon.abbrev
  ORDER BY canon.abbrev;
$$;

REVOKE ALL ON FUNCTION public.bible_canonical_coverage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bible_canonical_coverage() TO authenticated, service_role;
