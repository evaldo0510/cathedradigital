// IndexedDB cache for Bible chapters and Catechism paragraphs
// Enables offline access to previously read content

const DB_NAME = 'cathedra_cache';
const DB_VERSION = 1;

interface CacheEntry {
  key: string;
  data: any;
  cachedAt: number;
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
    store.put({ key, data, cachedAt: Date.now() } as CacheEntry);
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

export async function deleteFromStore(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(key);
  } catch {}
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
  } catch {}
}
