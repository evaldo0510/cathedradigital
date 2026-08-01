/**
 * Popularidade dos guias do Portal de Documentação.
 *
 * Sinal local (localStorage) de quantas vezes cada guia foi aberto por este
 * leitor. Serve como quinto fator de ranqueamento da busca: em empate, o
 * documento mais consultado sobe. Sem rede, sem rastreio de usuário.
 */
const STORAGE_KEY = 'cathedra:docs:popularity:v1';
const MAX_ENTRIES = 200;

type Counts = Record<string, number>;

function read(): Counts {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Counts = {};
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) out[slug] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function getDocPopularity(): Counts {
  return read();
}

export function recordDocView(slug: string): void {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const counts = read();
    counts[slug] = (counts[slug] ?? 0) + 1;
    const trimmed = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    /* armazenamento indisponível: popularidade é opcional */
  }
}

/**
 * Peso 1,5 aplicado sobre a popularidade normalizada (0–1) do guia,
 * relativa ao guia mais acessado. Nunca ultrapassa o peso de um termo
 * casado no título, para não distorcer a relevância textual.
 */
export function popularityBoost(slug: string, counts: Counts): number {
  const max = Math.max(0, ...Object.values(counts));
  if (max <= 0) return 0;
  return ((counts[slug] ?? 0) / max) * 1.5;
}
