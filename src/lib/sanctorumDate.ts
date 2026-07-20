/**
 * Helpers compartilhados para sincronização de `?date=YYYY-MM-DD` entre
 * SanctorumDateNav e as páginas /papas e /santos.
 *
 * Regras:
 *  - Formato local (sem timezone drift).
 *  - Ano válido: [MIN_YEAR, anoAtual + 1]. Fora disso, considera-se inválido
 *    e o chamador deve corrigir a URL para hoje.
 */
export const MIN_SANCTORUM_YEAR = 30;

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODateLocal(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Usar setFullYear evita a expansão automática de anos 0–99 para 1900–1999.
  const d = new Date(2000, 0, 1);
  d.setFullYear(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function clampSanctorumDate(d: Date | null): Date | null {
  if (!d) return null;
  const y = d.getFullYear();
  const max = new Date().getFullYear() + 1;
  if (y < MIN_SANCTORUM_YEAR || y > max) return null;
  return d;
}

/**
 * Lê `?date=` e devolve a data válida + flag indicando se veio inválida
 * (o chamador deve reescrever a URL com a data-fallback).
 */
export function resolveSanctorumDateParam(raw: string | null | undefined): {
  date: Date;
  wasClamped: boolean;
  received: string | null;
} {
  const received = raw ?? null;
  const parsed = parseISODateLocal(received);
  const clamped = clampSanctorumDate(parsed);
  const wasClamped = !!received && (!parsed || !clamped);
  return { date: clamped ?? new Date(), wasClamped, received };
}
