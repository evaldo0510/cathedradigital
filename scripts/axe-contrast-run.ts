#!/usr/bin/env bun
/**
 * axe-core color-contrast — runner ad-hoc e batch, com --autofix opcional.
 *
 * Uso:
 *   # rota única
 *   bunx tsx scripts/axe-contrast-run.ts --route /catechism
 *   bunx tsx scripts/axe-contrast-run.ts --url https://cathedradigital.com.br/santos
 *
 *   # todas as rotas tracked de uma vez + aggregate
 *   bunx tsx scripts/axe-contrast-run.ts --all-tracked --aggregate
 *
 *   # autofix (dry-run por padrão, imprime diff)
 *   bunx tsx scripts/axe-contrast-run.ts --autofix
 *
 *   # autofix aplicando de verdade (usa registry TOKEN_REGISTRY, só regras 'safe')
 *   bunx tsx scripts/axe-contrast-run.ts --autofix --apply
 *
 * Flags:
 *   --route <path>      Rota relativa (concat com --base).
 *   --url <full>        URL absoluta. Sobrescreve --route/--base.
 *   --base <url>        Base URL (default: http://localhost:8080)
 *   --tier <t>          enforced | tracked | adhoc (default: adhoc)
 *   --wait <ms>         Espera pós-networkidle (default: 1200)
 *   --aggregate         Roda scripts/axe-contrast-heatmap.ts após gravar.
 *   --dark              Força .dark no <html>.
 *   --all-tracked       Roda em todas as rotas tier tracked do spec E2E.
 *   --autofix           Roda o autofix (usa summary.json + token-registry).
 *   --apply             Sem esta flag, --autofix é dry-run.
 *
 * Saída:
 *   reports/axe-contrast/<tier>-<slug>.json
 *   reports/axe-contrast/autofix-diff.md  (quando --autofix)
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';
import { TOKEN_REGISTRY, isSafeAutofix, ruleFor } from './axe-contrast-token-registry';

// Sincronizado com tests/e2e/axe-color-contrast-regression.spec.ts
const TRACKED_ROUTES = [
  '/hoje', '/catechism', '/buscar', '/logos', '/temas', '/encyclopedia',
  '/glossary', '/santos', '/liturgia', '/rosary', '/litanies', '/onboarding',
];

type Args = {
  route?: string;
  url?: string;
  base: string;
  tier: 'enforced' | 'tracked' | 'adhoc';
  wait: number;
  aggregate: boolean;
  dark: boolean;
  allTracked: boolean;
  autofix: boolean;
  apply: boolean;
};

function parseArgs(): Args {
  const a: Args = {
    base: 'http://localhost:8080',
    tier: 'adhoc',
    wait: 1200,
    aggregate: false,
    dark: false,
    allTracked: false,
    autofix: false,
    apply: false,
  };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case '--route': a.route = v; i++; break;
      case '--url': a.url = v; i++; break;
      case '--base': a.base = v; i++; break;
      case '--tier': a.tier = v as Args['tier']; i++; break;
      case '--wait': a.wait = parseInt(v, 10); i++; break;
      case '--aggregate': a.aggregate = true; break;
      case '--dark': a.dark = true; break;
      case '--all-tracked': a.allTracked = true; a.tier = 'tracked'; break;
      case '--autofix': a.autofix = true; break;
      case '--apply': a.apply = true; break;
      case '-h': case '--help':
        console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 35).join('\n'));
        process.exit(0);
    }
  }
  return a;
}

function slug(route: string) {
  return route.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '_') || 'root';
}

async function auditOne(browser: any, args: Args, route: string, axeSrc: string) {
  const targetUrl = args.url ?? `${args.base.replace(/\/$/, '')}${route}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  console.log(`[axe-contrast-run] ${route} (${targetUrl})`);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  if (args.dark) {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });
  }
  await page.waitForTimeout(args.wait);
  await page.addScriptTag({ content: axeSrc });
  const results = await page.evaluate(async () => {
    // @ts-expect-error injected
    return await axe.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
  });
  await ctx.close();

  const violations = (results as { violations: Array<Record<string, unknown>> }).violations ?? [];
  const totalNodes = violations.reduce((n: number, v: any) => n + (v.nodes?.length ?? 0), 0);
  const payload = {
    route,
    tier: args.tier,
    timestamp: new Date().toISOString(),
    url: targetUrl,
    dark: args.dark,
    totalNodes,
    violations: violations.map((v: any) => ({
      id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        target: n.target,
        html: (n.html ?? '').slice(0, 500),
        failureSummary: n.failureSummary,
        any: (n.any ?? []).map((c: any) => ({ id: c.id, data: c.data })),
      })),
    })),
  };
  const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const out = path.join(REPORT_DIR, `${args.tier}-${slug(route)}.json`);
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`  → ${totalNodes} nó(s) · ${out}`);
}

// ---------- AUTOFIX ----------
type AutofixHit = {
  file: string;
  line: number;
  cls: string;
  replacement: string | null;
  reason: string;
  original: string;
  next: string;
};

function rgClass(cls: string): Array<{ file: string; line: number; text: string }> {
  const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/');
  const pattern = `(?:className|class)=["\`\\{][^"\`]*\\b${escaped}\\b|["\`\\s]${escaped}["\`\\s]`;
  const r = spawnSync(
    'rg',
    ['--json', '-t', 'typescript', pattern, 'src'],
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  if (r.status !== 0 && r.status !== 1) return [];
  const out: Array<{ file: string; line: number; text: string }> = [];
  for (const line of r.stdout.split('\n')) {
    if (!line.trim()) continue;
    try {
      const evt = JSON.parse(line);
      if (evt.type === 'match') {
        out.push({
          file: evt.data.path.text,
          line: evt.data.line_number,
          text: (evt.data.lines.text ?? '').trimEnd(),
        });
      }
    } catch { /* skip */ }
  }
  return out;
}

function applyReplacement(text: string, cls: string, replacement: string | null): string | null {
  // Substitui apenas ocorrências como palavra dentro de className/class/strings.
  // \bcls\b não funciona quando cls contém `/`, então cercamos com whitespace/quote.
  const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(["\`\\s])${escaped}(?=["\`\\s])`, 'g');
  let hit = false;
  const next = text.replace(re, (_m, prefix) => {
    hit = true;
    return replacement === null ? prefix.trimEnd() : `${prefix}${replacement}`;
  });
  return hit ? next : null;
}

function runAutofix(apply: boolean) {
  console.log(`\n[axe-contrast-run] autofix ${apply ? '(APPLY)' : '(dry-run)'}`);
  const hits: AutofixHit[] = [];
  const perFile = new Map<string, string>();
  const originalPerFile = new Map<string, string>();

  for (const [cls, rule] of Object.entries(TOKEN_REGISTRY)) {
    if (!isSafeAutofix(cls)) continue;
    const matches = rgClass(cls);
    for (const m of matches) {
      const current = perFile.get(m.file) ?? fs.readFileSync(m.file, 'utf8');
      if (!originalPerFile.has(m.file)) originalPerFile.set(m.file, current);
      const next = applyReplacement(current, cls, rule.replacement ?? null);
      if (next && next !== current) {
        perFile.set(m.file, next);
        hits.push({
          file: m.file,
          line: m.line,
          cls,
          replacement: rule.replacement ?? null,
          reason: rule.reason,
          original: m.text.slice(0, 200),
          next: (next.split('\n')[m.line - 1] ?? '').slice(0, 200),
        });
      }
    }
  }

  const md: string[] = [];
  md.push(`# axe-contrast autofix diff — ${new Date().toISOString()}\n`);
  md.push(`Modo: **${apply ? 'APPLY' : 'DRY-RUN'}**  ·  Regras usadas: apenas confidence=\`safe\` do token registry.\n\n`);
  md.push(`Arquivos afetados: **${perFile.size}**  ·  Ocorrências: **${hits.length}**\n\n`);
  const byFile = new Map<string, AutofixHit[]>();
  for (const h of hits) {
    const arr = byFile.get(h.file) ?? [];
    arr.push(h);
    byFile.set(h.file, arr);
  }
  for (const [file, arr] of Array.from(byFile.entries()).sort()) {
    md.push(`## \`${file}\`\n\n`);
    for (const h of arr.sort((a, b) => a.line - b.line)) {
      const target = h.replacement === null ? '(remover)' : `\`${h.replacement}\``;
      md.push(`- L${h.line} \`${h.cls}\` → ${target} · _${h.reason}_\n`);
      md.push(`  \`\`\`diff\n- ${h.original}\n+ ${h.next}\n  \`\`\`\n`);
    }
    md.push('\n');
  }
  const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const diffPath = path.join(REPORT_DIR, 'autofix-diff.md');
  fs.writeFileSync(diffPath, md.join(''));
  console.log(`  → ${hits.length} substituição(ões) em ${perFile.size} arquivo(s)`);
  console.log(`  → diff: ${diffPath}`);

  if (apply) {
    for (const [file, content] of perFile) {
      fs.writeFileSync(file, content);
    }
    console.log(`  → APLICADO em ${perFile.size} arquivo(s). Rode o axe novamente e revise o diff git.`);
  } else {
    console.log(`  → dry-run: nenhum arquivo escrito. Use --apply para aplicar.`);
  }
}

// ---------- MAIN ----------
async function main() {
  const args = parseArgs();

  if (args.autofix) {
    runAutofix(args.apply);
    if (args.aggregate) {
      const r = spawnSync('bunx', ['tsx', 'scripts/axe-contrast-heatmap.ts'], { stdio: 'inherit' });
      process.exit(r.status ?? 0);
    }
    return;
  }

  if (!args.url && !args.route && !args.allTracked) {
    console.error('error: --route, --url or --all-tracked required');
    process.exit(2);
  }

  const axeSrc = fs.readFileSync(
    path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
    'utf8',
  );
  const browser = await chromium.launch({ headless: true });

  const routes = args.allTracked
    ? TRACKED_ROUTES
    : [args.route ?? new URL(args.url!).pathname];

  for (const route of routes) {
    await auditOne(browser, args, route, axeSrc);
  }
  await browser.close();

  if (args.aggregate) {
    const r = spawnSync('bunx', ['tsx', 'scripts/axe-contrast-heatmap.ts'], { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
