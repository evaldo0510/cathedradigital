import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId, correlationResponseHeader } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Expose-Headers': 'x-correlation-id',
};

const API_BASE = 'http://calapi.inadiutorium.cz/api/v0';
const READINGS_API = 'https://liturgia.up.railway.app';

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const cidH = correlationResponseHeader(cid);
  const log = makeLogger('liturgical-calendar', cid);
  const headers = { ...corsHeaders, ...cidH };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { action, lang = 'la', calendar = 'general-la', year, month, day } = await req.json();

    let cacheSeconds = 3600;
    if (action === 'month' || action === 'date') cacheSeconds = 86400;

    if (action === 'readings') {
      let url = READINGS_API;
      if (day && month) {
        url += `?dia=${day}&mes=${month}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Readings API error: ${response.status}`);
      const data = await response.json();
      return new Response(JSON.stringify({ ...data, correlation_id: cid }), {
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
        },
      });
    }

    let url: string;

    switch (action) {
      case 'today':
        url = `${API_BASE}/${lang}/calendars/${calendar}/today`;
        cacheSeconds = 3600;
        break;
      case 'date':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}/${day}`;
        cacheSeconds = 86400;
        break;
      case 'month':
        url = `${API_BASE}/${lang}/calendars/${calendar}/${year}/${month}`;
        cacheSeconds = 86400;
        break;
      case 'calendars':
        url = `${API_BASE}/${lang}/calendars`;
        cacheSeconds = 86400;
        break;
      default:
        url = `${API_BASE}/${lang}/calendars/${calendar}/today`;
    }

    log.info('fetch_upstream', { url });
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      log.error('upstream_error', { status: response.status, body: errorText.slice(0, 200) });
      return new Response(
        JSON.stringify({ error: `Erro ao buscar calendário (${response.status})`, correlation_id: cid }),
        { headers: { ...headers, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify({ ...data, correlation_id: cid }), {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      },
    });
  } catch (error: any) {
    log.error('unhandled', { err: String(error) });
    return new Response(JSON.stringify({ error: 'Erro interno. Tente novamente.', correlation_id: cid }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
