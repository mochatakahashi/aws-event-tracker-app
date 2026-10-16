import type { EventUploadItem } from '../types/upload';
import { uploadImageToS3 } from './storageService';

const DB_NAME = 'aws_event_tracker_uploads_v1';
const STORE_NAME = 'uploads';
const STORAGE_KEY = 'aws_event_recent_uploads';

/** Open or create the IndexedDB store for storing picture files and metadata. */
function openUploadsDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Failed to open IndexedDB for uploads, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/** Read items from localStorage fallback. */
function getFromLocalStorage(): EventUploadItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save items to localStorage fallback. */
function saveToLocalStorage(items: EventUploadItem[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep top 30 in localStorage to prevent hitting 5MB quota
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
  } catch (err) {
    console.warn('Failed to save uploads to localStorage:', err);
  }
}

/** Check if remote DynamoDB endpoint is available. */
async function fetchRemoteUploads(): Promise<EventUploadItem[] | null> {
  if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
    return null;
  }
  try {
    const res = await fetch('/api/uploads', { method: 'GET' });
    if (!res.ok || res.status === 503) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Returns all recent uploads, sorted newest first.
 * Merges IndexedDB, localStorage, and remote DynamoDB results.
 */
export async function getRecentUploads(options?: {
  eventId?: string;
  category?: string;
  limit?: number;
}): Promise<EventUploadItem[]> {
  const limit = options?.limit ?? 20;

  // 1. Try remote DynamoDB first
  const remote = await fetchRemoteUploads();
  
  // 2. Read from IndexedDB
  let idbItems: EventUploadItem[] = [];
  const db = await openUploadsDB();
  if (db) {
    try {
      idbItems = await new Promise<EventUploadItem[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      idbItems = [];
    }
  }

  // 3. Fallback to localStorage
  const localItems = getFromLocalStorage();

  // Merge items by id
  const map = new Map<string, EventUploadItem>();
  for (const item of [...(remote || []), ...idbItems, ...localItems]) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  let list = Array.from(map.values());

  // Filter by eventId if provided
  if (options?.eventId) {
    list = list.filter((i) => i.eventId === options.eventId);
  }

  // Filter by category if provided
  if (options?.category) {
    list = list.filter((i) => i.category === options.category);
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  return list.slice(0, limit);
}

/**
 * Returns the single most recent upload (or null if none exist).
 */
export async function getLatestUpload(options?: {
  eventId?: string;
  category?: string;
}): Promise<EventUploadItem | null> {
  const list = await getRecentUploads({ ...options, limit: 1 });
  return list[0] || null;
}

/**
 * Save an upload record to both local persistent file storage (IndexedDB) and the backend API.
 */
export async function saveUploadRecord(item: EventUploadItem): Promise<void> {
  // 1. Save to IndexedDB
  const db = await openUploadsDB();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed saving to IndexedDB:', err);
    }
  }

  // 2. Save to localStorage
  const current = getFromLocalStorage();
  const next = [item, ...current.filter((x) => x.id !== item.id)];
  saveToLocalStorage(next);

  // 3. Attempt saving to remote DynamoDB
  try {
    await fetch('/api/uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch(() => {});
  } catch {
    // Non-fatal if offline
  }

  // 4. Dispatch event for UI reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('event-upload-saved', { detail: item }));
  }
}

/**
 * Delete an upload record from storage.
 */
export async function deleteUploadRecord(id: string): Promise<void> {
  // 1. IndexedDB
  const db = await openUploadsDB();
  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  }

  // 2. localStorage
  const current = getFromLocalStorage();
  saveToLocalStorage(current.filter((x) => x.id !== id));

  // 3. Remote DynamoDB
  try {
    await fetch(`/api/uploads?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}

  // 4. Dispatch event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('event-upload-deleted', { detail: { id } }));
  }
}

/** Helper: Convert File to base64 Data URL for local file storage */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Complete upload workflow:
 * 1. Attempts Amazon S3 upload via presigned URL.
 * 2. If S3 fails or is not configured (e.g. local development or offline),
 *    gracefully stores the file directly in local IndexedDB file storage.
 * 3. Registers the item in the recent uploads database.
 * 4. Returns the created EventUploadItem.
 */
export async function uploadAndRecordImage(
  file: File,
  options?: {
    eventId?: string;
    eventTitle?: string;
    category?: 'banner' | 'speaker' | 'gallery' | 'general';
    onProgress?: (percent: number) => void;
  }
): Promise<EventUploadItem> {
  let fileUrl = '';
  let storageType: 's3' | 'local' = 's3';

  try {
    // Attempt S3 upload
    fileUrl = await uploadImageToS3(file, options?.onProgress);
  } catch (s3Err) {
    console.warn('S3 upload unavailable, saving to local file storage (IndexedDB):', s3Err);
    // Graceful fallback to persistent IndexedDB file storage
    fileUrl = await fileToDataUrl(file);
    storageType = 'local';
    options?.onProgress?.(100);
  }

  const uploadItem: EventUploadItem = {
    id: `upl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url: fileUrl,
    name: file.name || 'uploaded-image.jpg',
    size: file.size,
    mimeType: file.type || 'image/jpeg',
    uploadedAt: new Date().toISOString(),
    eventId: options?.eventId,
    eventTitle: options?.eventTitle,
    category: options?.category || 'banner',
    storageType,
  };

  await saveUploadRecord(uploadItem);
  return uploadItem;
}
