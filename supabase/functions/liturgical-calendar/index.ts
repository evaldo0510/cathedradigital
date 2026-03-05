import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'http://calapi.inadiutorium.cz/api/v0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, lang = 'la', calendar = 'general-la', year, month, day } = await req.json();

    let url: string;

    switch (action) {
      case 'today':
        url = `${API_BASE}/${lang}/calendars/${calendar}/today`;
        break;
      case 'date':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}/${day}`;
        break;
      case 'month':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}`;
        break;
      case 'calendars':
        url = `${API_BASE}/${lang}/calendars`;
        break;
      default:
        url = `${API_BASE}/${lang}/calendars/${calendar}/today`;
    }

    console.log('Fetching:', url);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error [${response.status}]:`, errorText);
      return new Response(JSON.stringify({ error: `Erro ao buscar calendário (${response.status})` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Liturgical calendar error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
