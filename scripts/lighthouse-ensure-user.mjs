#!/usr/bin/env node
/**
 * Cria (ou confirma) o usuário de teste Lighthouse via Supabase Admin API.
 * Idempotente: se já existir, atualiza a senha e garante email_confirmed_at.
 *
 * Variáveis obrigatórias:
 *   LH_SUPABASE_URL              — URL do projeto Supabase (ex.: https://xyz.supabase.co)
 *   LH_SUPABASE_SERVICE_ROLE_KEY — service_role key (usar apenas em CI/local, NUNCA no cliente)
 *   TEST_USER_EMAIL
 *   TEST_USER_PASSWORD
 *
 * Uso:
 *   node scripts/lighthouse-ensure-user.mjs
 */
const URL_BASE = process.env.LH_SUPABASE_URL;
const SR = process.env.LH_SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;

if (!URL_BASE || !SR || !EMAIL || !PASSWORD) {
  console.error('❌ Requer LH_SUPABASE_URL, LH_SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD.');
  process.exit(1);
}

const H = { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' };
const admin = `${URL_BASE.replace(/\/$/, '')}/auth/v1/admin`;

const find = await fetch(`${admin}/users?email=${encodeURIComponent(EMAIL)}`, { headers: H });
if (!find.ok) { console.error('❌ list users:', find.status, await find.text()); process.exit(1); }
const found = await find.json();
const existing = (found.users || []).find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

if (!existing) {
  const create = await fetch(`${admin}/users`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  });
  if (!create.ok) { console.error('❌ create:', create.status, await create.text()); process.exit(1); }
  const { id } = await create.json();
  console.log(`✅ usuário criado e confirmado: ${EMAIL} (${id})`);
} else {
  const patch = await fetch(`${admin}/users/${existing.id}`, {
    method: 'PUT', headers: H,
    body: JSON.stringify({ password: PASSWORD, email_confirm: true }),
  });
  if (!patch.ok) { console.error('❌ update:', patch.status, await patch.text()); process.exit(1); }
  console.log(`✅ usuário atualizado e confirmado: ${EMAIL} (${existing.id})`);
}
