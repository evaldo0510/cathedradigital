import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrCreateCorrelationId } from "../_shared/correlation.ts";
import { makeResponder } from "../_shared/http-response.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sha256(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function checkSpecialChars(text: string) {
  const specialCharsRegex = /[áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]|&[a-z]+;|&#\d+;/g;
  const matches = text.match(specialCharsRegex);
  return matches ? matches.length : 0;
}

serve(async (req) => {
  // Sprint A / CAT-001 — correlation_id (ADR-009) + CAT-002 Wave 4a envelope estrito
  const cid = getOrCreateCorrelationId(req);
  const R = makeResponder(cid);

  if (req.method === 'OPTIONS') return R.cors();

  try {
    const { book_id, chapter_number, expected_hash, correlation_id, source_text } = await req.json();

    const { data: verses } = await supabase
      .from('bible_verses')
      .select('text')
      .eq('chapter_id', (
        await supabase.from('bible_chapters').select('id').eq('book_id', book_id).eq('number', chapter_number).single()
      ).data?.id)
      .order('number');

    const localText = (verses || []).map(v => v.text).join(' ');
    const localHash = await sha256(localText);
    const specialCharsCount = checkSpecialChars(localText);

    const encodingIssues = localText.includes('') || localText.includes('Ã©');

    const status = expected_hash === localHash ? 'match' : 'mismatch';

    await supabase.from('bible_integrity_reports').insert({
      book_id,
      chapter_number,
      calculated_hash: localHash,
      expected_hash,
      status,
      correlation_id,
      special_chars_count: specialCharsCount,
      encoding_issues_detected: encodingIssues,
      discrepancy_details: {
        encoding_issues: encodingIssues,
        special_chars: specialCharsCount,
        length_diff: source_text ? Math.abs(source_text.length - localText.length) : 0
      }
    });

    return R.raw({ status, localHash, encodingIssues, specialCharsCount });

  } catch (error: any) {
    return R.error(500, 'internal_error', { message: String(error?.message ?? error) });
  }
});
