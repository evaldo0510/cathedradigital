/**
 * Piloto do Saint Knowledge Pipeline — importa 5 santos-âncora via edge function.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... ADMIN_JWT=... \
 *     bun run scripts/import-saints.ts [--force] [--dry-run]
 *
 * O ADMIN_JWT deve pertencer a um usuário com role 'admin' (tabela user_roles).
 * Obtenha via `supabase.auth.signInWithPassword` no console do navegador logado
 * como admin, então: `(await supabase.auth.getSession()).data.session.access_token`.
 *
 * Nenhum conteúdo editorial é sobrescrito (a edge function respeita
 * `saints.protected_fields`). Use --force apenas para reprocessar campos
 * automáticos (imagem, biografia curta, datas).
 */

const args = new Set(process.argv.slice(2));
const mode: "fill" | "force" = args.has("--force") ? "force" : "fill";
const dryRun = args.has("--dry-run");

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const JWT = process.env.ADMIN_JWT;

if (!SUPABASE_URL || !ANON || !JWT) {
  console.error("❌ Requer SUPABASE_URL, SUPABASE_ANON_KEY e ADMIN_JWT no env.");
  process.exit(1);
}

const PILOT_SAINTS = [
  "sao-francisco-de-assis",
  "santo-agostinho",
  "sao-bento",
  "santa-teresa-de-avila",
  "santa-teresinha-do-menino-jesus",
];

const endpoint = `${SUPABASE_URL}/functions/v1/saint-import`;

async function importOne(saintId: string) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JWT}`,
      apikey: ANON!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ saintId, mode, dryRun }),
  });
  const body = await res.json().catch(() => ({}));
  const tag = res.ok ? "✅" : "❌";
  console.log(`${tag} [${res.status}] ${saintId} →`, JSON.stringify(body));
  return { saintId, ok: res.ok, body };
}

console.log(`🚀 Saint Knowledge Pipeline — piloto (mode=${mode}${dryRun ? ", dry-run" : ""})`);
console.log(`   Santos: ${PILOT_SAINTS.length}\n`);

const results = [];
for (const id of PILOT_SAINTS) {
  results.push(await importOne(id));
  await new Promise((r) => setTimeout(r, 500)); // gentileza com Wikipedia
}

const ok = results.filter((r) => r.ok).length;
console.log(`\n📊 ${ok}/${results.length} sucesso(s). Verifique saint_import_logs.`);
process.exit(ok === results.length ? 0 : 1);
