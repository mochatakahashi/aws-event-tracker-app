import type { AppNotification, NewNotification } from '../types/notification';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';
import { getUsers } from './authService';

/**
 * In-app notifications (the bell). Stored in DynamoDB through
 * `/api/notifications` when deployed, and in localStorage otherwise.
 */

const API = '/api/notifications';
const local = localCollection<AppNotification>('aws-event-tracker.notifications.v1', () => []);

/** Fired on `window` whenever notifications change, so the bell badge refreshes. */
export const NOTIFICATIONS_CHANGED = 'aws-event-tracker:notifications-changed';

function announceChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

/** A person's notifications, newest first. */
export async function getNotifications(personId: string): Promise<AppNotification[]> {
  if (await isRemoteAvailable(API)) {
    return apiJson<AppNotification[]>(`${API}?personId=${encodeURIComponent(personId)}`);
  }
  return delay(
    local
      .load()
      .filter((n) => n.personId === personId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    40,
  );
}

export async function getUnreadCount(personId: string): Promise<number> {
  return (await getNotifications(personId)).filter((n) => !n.read).length;
}

/** Create a notification for each recipient. Returns how many were created. */
export async function createNotification(n: NewNotification): Promise<number> {
  if (await isRemoteAvailable(API)) {
    const res = await apiJson<{ created: number }>(API, { method: 'POST', body: JSON.stringify(n) });
    announceChange();
    return res.created;
  }
  const recipients = new Set(n.personIds || []);
  if (n.toRole === 'admin') {
    (await getUsers()).filter((u) => u.role === 'admin').forEach((u) => recipients.add(u.personId));
  }
  const now = new Date().toISOString();
  const created: AppNotification[] = [...recipients].map((personId) => ({
    id: generateId('ntf'),
    personId,
    kind: n.kind,
    title: n.title,
    message: n.message,
    link: n.link,
    read: false,
    createdAt: now,
  }));
  local.save([...local.load(), ...created]);
  announceChange();
  return created.length;
}

/** Same as createNotification, but never throws (the main action already succeeded). */
export async function notifyInApp(n: NewNotification): Promise<void> {
  try {
    await createNotification(n);
  } catch (e) {
    console.warn('Could not create in-app notification:', e);
  }
}

export async function markRead(id: string, read = true): Promise<void> {
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?id=${encodeURIComponent(id)}${read ? '' : '&unread=1'}`, { method: 'PUT', body: '{}' });
  } else {
    local.save(local.load().map((n) => (n.id === id ? { ...n, read, readAt: read ? new Date().toISOString() : undefined } : n)));
  }
  announceChange();
}

export async function markAllRead(personId: string): Promise<void> {
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?personId=${encodeURIComponent(personId)}&all=1`, { method: 'PUT', body: '{}' });
  } else {
    const readAt = new Date().toISOString();
    local.save(local.load().map((n) => (n.personId === personId && !n.read ? { ...n, read: true, readAt } : n)));
  }
  announceChange();
}

export async function deleteNotification(id: string): Promise<void> {
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  } else {
    local.save(local.load().filter((n) => n.id !== id));
  }
  announceChange();
}

/** Tests / dev only. */
export function __resetNotifications(): void {
  local.reset();
}
