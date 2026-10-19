/**
 * Small helpers shared by the services that talk to the Vercel `/api/*`
 * functions (backed by DynamoDB) and fall back to the browser's localStorage
 * when the API is not available (e.g. `npm run dev`, where `/api` does not run).
 */

const remoteCache = new Map<string, Promise<boolean>>();

/**
 * Whether `/api/<path>` is live. Cached per path for the page's lifetime.
 * A response only counts when it is JSON: `vite dev` answers unknown routes
 * with index.html, which must not be mistaken for a working API.
 */
export function isRemoteAvailable(path: string): Promise<boolean> {
  if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
    return Promise.resolve(false);
  }
  let cached = remoteCache.get(path);
  if (!cached) {
    // The API exists when it answers with JSON, even if the database behind it
    // is failing right now (reads then come from the saved copy, writes show
    // an error instead of silently going to this browser only). 503 means the
    // database isn't configured at all (local mode).
    cached = fetch(path, { method: 'GET' })
      .then((res) => res.status !== 503 && (res.headers.get('content-type') || '').includes('application/json'))
      .catch(() => Boolean(readCache(path)));
    remoteCache.set(path, cached);
  }
  return cached;
}

// ── Saved copies of what the database last returned ──────────────────────────
// If the database (or the network) fails, pages keep showing the last good
// data instead of going blank or falling back to the old built-in sample data.

const CACHE_PREFIX = 'aws-event-tracker.cache.v1:';
const CACHE_MAX_CHARS = 1_500_000;
/** Whether a saved copy of this URL exists. */
export function hasSavedCopy(url: string): boolean {
  return Boolean(readCache(url));
}

/** Fired when a page is showing saved data because the database couldn't be reached. */
export const OFFLINE_EVENT = 'aws-event-tracker:offline';

function readCache(url: string): { at: string; data: unknown } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    return raw ? (JSON.parse(raw) as { at: string; data: unknown }) : null;
  } catch {
    return null;
  }
}

function writeCache(url: string, data: unknown) {
  try {
    const raw = JSON.stringify({ at: new Date().toISOString(), data });
    if (raw.length <= CACHE_MAX_CHARS) localStorage.setItem(CACHE_PREFIX + url, raw);
  } catch {
    /* storage full or blocked: skip */
  }
}

let lastOfflineAt: string | null = null;
/** When the app last fell back to saved data in this tab (null if it hasn't). */
export function lastOfflineSavedAt(): string | null {
  return lastOfflineAt;
}

function announceOffline(at: string) {
  lastOfflineAt = at;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OFFLINE_EVENT, { detail: { at } }));
}

/** Remove every saved copy (called on sign-out so a shared computer keeps nothing). */
export function clearSavedCopies() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/**
 * GET JSON, keeping a saved copy. When the request fails (database down,
 * no connection), the saved copy is returned and the app shows a notice.
 * Returns null only when it fails and nothing was saved yet.
 */
export async function cachedGet<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => undefined);
    if (res.ok && data !== undefined) {
      writeCache(url, data);
      return data as T;
    }
    // A real "not found" or "not allowed" answer is not an outage: no saved copy.
    if (res.status < 500) return null;
    throw new Error((data as { error?: string } | undefined)?.error || `HTTP ${res.status}`);
  } catch {
    const saved = readCache(url);
    if (!saved) return null;
    announceOffline(saved.at);
    return saved.data as T;
  }
}

/** fetch + JSON with a readable error message from the API. Reads (GET) fall back to the saved copy. */
export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const isRead = !init?.method || init.method.toUpperCase() === 'GET';
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    });
  } catch (err) {
    const saved = isRead ? readCache(url) : null;
    if (saved) {
      announceOffline(saved.at);
      return saved.data as T;
    }
    throw err instanceof Error ? new Error(`Can't reach the server: ${err.message}`) : err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const saved = isRead && res.status >= 500 ? readCache(url) : null;
    if (saved) {
      announceOffline(saved.at);
      return saved.data as T;
    }
    throw new Error((data && (data as { error?: string }).error) || `Request failed (HTTP ${res.status})`);
  }
  if (isRead) writeCache(url, data);
  return data as T;
}

/** A list persisted in localStorage, seeded on first use. */
export function localCollection<T>(key: string, seed: () => T[]) {
  function load(): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T[];
    } catch {
      /* fall through to seed */
    }
    const initial = seed();
    save(initial);
    return initial;
  }
  function save(items: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* storage full or blocked - keep working in memory */
    }
  }
  function reset() {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return { load, save, reset };
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

/** Simulated latency for the local fallback, so loading states still show. */
export function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
