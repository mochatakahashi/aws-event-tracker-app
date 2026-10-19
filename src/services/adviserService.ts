import type { Announcement, SignoffRequest } from '../types/adviser';
import { apiJson, delay, generateId, isRemoteAvailable, localCollection } from './apiClient';

/**
 * Adviser features, through /api/notifications (no extra serverless function):
 * announcements to the officers and sign-off ("papirma") requests.
 * Without the API they are kept in localStorage.
 */
const API = '/api/notifications';
const localAnn = localCollection<Announcement>('aws-event-tracker.announcements.v1', () => []);
const localSign = localCollection<SignoffRequest>('aws-event-tracker.signoffs.v1', () => []);
const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export async function getAnnouncements(viewerId: string): Promise<Announcement[]> {
  if (await isRemoteAvailable(API)) return apiJson<Announcement[]>(`${API}?action=announcements&viewerId=${encodeURIComponent(viewerId)}`);
  return delay(localAnn.load().sort(newest));
}

export async function postAnnouncement(
  input: { title: string; message: string },
  actor: { personId: string; name: string; role?: string },
): Promise<Announcement> {
  if (!input.title.trim() || !input.message.trim()) throw new Error('Add a title and a message.');
  if (await isRemoteAvailable(API)) {
    return apiJson<Announcement>(`${API}?action=announce`, { method: 'POST', body: JSON.stringify({ ...input, actorId: actor.personId }) });
  }
  const item: Announcement = {
    id: generateId('ann'),
    audience: 'officers',
    title: input.title.trim(),
    message: input.message.trim(),
    authorId: actor.personId,
    authorName: actor.name,
    authorRole: actor.role === 'admin' ? 'admin' : 'adviser',
    createdAt: new Date().toISOString(),
  };
  localAnn.save([...localAnn.load(), item]);
  return delay(item);
}

export async function deleteAnnouncement(id: string, actorId: string): Promise<void> {
  if (await isRemoteAvailable(API)) {
    await apiJson(`${API}?action=announcement&id=${encodeURIComponent(id)}&actorId=${encodeURIComponent(actorId)}`, { method: 'DELETE' });
    return;
  }
  localAnn.save(localAnn.load().filter((a) => a.id !== id));
}

export async function getSignoffs(viewerId: string): Promise<SignoffRequest[]> {
  if (await isRemoteAvailable(API)) return apiJson<SignoffRequest[]>(`${API}?action=signoffs&viewerId=${encodeURIComponent(viewerId)}`);
  return delay(localSign.load().sort(newest));
}

export async function requestSignoff(
  input: { title: string; details?: string; link?: string; eventId?: string },
  actor: { personId: string; name: string },
): Promise<SignoffRequest> {
  if (!input.title.trim()) throw new Error('What needs signing? Add a title.');
  if (input.link && !/^https?:\/\//i.test(input.link)) throw new Error('The file link must start with https://');
  if (await isRemoteAvailable(API)) {
    return apiJson<SignoffRequest>(`${API}?action=signoff`, { method: 'POST', body: JSON.stringify({ ...input, actorId: actor.personId }) });
  }
  const item: SignoffRequest = {
    ...input,
    id: generateId('sgn'),
    title: input.title.trim(),
    requestedBy: actor.personId,
    requestedByName: actor.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  localSign.save([...localSign.load(), item]);
  return delay(item);
}

export async function reviewSignoff(
  id: string,
  decision: 'approved' | 'returned',
  actor: { personId: string; name: string },
  comment?: string,
): Promise<SignoffRequest> {
  if (decision === 'returned' && !comment?.trim()) throw new Error('Say what needs to change before returning it.');
  if (await isRemoteAvailable(API)) {
    return apiJson<SignoffRequest>(`${API}?action=signoff-review`, {
      method: 'POST',
      body: JSON.stringify({ id, decision, comment, actorId: actor.personId }),
    });
  }
  const all = localSign.load();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) throw new Error('Request not found');
  all[idx] = { ...all[idx], status: decision, comment: comment?.trim() || undefined, reviewedBy: actor.personId, reviewedByName: actor.name, reviewedAt: new Date().toISOString() };
  localSign.save(all);
  return delay(all[idx]);
}
