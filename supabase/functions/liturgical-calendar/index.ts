import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeLogger } from "../_shared/logger.ts";
import { makeResponder } from "../_shared/http-response.ts";

const API_BASE = 'http://calapi.inadiutorium.cz/api/v0';
const READINGS_API = 'https://liturgia.up.railway.app';

serve(async (req) => {
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);
  const log = makeLogger('liturgical-calendar', cid);

  if (req.method === 'OPTIONS') return R.cors();

  try {
    const { action, lang = 'la', calendar = 'general-la', year, month, day } = await req.json().catch(() => ({}));

    let cacheSeconds = 3600;
    if (action === 'month' || action === 'date') cacheSeconds = 86400;

    if (action === 'readings') {
      let url = READINGS_API;
      if (day && month) url += `?dia=${day}&mes=${month}`;
      const response = await fetch(url);
      if (!response.ok) {
        log.error('readings_upstream_error', { status: response.status });
        return R.error(502, 'internal_error', { message: `Readings API error: ${response.status}`, upstream_status: response.status });
      }
      const data = await response.json();
      // Sucesso: mantém payload de domínio (flat)
      const body = JSON.stringify({ ...data, correlation_id: cid });
      return new Response(body, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'x-correlation-id': cid,
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
      const errorText = await response.text().catch(() => '');
      log.error('upstream_error', { status: response.status, body: errorText.slice(0, 200) });
      return R.error(502, 'internal_error', { message: `Erro ao buscar calendário (${response.status})`, upstream_status: response.status });
    }

    const data = await response.json();
    // Sucesso: mantém payload de domínio (flat)
    const body = JSON.stringify({ ...data, correlation_id: cid });
    return new Response(body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'x-correlation-id': cid,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      },
    });
  } catch (error: any) {
    log.error('unhandled', { err: String(error) });
    return R.error(500, 'internal_error', { message: 'Erro interno. Tente novamente.' });
  }
});
