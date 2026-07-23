#!/usr/bin/env node
/**
 * Baixa o summary.json do commit base (via GitHub Actions Artifacts API)
 * e compara Core Web Vitals com o commit atual. Publica tabela no PR.
 *
 * Uso no CI (dentro de um job PR):
 *   GITHUB_TOKEN=... BASE_SHA=... HEAD_SHA=... node scripts/lhci-compare-commits.mjs
 *
 * Não falha o build — só reporta. Os budgets do LHCI já falham por conta própria.
 */
import fs from 'node:fs';
import https from 'node:https';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA || process.env.GITHUB_SHA;
const PR_NUMBER = process.env.PR_NUMBER;
const ARTIFACT_NAME = 'lighthouse-summary';

const current = JSON.parse(fs.readFileSync('.lighthouseci/summary.json', 'utf8'));

const gh = (path, opts = {}) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.github.com${path}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'lhci-compare',
          ...opts.headers,
        },
        ...opts,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode >= 400) return reject(new Error(`GH ${res.statusCode}: ${body.toString()}`));
          if (opts.raw) return resolve({ status: res.statusCode, headers: res.headers, body });
          try {
            resolve(JSON.parse(body.toString() || '{}'));
          } catch {
            resolve(body.toString());
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

async function fetchBaselineSummary() {
  if (!TOKEN || !REPO || !BASE_SHA) {
    console.log('[compare] sem token/repo/base — pulando comparação');
    return null;
  }
  // Pega workflow runs para o commit base
  const runs = await gh(`/repos/${REPO}/actions/runs?head_sha=${BASE_SHA}&per_page=20`);
  for (const run of runs.workflow_runs || []) {
    const arts = await gh(`/repos/${REPO}/actions/runs/${run.id}/artifacts`);
    const art = (arts.artifacts || []).find((a) => a.name === ARTIFACT_NAME && !a.expired);
    if (!art) continue;
    console.log(`[compare] baixando artifact ${art.id} do run ${run.id}`);
    const dl = await gh(`/repos/${REPO}/actions/artifacts/${art.id}/zip`, { raw: true });
    // Segue redirect
    if (dl.status === 302 && dl.headers.location) {
      const buf = await new Promise((resolve, reject) => {
        https.get(dl.headers.location, (r) => {
          const chunks = [];
          r.on('data', (c) => chunks.push(c));
          r.on('end', () => resolve(Buffer.concat(chunks)));
          r.on('error', reject);
        });
      });
      // Extrai o summary.json do zip (unzip via node)
      const { execSync } = await import('node:child_process');
      fs.writeFileSync('/tmp/base-artifact.zip', buf);
      fs.mkdirSync('/tmp/base-artifact', { recursive: true });
      execSync('unzip -o /tmp/base-artifact.zip -d /tmp/base-artifact');
      const files = fs
        .readdirSync('/tmp/base-artifact', { recursive: true })
        .filter((f) => f.endsWith('summary.json'));
      if (files.length) return JSON.parse(fs.readFileSync(`/tmp/base-artifact/${files[0]}`, 'utf8'));
    }
  }
  console.log('[compare] baseline não encontrada');
  return null;
}

const fmt = (v, unit = 'ms') => (v == null ? '—' : `${Math.round(v)}${unit}`);
const delta = (curr, base) => {
  if (base == null || curr == null) return '';
  const d = curr - base;
  if (Math.abs(d) < 1) return '±0';
  const sign = d > 0 ? '🔴 +' : '🟢 ';
  return ` (${sign}${Math.round(d)})`;
};

const baseline = await fetchBaselineSummary();

let md = `## 🚦 Lighthouse — /profile\n\n`;
md += `Commit: \`${HEAD_SHA?.slice(0, 7) || 'local'}\`${baseline ? ` vs baseline \`${baseline.commit?.slice(0, 7)}\`` : ''}\n\n`;
md += `| Device | Perf | LCP | CLS | TBT | INP |\n|---|---|---|---|---|---|\n`;
for (const r of current.runs) {
  const b = baseline?.runs?.find((x) => x.device === r.device);
  md += `| **${r.device}** | ${Math.round(r.performance * 100)}${b ? delta(r.performance * 100, b.performance * 100).replace('ms', '') : ''} | ${fmt(r.lcp)}${delta(r.lcp, b?.lcp)} | ${(r.cls || 0).toFixed(3)}${b ? delta((r.cls || 0) * 1000, (b.cls || 0) * 1000).replace('ms', '/1k') : ''} | ${fmt(r.tbt)}${delta(r.tbt, b?.tbt)} | ${fmt(r.inp)}${delta(r.inp, b?.inp)} |\n`;
}
md += `\n_Budgets em \`budgets/profile.json\`. Falhas de assert bloqueiam o merge._\n`;

fs.writeFileSync('.lighthouseci/pr-comment.md', md);
console.log(md);

// Publica comentário no PR
if (TOKEN && REPO && PR_NUMBER) {
  await gh(`/repos/${REPO}/issues/${PR_NUMBER}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
  // Reenvia com body real
  const req = https.request(
    `https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'lhci-compare',
      },
    },
    (res) => res.resume(),
  );
  req.write(JSON.stringify({ body: md }));
  req.end();
}
