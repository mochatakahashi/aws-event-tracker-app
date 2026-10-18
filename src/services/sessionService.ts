import type { Session, Stamp, NewStampInput } from '../types/session';
import { seedSessions, seedStamps } from './seedData';

const SESSIONS_KEY = 'aws-event-tracker.sessions.v5';
const STAMPS_KEY = 'aws-event-tracker.stamps.v5';

/** Simulated network latency (ms). */
const LATENCY = 100;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

let useRemoteApi: boolean | null = null;

async function checkRemoteApi(): Promise<boolean> {
  if (typeof window === 'undefined' || import.meta.env?.MODE === 'test') {
    return false;
  }
  if (useRemoteApi !== null) return useRemoteApi;
  try {
    const res = await fetch('/api/sessions', { method: 'GET' });
    if (res.status === 503 || !res.ok) {
      useRemoteApi = false;
      return false;
    }
    useRemoteApi = true;
    return true;
  } catch {
    useRemoteApi = false;
    return false;
  }
}

function loadLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function loadLocalStamps(): Stamp[] {
  try {
    const raw = localStorage.getItem(STAMPS_KEY);
    return raw ? (JSON.parse(raw) as Stamp[]) : [];
  } catch {
    return [];
  }
}

function saveLocalStamps(stamps: Stamp[]) {
  localStorage.setItem(STAMPS_KEY, JSON.stringify(stamps));
}

function ensureLocalSeeded() {
  const currentSessions = loadLocalSessions();
  if (currentSessions.length === 0 || currentSessions.some((s) => s.eventId !== 'evt-1')) {
    saveLocalSessions(seedSessions);
    saveLocalStamps(seedStamps);
  }
}

// ─── Session CRUD ─────────────────────────────────────────────────────────────

export async function getSessions(): Promise<Session[]> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLocalSessions(data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local sessions:', err);
  }

  ensureLocalSeeded();
  return delay(loadLocalSessions());
}

export async function getSessionsByEvent(eventId: string): Promise<Session[]> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch(`/api/sessions?eventId=${encodeURIComponent(eventId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local sessions by event:', err);
  }

  ensureLocalSeeded();
  const all = loadLocalSessions();
  return delay(all.filter((s) => s.eventId === eventId));
}

export async function getSessionById(id: string): Promise<Session | undefined> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (err) {
    console.warn('Falling back to local session lookup:', err);
  }

  ensureLocalSeeded();
  const all = loadLocalSessions();
  return delay(all.find((s) => s.id === id));
}

// ─── Stamp CRUD ───────────────────────────────────────────────────────────────

export async function getStamps(): Promise<Stamp[]> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch('/api/stamps');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveLocalStamps(data);
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local stamps:', err);
  }

  ensureLocalSeeded();
  return delay(loadLocalStamps());
}

export async function getStampsByAttendee(attendeeId: string): Promise<Stamp[]> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch(`/api/stamps?attendeeId=${encodeURIComponent(attendeeId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local stamps by attendee:', err);
  }

  ensureLocalSeeded();
  const all = loadLocalStamps();
  return delay(all.filter((s) => s.attendeeId === attendeeId));
}

export async function getStampsBySession(sessionId: string): Promise<Stamp[]> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch(`/api/stamps?sessionId=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Falling back to local stamps by session:', err);
  }

  ensureLocalSeeded();
  const all = loadLocalStamps();
  return delay(all.filter((s) => s.sessionId === sessionId));
}

export async function createStamp(input: NewStampInput): Promise<Stamp> {
  try {
    if (await checkRemoteApi()) {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const created = await res.json();
        const local = loadLocalStamps().filter((s) => s.id !== created.id);
        saveLocalStamps([...local, created]);
        return created;
      }
    }
  } catch (err) {
    console.warn('Falling back to local createStamp:', err);
  }

  ensureLocalSeeded();
  const stamps = loadLocalStamps();
  const stamp: Stamp = {
    ...input,
    id: `stp-${Date.now()}`,
  };
  stamps.push(stamp);
  saveLocalStamps(stamps);
  return delay(stamp);
}

async function errorFrom(res: Response, fallback: string): Promise<Error> {
  const data = await res.json().catch(() => ({}));
  return new Error((data as { error?: string })?.error || fallback);
}

/**
 * Approve a stamp. Only admins and officers on the event's stamp team can
 * (the server checks); a refusal is shown, never faked locally.
 */
export async function approveStamp(stampId: string, officerId: string): Promise<Stamp> {
  if (await checkRemoteApi()) {
    const res = await fetch(`/api/stamps?id=${encodeURIComponent(stampId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', actorId: officerId }),
    });
    if (!res.ok) throw await errorFrom(res, 'Could not approve the stamp. Try again.');
    const approved = await res.json();
    saveLocalStamps(loadLocalStamps().map((s) => (s.id === stampId ? approved : s)));
    return approved;
  }

  ensureLocalSeeded();
  const stamps = loadLocalStamps();
  const idx = stamps.findIndex((s) => s.id === stampId);
  if (idx === -1) throw new Error('Stamp not found');
  stamps[idx] = {
    ...stamps[idx],
    status: 'approved',
    approvedBy: officerId,
    approvedAt: new Date().toISOString(),
  };
  saveLocalStamps(stamps);
  return delay(stamps[idx]);
}

/** Decline (delete) a stamp request — stamp team only (server-checked). */
export async function declineStamp(stampId: string, officerId?: string): Promise<boolean> {
  if (await checkRemoteApi()) {
    const qs = `id=${encodeURIComponent(stampId)}${officerId ? `&actorId=${encodeURIComponent(officerId)}` : ''}`;
    const res = await fetch(`/api/stamps?${qs}`, { method: 'DELETE' });
    if (!res.ok) throw await errorFrom(res, 'Could not decline the stamp. Try again.');
    saveLocalStamps(loadLocalStamps().filter((s) => s.id !== stampId));
    return true;
  }

  ensureLocalSeeded();
  let stamps = loadLocalStamps();
  const before = stamps.length;
  stamps = stamps.filter((s) => s.id !== stampId);
  saveLocalStamps(stamps);
  return delay(stamps.length < before);
}
