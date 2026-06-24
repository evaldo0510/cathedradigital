// IndexedDB cache for Bible chapters and Catechism paragraphs
// Enables offline access to previously read content
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'cathedra_cache';
const DB_VERSION = 3; // v3: adds liturgical-calendar store

export interface CacheEntry {
  key: string;
  data: any;
  cachedAt: number;
  v?: number; // Version for invalidation
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('bible')) {
        db.createObjectStore('bible', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('catechism')) {
        db.createObjectStore('catechism', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('liturgy')) {
        db.createObjectStore('liturgy', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('liturgical-calendar')) {
        db.createObjectStore('liturgical-calendar', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function getFromStore(storeName: string, key: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        resolve(entry?.data ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function putInStore(storeName: string, key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const CACHE_SYNC_VERSION = 7; // Sync with Bible component
    store.put({ key, data, cachedAt: Date.now(), v: CACHE_SYNC_VERSION } as CacheEntry);
    localStorage.setItem('cathedra_last_sync', Date.now().toString());
    window.dispatchEvent(new CustomEvent('cathedra_cache_updated'));
  } catch {
    // Silently fail — cache is best-effort
  }
}

// ─── Bible Cache ───

export async function getCachedBibleChapter(book: string, chapter: number): Promise<any | null> {
  return getFromStore('bible', `${book}:${chapter}`);
}

export async function cacheBibleChapter(book: string, chapter: number, data: any): Promise<void> {
  return putInStore('bible', `${book}:${chapter}`, data);
}

// ─── Catechism Cache ───

export async function getCachedCatechismParagraph(paragraph: number): Promise<any | null> {
  return getFromStore('catechism', `p:${paragraph}`);
}

export async function cacheCatechismParagraph(paragraph: number, data: any): Promise<void> {
  return putInStore('catechism', `p:${paragraph}`, data);
}

// ─── Liturgy Cache ───

export async function getCachedLiturgy(dateKey: string): Promise<any | null> {
  return getFromStore('liturgy', dateKey);
}

export async function cacheLiturgy(dateKey: string, data: any): Promise<void> {
  return putInStore('liturgy', dateKey, data);
}

// ─── Liturgical Calendar (month grid) Cache ───
// Persists the response of the `liturgical-calendar` edge function with a TTL
// so the calendar page does not hit the function on every reload.

const LITURGICAL_CALENDAR_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const liturgicalCalendarKey = (year: number, month: number, calendar = 'general-la', lang = 'la') =>
  `${calendar}:${lang}:${year}-${String(month).padStart(2, '0')}`;

export async function getCachedLiturgicalMonth(
  year: number,
  month: number,
  opts: { calendar?: string; lang?: string; ttlMs?: number } = {},
): Promise<{ data: any; cachedAt: number; isStale: boolean } | null> {
  try {
    const db = await openDB();
    const key = liturgicalCalendarKey(year, month, opts.calendar, opts.lang);
    return new Promise((resolve) => {
      const tx = db.transaction('liturgical-calendar', 'readonly');
      const req = tx.objectStore('liturgical-calendar').get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (!entry) return resolve(null);
        const ttl = opts.ttlMs ?? LITURGICAL_CALENDAR_TTL_MS;
        const age = Date.now() - (entry.cachedAt ?? 0);
        resolve({ data: entry.data, cachedAt: entry.cachedAt, isStale: age > ttl });
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cacheLiturgicalMonth(
  year: number,
  month: number,
  data: any,
  opts: { calendar?: string; lang?: string } = {},
): Promise<void> {
  return putInStore('liturgical-calendar', liturgicalCalendarKey(year, month, opts.calendar, opts.lang), data);
}

export async function deleteFromStore(storeName: string, key: string): Promise<void> {

  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
    window.dispatchEvent(new CustomEvent('cathedra_cache_updated'));
  } catch (e) {
    console.error('Failed to delete from store:', e);
  }
}

export async function getAllFromStore(storeName: string): Promise<CacheEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function clearAllCaches(): Promise<void> {
  try {
    const db = await openDB();
    const stores = ['bible', 'catechism', 'liturgy'];
    stores.forEach(s => {
      const tx = db.transaction(s, 'readwrite');
      tx.objectStore(s).clear();
    });
    localStorage.removeItem('cathedra_last_sync');
    window.dispatchEvent(new CustomEvent('cathedra_cache_updated'));
  } catch (e) {
    console.error('Failed to clear caches:', e);
  }
}

// ─── Import / Export ───

export async function exportCache(): Promise<string> {
  const data: Record<string, CacheEntry[]> = {};
  const stores = ['bible', 'catechism', 'liturgy'];
  
  for (const store of stores) {
    data[store] = await getAllFromStore(store);
  }
  
  return JSON.stringify({
    version: DB_VERSION,
    exportedAt: Date.now(),
    data
  });
}

export async function importCache(jsonString: string): Promise<void> {
  const parsed = JSON.parse(jsonString);
  if (parsed.version !== DB_VERSION) throw new Error('Versão do cache incompatível');
  
  const db = await openDB();
  for (const storeName in parsed.data) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const entry of parsed.data[storeName]) {
      store.put(entry);
    }
  }
  localStorage.setItem('cathedra_last_sync', Date.now().toString());
  window.dispatchEvent(new CustomEvent('cathedra_cache_updated'));
}

// ─── Stats ───

export async function getCacheStats() {
  const stores = ['bible', 'catechism', 'liturgy'];
  const stats: Record<string, number> = {};
  let total = 0;
  
  for (const store of stores) {
    const items = await getAllFromStore(store);
    stats[store] = items.length;
    total += items.length;
  }
  
  return {
    ...stats,
    total,
    lastSync: localStorage.getItem('cathedra_last_sync')
  };
}

// ─── Pre-load logic ───

export async function preloadCatechism(start: number, count: number, onProgress?: (p: number) => void): Promise<void> {
  for (let i = 0; i < count; i++) {
    const paragraph = start + i;
    if (paragraph > 2865) break;
    
    const cached = await getCachedCatechismParagraph(paragraph);
    if (cached) continue;

    try {
      const { data, error } = await supabase.functions.invoke('catechism-text', { 
        body: { paragraph } 
      });
      if (!error && data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (!parsed.status || parsed.status !== 'not_cached') {
          await cacheCatechismParagraph(paragraph, {
            paragraph,
            content: parsed.content,
            language: parsed.language || 'pt',
            status: parsed.status,
            textoBase: parsed.textoBase,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to preload catechism §${paragraph}`, e);
    }
    
    onProgress?.(Math.round(((i + 1) / count) * 100));
  }
}

export async function preloadBible(bookAbbr: string, startChapter: number, count: number, onProgress?: (p: number) => void): Promise<void> {
  for (let i = 0; i < count; i++) {
    const chapter = startChapter + i;
    
    const cached = await getCachedBibleChapter(bookAbbr, chapter);
    if (cached) continue;

    try {
      const { data, error } = await supabase.functions.invoke('bible-text', { 
        body: { book: bookAbbr, chapter } 
      });
      if (!error && data) {
        await cacheBibleChapter(bookAbbr, chapter, data);
      }
    } catch (e) {
      console.error(`Failed to preload bible ${bookAbbr} ${chapter}`, e);
    }
    
    onProgress?.(Math.round(((i + 1) / count) * 100));
  }
}

