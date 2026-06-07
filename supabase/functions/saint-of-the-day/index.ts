import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const now = new Date();
    // Use GMT-3 (Brazil) or local time logic
    const day = now.getDate();
    const month = now.getMonth() + 1;
    
    // UNICA FONTE DE VERDADE: Banco de Dados Local
    const { data: dbSaint, error: dbError } = await supabase
      .from('saints')
      .select('*')
      .eq('feast_month', month)
      .eq('feast_day_num', day)
      .limit(1)
      .maybeSingle();

    if (dbSaint && !dbError) {
      return new Response(JSON.stringify({
        ...dbSaint,
        description: dbSaint.bio,
        fullBio: dbSaint.full_bio,
        source: "Cathedra Database"
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Se não houver santo cadastrado para o dia, retorna 404 ou um fallback genérico sem scraping
    return new Response(JSON.stringify({ 
      name: "Santo do Dia", 
      bio: "Nenhum santo cadastrado localmente para esta data.",
      source: "Cathedra (Local Only)" 
    }), { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('saint-of-the-day error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno.' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});