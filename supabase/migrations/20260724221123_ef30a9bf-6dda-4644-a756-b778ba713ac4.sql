
-- Sprint Biblioteca Católica — Onda 1 (Fundação)
-- Estende enum de categorias e cria view unificada library_items_v1.

-- 1) Novos valores de categoria (aditivo, não destrutivo)
ALTER TYPE public.saint_work_category ADD VALUE IF NOT EXISTS 'classic';
ALTER TYPE public.saint_work_category ADD VALUE IF NOT EXISTS 'magisterio';

-- 2) Enum de tipo de item da Biblioteca (para consumo pela UI)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'library_kind') THEN
    CREATE TYPE public.library_kind AS ENUM (
      'saint_work',   -- Escritos dos Santos (padrão)
      'patristic',    -- Padres da Igreja (subset de saint_works)
      'doctor',       -- Doutores (subset de saint_works)
      'classic',      -- Clássicos católicos (Newman, Chesterton, Guardini…)
      'magisterium'   -- Documentos do Magistério (encíclicas, exortações, concílios)
    );
  END IF;
END $$;
