import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE = 'http://calapi.inadiutorium.cz/api/v0';
const READINGS_API = 'https://liturgia.up.railway.app';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, lang = 'la', calendar = 'general-la', year, month, day } = await req.json();

    // Cache duration based on action
    // Today changes every 24h, but we cache for 1h to avoid drift
    // Month and specific dates are static
    let cacheSeconds = 3600; 
    if (action === 'month' || action === 'date') cacheSeconds = 86400; // 24h

    if (action === 'readings') {
      let url = READINGS_API;
      if (day && month) {
        url += `?dia=${day}&mes=${month}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Readings API error: ${response.status}`);
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
        },
      });
    }

    let url: string;

    switch (action) {
      case 'today':
        url = `${API_BASE}/${lang}/calendars/${calendar}/today`;
        cacheSeconds = 3600; // 1 hour for today
        break;
      case 'date':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}/${day}`;
        cacheSeconds = 86400; // 1 day for specific date
        break;
      case 'month':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}`;
        cacheSeconds = 86400; // 1 day for month
        break;
      case 'calendars':
        url = `${API_BASE}/${lang}/calendars`;
        cacheSeconds = 86400;
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
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
      },
    });
  } catch (error: any) {
    console.error('Liturgical calendar error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});