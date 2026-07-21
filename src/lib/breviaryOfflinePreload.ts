/**
 * Preload declarativo de assets estáticos usados no Breviário para uso 100% offline.
 *
 * - Aquece o cache do navegador via `fetch(url, { cache: 'force-cache' })`.
 * - Persiste em um Cache Storage bucket dedicado (`cathedra-breviary-assets-v1`)
 *   para que Service Workers futuros possam servir mesmo offline.
 * - Garante que as fontes do sistema tipográfico estejam prontas antes da
 *   navegação offline (evita FOUT em rede zero).
 *
 * Idempotente e silencioso. Nunca falha o carregamento do app.
 */

const BUCKET = 'cathedra-breviary-assets-v1';

/** URLs de assets binários que o Breviário depende (ícones/imagens brand). */
const BREVIARY_ASSET_URLS: readonly string[] = [
  '/favicon.ico',
];

/** Nomes de fontes carregadas pelo tema — pré-resolve para uso offline. */
const BREVIARY_FONT_QUERIES: readonly string[] = [
  '400 1em sans-serif',
  '700 1em sans-serif',
];

async function warmBrowserCache(urls: readonly string[]): Promise<void> {
  await Promise.allSettled(
    urls.map((u) =>
      fetch(u, { cache: 'force-cache', credentials: 'omit' }).catch(() => null),
    ),
  );
}

async function persistToCacheStorage(urls: readonly string[]): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(BUCKET);
    await Promise.allSettled(
      urls.map(async (url) => {
        const existing = await cache.match(url);
        if (existing) return;
        try {
          const res = await fetch(url, { cache: 'force-cache', credentials: 'omit' });
          if (res.ok) await cache.put(url, res.clone());
        } catch { /* silent */ }
      }),
    );
  } catch { /* silent */ }
}

async function warmFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.allSettled(
      BREVIARY_FONT_QUERIES.map((q) => document.fonts.load(q).catch(() => null)),
    );
    await document.fonts.ready.catch(() => undefined);
  } catch { /* silent */ }
}

let warmed = false;

/**
 * Idempotente: aquece browser + Cache Storage + fontes uma única vez por sessão.
 * Adiciona URLs extras (ex.: imagens do dia) via `extraUrls`.
 */
export async function preloadBreviaryOfflineAssets(
  extraUrls: readonly string[] = [],
): Promise<void> {
  const urls = [...BREVIARY_ASSET_URLS, ...extraUrls];
  const jobs: Promise<unknown>[] = [warmBrowserCache(urls), persistToCacheStorage(urls), warmFonts()];
  if (!warmed) warmed = true;
  await Promise.allSettled(jobs);
}
