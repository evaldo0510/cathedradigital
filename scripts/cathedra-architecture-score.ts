/**
 * cathedra-architecture-score — Painel de maturidade arquitetural da plataforma.
 *
 * Agrega sinais objetivos por domínio e emite score 0-100. Não mede
 * apenas Reader; mede a plataforma inteira.
 *
 * Uso:
 *   bun scripts/cathedra-architecture-score.ts            # tabela
 *   bun scripts/cathedra-architecture-score.ts --json     # JSON
 *   bun scripts/cathedra-architecture-score.ts --report   # grava reports/architecture-score.json
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { READER_MODULES, FORBIDDEN_IMPORTS } from '../src/config/reader-modules';

const ROOT = resolve(__dirname, '..');

interface DomainReport {
  id: string;
  label: string;
  score: number;
  target: number;
  signals: Array<{ label: string; passed: boolean; detail?: string; weight: number }>;
}

function walk(dir: string, out: string[] = []): string[] {
  const abs = resolve(ROOT, dir);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(join(dir, entry), out);
    else if (/\.(tsx?|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

function readAll(files: string[]): string {
  return files.map((f) => readFileSync(f, 'utf8')).join('\n');
}

function grepAny(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

/* ================================================================== */
/* Domain scorers                                                      */
/* ================================================================== */

function scoreReaderTemplate(): DomainReport {
  // Média ponderada do reader-template-audit por bloqueante
  const scores = READER_MODULES.map((m) => {
    const src = existsSync(resolve(ROOT, m.entry)) ? readFileSync(resolve(ROOT, m.entry), 'utf8') : '';
    if (!src) return { id: m.id, score: 0, target: m.targetScore };
    let s = 0;
    if (/<ReaderShell[\s>]/.test(src) && /from\s+['"]@\/components\/reader['"]/.test(src)) s += 30;
    if (/<EditorialHero[\s>]/.test(src)) s += 20;
    if (/<NexusPanel[\s>]/.test(src) || (m.optionalSlots ?? []).includes('nexus')) s += 20;
    if (/<ReaderContinuation[\s>]/.test(src) || (m.optionalSlots ?? []).includes('continuation')) s += 15;
    const forbidden = FORBIDDEN_IMPORTS.some((r) => r.pattern.test(src));
    if (!forbidden) s += 15;
    return { id: m.id, score: s, target: m.targetScore };
  });
  const avg = Math.round(scores.reduce((a, x) => a + x.score, 0) / scores.length);
  return {
    id: 'reader-template',
    label: 'Reader Template',
    score: avg,
    target: 100,
    signals: scores.map((s) => ({
      label: `${s.id} (alvo ${s.target})`,
      passed: s.score >= s.target,
      detail: `${s.score}/100`,
      weight: 1,
    })),
  };
}

function scoreEditorialEngine(): DomainReport {
  const manifestsDir = 'src/lib/editorial-engine/manifests';
  const iceFile = 'src/lib/editorial-engine/ice.ts';
  const registryFile = 'src/lib/editorial-engine/registry.ts';
  const hasManifests = existsSync(resolve(ROOT, manifestsDir))
    && readdirSync(resolve(ROOT, manifestsDir)).length >= 4;
  const hasIce = existsSync(resolve(ROOT, iceFile));
  const hasRegistry = existsSync(resolve(ROOT, registryFile));
  const signals = [
    { label: 'Manifestos ≥4', passed: hasManifests, weight: 40 },
    { label: 'ICE compositor', passed: hasIce, weight: 30 },
    { label: 'Registry central', passed: hasRegistry, weight: 30 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'editorial-engine', label: 'Editorial Engine', score, target: 100, signals };
}

function scoreNexus(): DomainReport {
  const core = walk('src/core/knowledge');
  const hasReaderAutoNexus = core.some((f) => /ReaderAutoNexus\.ts$/.test(f));
  const hasAdapters = core.filter((f) => /Adapters\/|adapters\//.test(f) && /AutoNexus\.ts$/.test(f)).length >= 3;
  const hasBadge = existsSync(resolve(ROOT, 'src/components/nexus/NexusSourceBadge.tsx'));
  const hasPanel = existsSync(resolve(ROOT, 'src/components/nexus/NexusPanel.tsx'));
  const forbidden = FORBIDDEN_IMPORTS;
  const codebase = readAll(walk('src'));
  const noLocalLists = !/(\bfunction|\bconst)\s+(AutoNexusList|NexusFullList)\b/.test(codebase);
  const signals = [
    { label: 'Contrato ReaderAutoNexus', passed: hasReaderAutoNexus, weight: 20 },
    { label: '≥3 adapters oficiais', passed: hasAdapters, weight: 20 },
    { label: 'NexusPanel único', passed: hasPanel, weight: 20 },
    { label: 'NexusSourceBadge', passed: hasBadge, weight: 15 },
    { label: 'Sem listas locais de Nexus', passed: noLocalLists, weight: 25 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'nexus', label: 'Nexus', score, target: 100, signals };
}

function scorePrayerEngine(): DomainReport {
  const hasPortal = existsSync(resolve(ROOT, 'src/components/prayer/PrayerPortal.tsx'))
    || existsSync(resolve(ROOT, 'src/features/prayer/PrayerPortal.tsx'));
  const hasEngineReader = existsSync(resolve(ROOT, 'src/components/cathedra/PrayerEngineReader.tsx'));
  const hasTheme = existsSync(resolve(ROOT, 'src/features/prayer/portalTheme.ts'))
    || existsSync(resolve(ROOT, 'src/components/prayer/portalTheme.ts'));
  const hasSession = existsSync(resolve(ROOT, 'src/hooks/usePrayerEngineSession.ts'));
  const signals = [
    { label: 'PrayerPortal parametrizado', passed: hasPortal, weight: 30 },
    { label: 'PrayerEngineReader (engine v2)', passed: hasEngineReader, weight: 30 },
    { label: 'portalTheme centralizado', passed: hasTheme, weight: 20 },
    { label: 'usePrayerEngineSession', passed: hasSession, weight: 20 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'prayer-engine', label: 'Prayer Engine', score, target: 100, signals };
}

function scoreDesignSystem(): DomainReport {
  const hasTypography = existsSync(resolve(ROOT, 'src/styles/typography.css'));
  const indexCss = existsSync(resolve(ROOT, 'src/index.css'))
    ? readFileSync(resolve(ROOT, 'src/index.css'), 'utf8') : '';
  const hasTokens = /--primary|--secondary|--gold/.test(indexCss);
  const hasEditorialHero = existsSync(resolve(ROOT, 'src/components/editorial/EditorialHero.tsx'))
    || existsSync(resolve(ROOT, 'src/components/editorial/index.tsx'))
    || existsSync(resolve(ROOT, 'src/components/editorial/index.ts'));
  const componentFiles = walk('src/components');
  const codebase = readAll(componentFiles).slice(0, 5_000_000); // safety
  const hardcodedHex = (codebase.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []).length;
  const noHardcode = hardcodedHex < 40; // baseline slack
  const signals = [
    { label: 'typography.css presente', passed: hasTypography, weight: 20 },
    { label: 'Tokens semânticos definidos', passed: hasTokens, weight: 30 },
    { label: 'EditorialHero disponível', passed: hasEditorialHero, weight: 30 },
    { label: `Hex hardcoded controlado (${hardcodedHex})`, passed: noHardcode, weight: 20 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'design-system', label: 'Design System', score, target: 100, signals };
}

function scoreAuthentication(): DomainReport {
  const hasUseAuth = existsSync(resolve(ROOT, 'src/hooks/useAuth.ts'))
    || existsSync(resolve(ROOT, 'src/hooks/useAuth.tsx'));
  const hasStored = existsSync(resolve(ROOT, 'src/lib/storedSession.ts'));
  const hasRoles = existsSync(resolve(ROOT, 'src/hooks/useGlossaryRole.ts'));
  const hasRenewal = existsSync(resolve(ROOT, 'src/lib/sessionRenewal.ts'));
  const signals = [
    { label: 'useAuth central', passed: hasUseAuth, weight: 30 },
    { label: 'storedSession (zero-flash)', passed: hasStored, weight: 25 },
    { label: 'Role guards (RLS-aware)', passed: hasRoles, weight: 20 },
    { label: 'Session renewal silencioso', passed: hasRenewal, weight: 25 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'authentication', label: 'Authentication', score, target: 100, signals };
}

function scoreCollections(): DomainReport {
  const hasStudio = existsSync(resolve(ROOT, 'src/pages/admin/CollectionsStudio.tsx'))
    || existsSync(resolve(ROOT, 'src/pages/AdminCollectionsStudio.tsx'));
  const hasCollectionPage = existsSync(resolve(ROOT, 'src/pages/CollectionPage.tsx'));
  const hasAdapter = existsSync(resolve(ROOT, 'src/core/knowledge/adapters/collectionAutoNexus.ts'))
    || existsSync(resolve(ROOT, 'src/core/knowledge/adapters/collectionsAutoNexus.ts'));
  const src = hasCollectionPage
    ? readFileSync(resolve(ROOT, 'src/pages/CollectionPage.tsx'), 'utf8') : '';
  const usesReaderShell = /<ReaderShell[\s>]/.test(src);
  const signals = [
    { label: 'CollectionsStudio', passed: hasStudio, weight: 25 },
    { label: 'CollectionPage', passed: hasCollectionPage, weight: 25 },
    { label: 'AutoNexus adapter', passed: hasAdapter, weight: 25 },
    { label: 'ReaderShell aplicado', passed: usesReaderShell, weight: 25 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'collections', label: 'Collections', score, target: 100, signals };
}

function scoreCatechesis(): DomainReport {
  const hasPage = existsSync(resolve(ROOT, 'src/pages/CatequesePage.tsx'))
    || existsSync(resolve(ROOT, 'src/pages/Catequese.tsx'));
  const hasAdapter = existsSync(resolve(ROOT, 'src/core/knowledge/adapters/catequeseAutoNexus.ts'));
  const hasManifest = existsSync(resolve(ROOT, 'src/lib/editorial-engine/manifests/catequese.ts'));
  const signals = [
    { label: 'Página Catequese', passed: hasPage, weight: 30 },
    { label: 'AutoNexus adapter', passed: hasAdapter, weight: 30 },
    { label: 'Editorial manifest', passed: hasManifest, weight: 40 },
  ];
  const score = signals.reduce((a, s) => a + (s.passed ? s.weight : 0), 0);
  return { id: 'catechesis', label: 'Catequese', score, target: 100, signals };
}

/* ================================================================== */

const DOMAINS = [
  scoreReaderTemplate,
  scoreEditorialEngine,
  scoreNexus,
  scorePrayerEngine,
  scoreDesignSystem,
  scoreAuthentication,
  scoreCollections,
  scoreCatechesis,
];

function bar(score: number) {
  const total = 20;
  const filled = Math.round((score / 100) * total);
  return '[' + '█'.repeat(filled) + '·'.repeat(total - filled) + ']';
}

function main() {
  const args = new Set(process.argv.slice(2));
  const reports = DOMAINS.map((fn) => fn());
  const overall = Math.round(reports.reduce((a, r) => a + r.score, 0) / reports.length);

  if (args.has('--json')) {
    process.stdout.write(JSON.stringify({ overall, reports }, null, 2) + '\n');
  } else {
    console.log('━━━ Cathedra Architecture Score ━━━');
    for (const r of reports) {
      const badge = r.score >= r.target ? '✅' : r.score >= 80 ? '⚠' : '❌';
      console.log(`${badge}  ${r.label.padEnd(22)} ${bar(r.score)} ${String(r.score).padStart(3)}%   alvo ${r.target}%`);
    }
    console.log('━'.repeat(72));
    console.log(`Overall: ${overall}%`);
  }

  if (args.has('--report')) {
    const out = resolve(ROOT, 'reports/architecture-score.json');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), overall, reports }, null, 2));
    console.log(`\n→ Relatório: ${out}`);
  }
}

main();
