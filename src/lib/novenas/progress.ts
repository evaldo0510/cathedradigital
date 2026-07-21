import { NOVENAS } from '@/data/novenas';

export interface NovenaProgress {
  startedAt: string;
  completedDays: number[];
  currentDay: number;
  updatedAt?: string;
}

export const STORAGE_PREFIX = 'cathedra:novena:';
export const EXPORT_VERSION = 1;

export interface NovenaExportPayload {
  app: 'cathedra';
  kind: 'novena-progress';
  version: number;
  exportedAt: string;
  entries: Record<string, NovenaProgress>;
}

export function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

export function loadProgress(slug: string): NovenaProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as NovenaProgress;
  } catch {
    return null;
  }
}

export function saveProgress(slug: string, p: NovenaProgress) {
  try {
    const withTs: NovenaProgress = { ...p, updatedAt: new Date().toISOString() };
    localStorage.setItem(storageKey(slug), JSON.stringify(withTs));
  } catch {
    /* ignore */
  }
}

export function loadAllProgress(): Record<string, NovenaProgress> {
  const out: Record<string, NovenaProgress> = {};
  for (const n of NOVENAS) {
    const p = loadProgress(n.slug);
    if (p) out[n.slug] = p;
  }
  return out;
}

export function isInProgress(p: NovenaProgress | null | undefined, totalDays: number) {
  if (!p) return false;
  return p.completedDays.length > 0 && p.completedDays.length < totalDays;
}

/** Retorna a novena mais recentemente atualizada e ainda não concluída. */
export function findContinueTarget():
  | { slug: string; day: number; progress: NovenaProgress }
  | null {
  const all = loadAllProgress();
  let best: { slug: string; day: number; progress: NovenaProgress; ts: number } | null = null;
  for (const n of NOVENAS) {
    const p = all[n.slug];
    if (!p) continue;
    if (p.completedDays.length >= n.days.length) continue; // concluída
    const ts = new Date(p.updatedAt ?? p.startedAt).getTime();
    if (!best || ts > best.ts) {
      best = { slug: n.slug, day: p.currentDay, progress: p, ts };
    }
  }
  if (!best) return null;
  return { slug: best.slug, day: best.day, progress: best.progress };
}

export function exportAllProgress(): NovenaExportPayload {
  return {
    app: 'cathedra',
    kind: 'novena-progress',
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    entries: loadAllProgress(),
  };
}

export function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  imported: number;
  merged: number;
  skipped: number;
  errors: string[];
}

export type ImportMode = 'replace' | 'merge';

function mergeEntries(a: NovenaProgress, b: NovenaProgress): NovenaProgress {
  const completed = Array.from(new Set([...a.completedDays, ...b.completedDays])).sort(
    (x, y) => x - y,
  );
  const currentDay = Math.max(a.currentDay, b.currentDay);
  const startedAt =
    new Date(a.startedAt).getTime() <= new Date(b.startedAt).getTime() ? a.startedAt : b.startedAt;
  const aTs = new Date(a.updatedAt ?? a.startedAt).getTime();
  const bTs = new Date(b.updatedAt ?? b.startedAt).getTime();
  const updatedAt = aTs >= bTs ? a.updatedAt ?? a.startedAt : b.updatedAt ?? b.startedAt;
  return { startedAt, completedDays: completed, currentDay, updatedAt };
}

export function importProgressPayload(
  raw: unknown,
  options: { mode?: ImportMode } = {},
): ImportResult {
  const mode: ImportMode = options.mode ?? 'replace';
  const result: ImportResult = { imported: 0, merged: 0, skipped: 0, errors: [] };
  if (!raw || typeof raw !== 'object') {
    result.errors.push('Arquivo inválido.');
    return result;
  }
  const p = raw as Partial<NovenaExportPayload>;
  if (p.app !== 'cathedra' || p.kind !== 'novena-progress') {
    result.errors.push('Este arquivo não é um progresso de novenas Cathedra.');
    return result;
  }
  if (!p.entries || typeof p.entries !== 'object') {
    result.errors.push('Nenhum registro encontrado.');
    return result;
  }
  const validSlugs = new Set(NOVENAS.map((n) => n.slug));
  for (const [slug, entry] of Object.entries(p.entries)) {
    if (!validSlugs.has(slug)) {
      result.skipped += 1;
      continue;
    }
    const e = entry as NovenaProgress;
    if (
      !e ||
      typeof e.currentDay !== 'number' ||
      !Array.isArray(e.completedDays) ||
      typeof e.startedAt !== 'string'
    ) {
      result.skipped += 1;
      continue;
    }
    if (mode === 'merge') {
      const existing = loadProgress(slug);
      if (existing) {
        saveProgress(slug, mergeEntries(existing, e));
        result.merged += 1;
        continue;
      }
    }
    saveProgress(slug, e);
    result.imported += 1;
  }
  return result;
}

