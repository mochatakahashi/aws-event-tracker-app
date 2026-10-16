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
    cached = fetch(path, { method: 'GET' })
      .then((res) => res.ok && (res.headers.get('content-type') || '').includes('application/json'))
      .catch(() => false);
    remoteCache.set(path, cached);
  }
  return cached;
}

/** fetch + JSON with a readable error message from the API. */
export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && (data as { error?: string }).error) || `Request failed (HTTP ${res.status})`);
  }
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
      /* storage full or blocked — keep working in memory */
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
