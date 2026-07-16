#!/usr/bin/env bun
/**
 * axe-core color-contrast — runner ad-hoc para uma URL/rota.
 *
 * Uso:
 *   bunx tsx scripts/axe-contrast-run.ts --route /catechism
 *   bunx tsx scripts/axe-contrast-run.ts --url http://localhost:8080/hoje
 *   bunx tsx scripts/axe-contrast-run.ts --url https://cathedradigital.com.br/santos --tier adhoc
 *
 * Flags:
 *   --route <path>      Rota relativa (concat com --base). Ex: /catechism
 *   --url <full>        URL absoluta. Sobrescreve --route/--base.
 *   --base <url>        Base URL (default: http://localhost:8080)
 *   --tier <t>          enforced | tracked | adhoc (default: adhoc)
 *   --wait <ms>         Espera pós-networkidle (default: 1200)
 *   --aggregate         Roda scripts/axe-contrast-heatmap.ts após gravar.
 *   --dark              Força classe .dark no <html> antes de auditar.
 *
 * Saída:
 *   reports/axe-contrast/<tier>-<slug>.json  — mesmo formato do spec E2E.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';

type Args = {
  route?: string;
  url?: string;
  base: string;
  tier: 'enforced' | 'tracked' | 'adhoc';
  wait: number;
  aggregate: boolean;
  dark: boolean;
};

function parseArgs(): Args {
  const a: Args = {
    base: 'http://localhost:8080',
    tier: 'adhoc',
    wait: 1200,
    aggregate: false,
    dark: false,
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
      case '-h': case '--help':
        console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 22).join('\n'));
        process.exit(0);
    }
  }
  if (!a.url && !a.route) {
    console.error('error: --route or --url required');
    process.exit(2);
  }
  return a;
}

function slug(route: string) {
  return route.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '_') || 'root';
}

async function main() {
  const args = parseArgs();
  const targetUrl = args.url ?? `${args.base.replace(/\/$/, '')}${args.route}`;
  const routeKey = args.route ?? new URL(targetUrl).pathname;

  const REPORT_DIR = path.join(process.cwd(), 'reports', 'axe-contrast');
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  // Carrega axe-core do node_modules (@axe-core/playwright depende dele).
  const axeSrc = fs.readFileSync(
    path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'),
    'utf8',
  );

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();

  console.log(`[axe-contrast-run] ${routeKey} (${targetUrl})`);
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
    return await axe.run(document, {
      runOnly: { type: 'rule', values: ['color-contrast'] },
    });
  });

  await browser.close();

  const violations = (results as { violations: Array<Record<string, unknown>> }).violations ?? [];
  const totalNodes = violations.reduce(
    (n: number, v: { nodes?: unknown[] }) => n + (v.nodes?.length ?? 0),
    0,
  );

  const payload = {
    route: routeKey,
    tier: args.tier,
    timestamp: new Date().toISOString(),
    url: targetUrl,
    dark: args.dark,
    totalNodes,
    violations: violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n: any) => ({
        target: n.target,
        html: (n.html ?? '').slice(0, 500),
        failureSummary: n.failureSummary,
        any: (n.any ?? []).map((c: any) => ({ id: c.id, data: c.data })),
      })),
    })),
  };

  const out = path.join(REPORT_DIR, `${args.tier}-${slug(routeKey)}.json`);
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`  → ${totalNodes} nó(s) · ${out}`);

  if (args.aggregate) {
    const r = spawnSync('bunx', ['tsx', 'scripts/axe-contrast-heatmap.ts'], { stdio: 'inherit' });
    process.exit(r.status ?? 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
