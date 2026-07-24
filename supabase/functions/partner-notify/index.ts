/**
 * Edge function: partner-notify
 * Dispara notificação de recepção ou mudança de status de uma candidatura de parceria.
 *
 * Ações:
 *   { partner_id, action: 'received' | 'approved' | 'rejected' }
 *
 * Estratégia:
 *   1. Carrega o parceiro com service role (bypassa RLS).
 *   2. Tenta chamar `send-transactional-email` se ela existir (infra Lovable Emails).
 *   3. Sempre grava um evento em `notifications` para auditoria.
 *
 * `verify_jwt = false` (default Lovable): a função é chamada tanto por anônimos
 * (após submit público) quanto por admins (após aprovação).
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Action = 'received' | 'approved' | 'rejected';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json({ error: 'Config ausente.' }, 500);
  }

  let body: { partner_id?: string; action?: Action };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  const { partner_id, action } = body;
  if (!partner_id || !action || !['received', 'approved', 'rejected'].includes(action)) {
    return json({ error: 'partner_id e action (received|approved|rejected) obrigatórios.' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: partner, error: fetchErr } = await admin
    .from('partners')
    .select('id, name, contact_email, status, partner_type')
    .eq('id', partner_id)
    .maybeSingle();

  if (fetchErr || !partner) {
    return json({ error: 'Parceiro não encontrado.' }, 404);
  }

  const subject = subjectFor(action, partner.name);
  const html = htmlFor(action, partner.name);

  // Tenta o send-transactional-email padrão do Cathedra. Se ele não existir
  // ainda, seguimos apenas com o log em `notifications`.
  let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
  let emailError: string | null = null;

  if (partner.contact_email) {
    try {
      const { error: invokeErr } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: `partner-${action}`,
          recipientEmail: partner.contact_email,
          idempotencyKey: `partner-${action}-${partner.id}`,
          templateData: { name: partner.name, subject, html },
        },
      });
      if (invokeErr) {
        emailError = invokeErr.message ?? String(invokeErr);
        emailStatus = 'failed';
      } else {
        emailStatus = 'sent';
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : String(err);
      emailStatus = 'failed';
    }
  }

  // Sempre registra o evento — auditoria e fallback quando o email falhar.
  await admin.from('notifications').insert({
    user_id: null,
    title: `[Parceria] ${labelFor(action)}: ${partner.name}`,
    body: `${partner.contact_email ?? 'sem email'} · status=${emailStatus}${emailError ? ` · ${emailError}` : ''}`,
    type: 'partner',
    read: false,
    metadata: { partner_id: partner.id, action, email_status: emailStatus, email_error: emailError },
  } as unknown as Record<string, unknown>).then(() => {}, () => {});

  return json({ ok: true, email: emailStatus, email_error: emailError });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function labelFor(action: Action): string {
  return action === 'received' ? 'candidatura recebida'
       : action === 'approved' ? 'aprovada'
       : 'recusada';
}

function subjectFor(action: Action, name: string): string {
  if (action === 'received') return `Cathedra · Recebemos sua candidatura, ${name}`;
  if (action === 'approved') return `Cathedra · Sua parceria foi aprovada`;
  return `Cathedra · Retorno sobre sua candidatura`;
}

function htmlFor(action: Action, name: string): string {
  const base = (body: string) => `
    <div style="font-family: Georgia, serif; color:#0B1F3A; padding:24px; max-width:560px; margin:auto;">
      <h2 style="color:#C8A96A; margin-bottom:16px;">Cathedra</h2>
      ${body}
      <p style="margin-top:32px; color:#556; font-size:12px;">
        Este é um comunicado editorial do Cathedra Digital.
      </p>
    </div>`;

  if (action === 'received') {
    return base(`
      <p>Prezado(a) ${name},</p>
      <p>Recebemos sua candidatura de parceria. Nossa equipe editorial analisará sua proposta e retornará em breve.</p>
      <p>Agradecemos o interesse em caminhar conosco na difusão da Fé e da Cultura Católica.</p>
    `);
  }
  if (action === 'approved') {
    return base(`
      <p>Prezado(a) ${name},</p>
      <p>Temos a alegria de comunicar que sua parceria foi <strong>aprovada</strong> e já figura publicamente entre os parceiros do Cathedra.</p>
      <p>Deo gratias.</p>
    `);
  }
  return base(`
    <p>Prezado(a) ${name},</p>
    <p>Após análise cuidadosa, sua candidatura não foi acolhida neste momento. Isso não impede uma futura reaproximação, e agradecemos sinceramente pelo interesse.</p>
  `);
}
