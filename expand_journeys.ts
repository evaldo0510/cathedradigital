
import { supabase } from './src/integrations/supabase/client';

const JOURNEYS_TO_EXPAND = [
  { id: 'a1b2c3d4-0001-4000-8000-000000000001', title: 'Primeiros Passos na Fé', target_days: 7 },
  { id: 'a1b2c3d4-2222-4000-8000-000000000002', title: 'Vida de Oração', target_days: 7 },
  { id: 'a1b2c3d4-0004-4000-8000-000000000004', title: 'Prisão Interior', target_days: 7 },
  { id: 'a1b2c3d4-1111-4000-8000-000000000001', title: 'Rotina Espiritual', target_days: 7 },
  { id: 'a1b2c3d4-0003-4000-8000-000000000003', title: 'Aprofundamento Místico', target_days: 7 },
  { id: 'b1b2c3d4-3333-4000-8000-000000000003', title: 'Discernimento Vocacional', target_days: 14 },
  { id: 'b1b2c3d4-4444-4000-8000-000000000004', title: 'Teologia do Corpo', target_days: 14 },
];

// This script is just a template, I will generate the actual SQL migration directly.
