/**
 * prayer-tts — narração PT-BR de blocos de oração via Lovable AI Gateway.
 *
 * POST { text: string, voice?: string }
 * → 200 audio/mpeg (MP3 pronto para <audio>)
 *
 * Autenticado (verify_jwt padrão). Sem cache (v1); a UI pode salvar
 * blobs em cache local por hash do texto.
 */
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/audio/speech';
const DEFAULT_VOICE = 'alloy';
const DEFAULT_MODEL = 'openai/gpt-4o-mini-tts';
const MAX_INPUT = 3800; // margem de segurança

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: { text?: unknown; voice?: unknown; instructions?: unknown };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  const voice = typeof payload.voice === 'string' && payload.voice ? payload.voice : DEFAULT_VOICE;
  const instructions =
    typeof payload.instructions === 'string' && payload.instructions
      ? payload.instructions
      : 'Fale em português brasileiro com tom contemplativo, pausado e reverente, adequado para oração.';

  if (!text) {
    return new Response(JSON.stringify({ error: 'Field "text" is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (text.length > MAX_INPUT) {
    return new Response(
      JSON.stringify({ error: `Text too long (${text.length} > ${MAX_INPUT}). Split into blocks.` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const upstream = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: text,
      voice,
      instructions,
      response_format: 'mp3',
    }),
  });

  if (!upstream.ok) {
    const errorBody = await upstream.text();
    console.error(`prayer-tts upstream ${upstream.status}: ${errorBody}`);
    return new Response(
      JSON.stringify({ error: 'TTS upstream failed', status: upstream.status, details: errorBody }),
      { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
