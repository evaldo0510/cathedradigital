/**
 * buildPassageUrl — helper único para gerar URLs compartilháveis
 * dos Readers do Cathedra. Sempre acrescenta `?highlight=…` para
 * que o Reader destino possa rolar e destacar o trecho.
 *
 * Superfícies suportadas:
 *  - bible       → /bible?ref=Jo+6%2C53&highlight=…
 *  - catechism   → /catechism?p=142&highlight=…
 *  - magisterium → /magisterium/:id?highlight=…
 *  - father      → /padres/:slug?highlight=…
 *  - saint       → /santos/:slug?highlight=…
 */

export type PassageDescriptor =
  | { kind: 'bible'; ref: string; highlight?: string }
  | { kind: 'catechism'; paragraph: number | string; highlight?: string }
  | { kind: 'magisterium'; id: string; highlight?: string }
  | { kind: 'father'; slug: string; highlight?: string }
  | { kind: 'saint'; slug: string; highlight?: string };

function origin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

function withHighlight(base: string, highlight?: string): string {
  const url = new URL(base, origin() || 'http://localhost');
  if (highlight && highlight.trim()) {
    url.searchParams.set('highlight', highlight.trim());
  }
  const rel = `${url.pathname}${url.search}`;
  return origin() ? `${origin()}${rel}` : rel;
}

export function buildPassageUrl(passage: PassageDescriptor): string {
  switch (passage.kind) {
    case 'bible': {
      const qs = new URLSearchParams({ ref: passage.ref });
      return withHighlight(`/bible?${qs.toString()}`, passage.highlight);
    }
    case 'catechism': {
      const qs = new URLSearchParams({ p: String(passage.paragraph) });
      return withHighlight(`/catechism?${qs.toString()}`, passage.highlight);
    }
    case 'magisterium':
      return withHighlight(`/magisterium/${encodeURIComponent(passage.id)}`, passage.highlight);
    case 'father':
      return withHighlight(`/padres/${encodeURIComponent(passage.slug)}`, passage.highlight);
    case 'saint':
      return withHighlight(`/santos/${encodeURIComponent(passage.slug)}`, passage.highlight);
  }
}
